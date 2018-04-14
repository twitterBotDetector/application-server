var requestClassification = require('request');
var Twit = require('twit');

var fs = require('fs');
try {
    var config = require("./config");
} catch (e) {
    try {
        var config = {
            "consumer_key": fs.readFileSync('/run/secrets/consumer_key', 'utf8').trim(),
            "consumer_secret": fs.readFileSync('/run/secrets/consumer_secret', 'utf8').trim(),
            "access_token": fs.readFileSync('/run/secrets/access_token', 'utf8').trim(),
            "access_token_secret": fs.readFileSync('/run/secrets/access_token_secret', 'utf8').trim(),
            "node_environment": fs.readFileSyync('/run/secrets/node_environment', 'utf8').trim()
        }
    } catch (err) {
        var config = {
            "consumer_key": process.env.consumer_key,
            "consumer_secret": process.env.consumer_secret,
            "access_token": process.env.access_token,
            "access_token_secret": process.env.access_token_secret,
            "node_environment": process.env.node_environment
        }
    }
}

exports.classifyUserName = function (app) {
    app.get('/api/classifyUserName', function (request, response) {
        if (request.query.userName != null) {
            userName = request.query.userName;

            var T = new Twit({
                consumer_key: config.consumer_key,
                consumer_secret: config.consumer_secret,
                access_token: config.access_token,
                access_token_secret: config.access_token_secret
            });

            T.get('/users/lookup', {screen_name: userName}, function (err, data, resp) {
                if (err) {
                    console.log("User Lookup failed");
                    response.sendStatus(404);
                } else {
                    let host_url = '';
                    if (config.node_environment === 'production') {
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