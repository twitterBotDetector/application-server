var passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy;
var User = require('./models/user');

var fs = require('fs');
try {
  var config = require("./config");
} catch (e) {
  try {
    var config = {
      "consumer_key": fs.readFileSync('/run/secrets/consumer_key', 'utf8').trim(),
      "consumer_secret": fs.readFileSync('/run/secrets/consumer_secret', 'utf8').trim(),
      "callback_url": fs.readFileSync('/run/secrets/callback_url', 'utf8').trim()
    }
  } catch (err) {
    var config = {
      "consumer_key": process.env.consumer_key,
      "consumer_secret": process.env.consumer_secret,
      "callback_url": process.env.callback_url
    }
  }
}

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new TwitterStrategy({
    consumerKey: config.consumer_key,
    consumerSecret: config.consumer_secret,
    callbackURL: config.callback_url
  },
  function (token, tokenSecret, profile, done) {
    User.findOne({
      userId: profile.id
    }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (user) {
        return done(null, user);
      } else {
        var newUser = new User();
        newUser.userId = profile.id;
        newUser.userName = profile.displayName;
        newUser.token = token;
        newUser.tokenSecret = tokenSecret;

        newUser.save((err) => {
          return done(null, newUser);
        })
      }
    });
  }
));

exports.twitterAuth = function (app) {
  app.get('/auth/twitter', passport.authenticate('twitter'));
}

exports.authCallback = function (app) {
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      successRedirect: '/',
      failureRedirect: '/failed'
    }));
}