var requestClassification = require('request');
var redis = require('redis');

var Twit = require('twit');

var fs = require('fs');
try {
    var config = require("./config");
}
catch (e) {
    try {
        var config = {
          "consumer_key": fs.readFileSync('/run/secrets/consumer_key', 'utf8').trim(),
          "consumer_secret": fs.readFileSync('/run/secrets/consumer_secret', 'utf8').trim(),
          "access_token": fs.readFileSync('/run/secrets/access_token', 'utf8').trim(),
          "access_token_secret": fs.readFileSync('/run/secrets/access_token_secret', 'utf8').trim(),
          "redis_hostname": fs.readFileSync('/run/secrets/redis_hostname', 'utf8').trim(),
          "redis_port": fs.readFileSync('/run/secrets/redis_port', 'utf8').trim(),
          "lambda_url": fs.readFileSync('/run/secrets/lambda_url', 'utf8').trim(),
          "node_environment": fs.readFileSync('/run/secrets/node_environment', 'utf8').trim()
        } 
    }
    catch(err) {
        var config = {
            "consumer_key":         process.env.consumer_key,
            "consumer_secret":      process.env.consumer_secret,
            "access_token":         process.env.access_token,
            "access_token_secret":  process.env.access_token_secret,
            "redis_hostname":       process.env.redis_hostname,
            "redis_port":           process.env.redis_port,
            "redis_password":       process.env.redis_password,
            "lambda_url":           process.env.lambda_url,
            "node_environment":     process.env.node_environment
        }
    }     
}

/**************************************************************************
 * If environment is production, then connect to the hosted redis server
 * Else, connect to the local redis client for testing
***************************************************************************/
if (config.node_environment === 'production') {
    var client = redis.createClient(config.redis_port, config.redis_hostname, {no_ready_check: true});
    client.auth(config.redis_password, function (err) {
        if (err) throw err;
    });
} 
else {
    client = redis.createClient(config.redis_port, config.redis_hostname);
    client.on("error", function (err) {
        console.log(`Error: ${err}`);
    });
}

client.on('connect', function() {
    console.log('Connected to Redis');
});

exports.extractUserData = function(app, bodyParser) {
    //Handles request sent to /extractUserData
    app.post('/api/extractUserData', function(request, response) {
        if (request.body.userId != null) {
            userId = request.body.userId;
            console.log(`userId: ${userId}`);

            //If the classification of userId is already cached in redis, then return it.
            //Else, fetch the user_details using the Twitter API
            client.get(userId, function (err, reply) {
                if (err) throw err;
                if (reply) {
                    userClassification = {
                        bot: reply
                    }
                    response.send(userClassification);
                }
                else {
                    let urlRatio = 0, source = null, entropy = 0;
                    let numOfTweets = 20;
                    let username = '';
                    let userData = {};
                    
                    if (request.user) {
                        var T = new Twit({
                          consumer_key: config.consumer_key,
                          consumer_secret: config.consumer_secret,
                          access_token: request.user.token,
                          access_token_secret: request.user.tokenSecret,
                        });
                    }
                    else {
                        var T = new Twit({
                            consumer_key:         config.consumer_key,
                            consumer_secret:      config.consumer_secret,
                            access_token:         config.access_token,
                            access_token_secret:  config.access_token_secret
                        });
                    }

                    T.get('users/show', { user_id: userId }, function (err, data, resp) {
                        if (err) {
                            if (!response.headersSent) {
                                console.log(err);
                                response.sendStatus(404);
                            }
                        }
                        else {
                            username = data.screen_name;
                            userData.friendToFollowerRatio = data.followers_count / data.friends_count;
                        }
                    })
                    .then(function() {
                        T.get('search/tweets', { q: 'from:' + String(username), count: numOfTweets }, function (err, data, resp) {
                            if (err) {
                                if (!response.headersSent) {
                                    response.sendStatus(404);
                                }
                            }
                            else {
                                userData.urlRatio = extractUrlRatio(data, numOfTweets);
                                userData.source   = extractSource(data);
                                userData.entropy  = extractEntropy(data, numOfTweets);
                            }
                        })
                        .then(function() {
                            T.get('friends/ids', { screen_name: String(username), count: 20 }, function (err, data, resp) {
                                if (err) {
                                    if (!response.headersSent) {
                                        response.sendStatus(404);
                                    }
                                }
                                else {
                                    if (data.ids.length == 0) {
                                        if (!response.headersSent) {
                                            response.sendStatus(404);
                                        }
                                    }
                                    else {
                                        let followBackCount = 0;
                                        let friendshipPromises = [];
                
                                        //Go through every id and get the friendship status for that id
                                        //Also, store the promise in friendshipPromises array to keep a list of promises made
                                        data.ids.map(
                                            id => friendshipPromises.push(T.get('friendships/show', { source_id: userId, target_id: id }, function (err, data, resp) {
                                                if (err) {
                                                    console.log(`No friendship found source: ${userId} target: ${id}`);
                                                }
                                                else {
                                                    let following = data.relationship.target.following;
                                                    let follows = data.relationship.target.followed_by;
                
                                                    if (following && follows) {
                                                        followBackCount += 1;
                                                    }
                                                }
                                            }))
                                        );
                
                                        //Once all the promises in friendshipPromises are fulfilled, the reciprocityRatio is calculated and response is returned
                                        Promise.all(friendshipPromises)
                                        .then(function() {
                                            userData.reciprocityRatio = followBackCount / data.ids.length;
                                            classifyUser(response, userId, userData);                               
                                        });                     
                                    }
                                }
                            })
                        });
                    });
                }
            });
        }
        else {
            return response.sendStatus(404);
        }
    });
}

function extractUrlRatio(data, numOfTweets) {
    let sum = 0;
    console.log(`First tweet: ${data.statuses[0]}`);
    for(let tweet of data.statuses) {
        sum += tweet.entities.urls.length;
    }
    return sum / numOfTweets;
}

function extractSource(tweetData) {
    let maxCount = 0;
    let map = new Map();
    let maxEl = '';

    for(let tweet of tweetData.statuses) {
        if(map.has(tweet.source)) {
            map.set(tweet.source, map.get(tweet.source) + 1);
        }
        else { 
            map.set(tweet.source, 1);
        }

        if(map.get(tweet.source) > maxCount) {
            maxEl = tweet.source;
            maxCount = map.get(tweet.source);
        }
    }

    return maxEl;
}

function extractEntropy(data, numOfTweets) {
    let sum = 0;

    for(let i = 1; i < data.statuses.length; i++) {
        diff = (new Date(data.statuses[i - 1].created_at) - new Date(data.statuses[i].created_at));
        sum += diff;
    }

    return  sum / numOfTweets;
}

//Send a request to lambda function with the user_details to classify the user as bot or human
function classifyUser(response, userId, userData) {
    requestClassification.post(
        config.lambda_url,
        { json: userData },
        function (error, resp, body) {
            if (resp.body == 1 || resp.body == 0) {
                //store the classification response (bot[1] or human[0]) in redis and set the cache expiry to 24 hours
                client.set(userId, resp.body, redis.print);
                client.expire(userId, 86400);
                userClassification = {
                    bot: String(resp.body)
                }
            }
            else {
                userClassification = {
                    bot: "1"
                }
            }
            response.send(userClassification);
        }
    );
}