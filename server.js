var express = require('express');
var compression = require('compression');
var app = express();

var helmet = require('helmet');
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", 'maxcdn.bootstrapcdn.com'],
    fontSrc: ["'self'", 'fonts.googleapis.com'],
    scriptSrc: ["'self'", 'ajax.googleapis.com'],
    imgSrc: ["'self'", 'pbs.twimg.com'],
    upgradeInsecureRequests: true,
    frameAncestors: ["'none'"],
    defaultSrc: ["'none'"],
    baseUri: ["'none'"]
  }
}));

app.use(compression());
app.use(helmet());
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
var passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy;

try {
  var config = require("./config");
} catch (e) {
  var config = {
    "session_secret": process.env.session_secret,
    "mongodb_url": process.env.mongodb_url,
    "node_environment": process.env.node_environment
  }
}

var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);

mongoose.connect(config.mongodb_url);

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