var express = require('express');
var compression = require('compression');
var app = express();

var helmet = require('helmet');
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'none'"],
    manifestSrc: ["'self'"],
    connectSrc: ["'self'"],
    styleSrc: ["'self'", 'maxcdn.bootstrapcdn.com', 'fonts.googleapis.com'],
    fontSrc: ["'self'", 'fonts.gstatic.com', 'maxcdn.bootstrapcdn.com'],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'pbs.twimg.com'],
    frameAncestors: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'self'"]
  }
}));

app.use(helmet.referrerPolicy({ policy: 'same-origin' }))

app.use(compression());
app.use(helmet());
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
var passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy;

var fs = require('fs');
/*
 * First, check for config.js file for environment variables
 * If that fails, then check /run/secrets/ (assuming docker environment)
 * Else, fall back to process.env
 */
try {
  var config = require("./config");
} catch (e) {
  try {
    var config = {
      "node_environment": fs.readFileSync('/run/secrets/node_environment', 'utf8').trim(),
      "mongodb_url": fs.readFileSync('/run/secrets/mongodb_url', 'utf8').trim(),
      "session_secret": fs.readFileSync('/run/secrets/session_secret', 'utf8').trim()
    } 
  }
  catch(err) {
    console.log(err);
    var config = {
      "node_environment": process.env.node_environment,
      "mongodb_url": process.env.mongodb_url,
      "session_secret": process.env.session_secret
    } 
  }
}

var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);

mongoose.connect(config.mongodb_url);

if (config.node_environment === 'production') {
  app.use(session({
    proxy: true,
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      touchAfter: 24 * 3600 // time period in seconds
    })
  }));
}
else {
  app.use(session({
    proxy: true,
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      touchAfter: 24 * 3600 // time period in seconds
    })
  }));
}

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

var login = require('./login.js')
login.twitterAuth(app);
login.authCallback(app);

var fetchTweets = require('./fetchTweets.js');
fetchTweets.fetchTweets(app);

var classifyUserName = require('./classifyUserName');
classifyUserName.classifyUserName(app);

var extractData = require('./extractUserData');
extractData.extractUserData(app, bodyParser);

var logout = require('./logout');
logout.logoutUser(app);

//redirect http traffic to https if app is in production environment
app.use(function(req, res, next) {
  if(config.node_environment === 'production' && req.headers['x-forwarded-proto']!='https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

//index page
app.get('/', (request, response) => {
  if (request.user != null) {
    response.render('index.ejs', {
      userName: request.user.userName
    });
  } else {
    response.render('index', {
      userName: ''
    });
  }
});

var server_port = process.env.PORT || 8085;
app.listen(server_port, function () {
  console.log("Listening on " + server_port);
});