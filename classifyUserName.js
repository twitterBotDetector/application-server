var requestClassification = require('request');
var Twit = require('twit');

exports.classifyUserName = function (app) {
    app.get('/api/classifyUserName', function (request, response) {
        if (request.query.userName != null) {
            userName = request.query.userName;

            var T = new Twit({
                consumer_key: process.env.CONSUMER_KEY,
                consumer_secret: process.env.CONSUMER_SECRET,
                access_token: process.env.ACCESS_TOKEN,
                access_token_secret: process.env.ACCESS_TOKEN_SECRET
            });

            T.get('/users/lookup', {screen_name: userName}, function (err, data, resp) {
                if (err) {
                    console.log("User Lookup failed");
                    response.sendStatus(404);
                } else {
                    let host_url = '';
                    if (process.env.NODE_ENV === 'production') {
                        host_url = 'https://tweebotd.herokuapp.com/api/extractUserData';
                    } else {
                        host_url = 'http://127.0.0.1:8085/api/extractUserData';
                    }

                    requestClassification.post({
                            url: host_url, 
                            form: {userId: data[0].id_str},
                            method: 'POST'
                        },
                        function (error, resp, body) {
                            response.send(body);
                        }
                    );
                }
            });
        } else {
            response.sendStatus(400);
        }
    });
}