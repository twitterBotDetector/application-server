var Twit = require('twit');

var fs = require('fs');
try {
  var config = require("./config");
} catch (e) {
  try {
    var config = {
      "consumer_key": fs.readFileSync('/run/secrets/consumer_key', 'utf8').trim(),
      "consumer_secret": fs.readFileSync('/run/secrets/consumer_secret', 'utf8').trim()
    }
  } catch (err) {
    var config = {
      "consumer_key": process.env.consumer_key,
      "consumer_secret": process.env.consumer_secret
    }
  }
}

exports.fetchTweets = function (app) {
  app.get('/api/fetchTweets', function (request, response) {
    if (request.session) {
      var T = new Twit({
        consumer_key: config.consumer_key,
        consumer_secret: config.consumer_secret,
        access_token: request.user.token,
        access_token_secret: request.user.tokenSecret,
      });

      T.get('statuses/home_timeline', {count: 15}, function (err, data, resp) {

        response.send(data);
      });
    }
  });
}