var passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy;
var User = require('./models/user');

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new TwitterStrategy({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    callbackURL: process.env.CALLBACK_URL
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