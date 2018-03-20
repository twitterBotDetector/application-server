var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
var passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy;

try {
  var config = require("./config");
} catch (e) {
  var config = {
    "session_secret": process.env.session_secret,
    "mongodb_url": process.env.mongodb_url
  }
}

var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);

mongoose.connect(config.mongodb_url);

app.use(session({
  secret: config.session_secret,
  resave: false,
  saveUninitialized: false,
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