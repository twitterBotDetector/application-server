var Twit = require('twit');

exports.fetchTweets = function (app) {
  app.get('/api/fetchTweets', function (request, response) {
    if (request.user) {
      var T = new Twit({
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: request.user.token,
        access_token_secret: request.user.tokenSecret,
      });

      T.get('statuses/home_timeline', {count: 9}, function (err, data, resp) {

        response.send(data);
      });
    }
    else {
      response.sendStatus(404);
    }
  });
}