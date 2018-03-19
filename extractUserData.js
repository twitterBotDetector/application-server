var requestClassification = require('request');
var redis = require('redis');

var Twit = require('twit');
try {
    var config = require("./config");
}
catch (e) {
    var config = {
        "consumer_key":         process.env.consumer_key,
        "consumer_secret":      process.env.consumer_secret,
        "access_token":         process.env.access_token,
        "access_token_secret":  process.env.access_token_secret,
        "redis_hostname":       process.env.redis_hostname,
        "redis_port":           process.env.redis_port,
        "redis_password":       process.env.redis_password,
        "lambda_url":           process.env.lambda_url
    }     
}

//Initialise redis connection
var client = redis.createClient(config.redis_port, config.redis_hostname, {no_ready_check: true});
client.auth(config.redis_password, function (err) {
    if (err) throw err;
});

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
                    response.send(reply);
                }
                else {
                    let urlRatio = 0, source = null, entropy = 0;
                    let numOfTweets = 5;
                    let username = '';
                    let userData = {};
                    
                    var T = new Twit({
                        consumer_key:         config.consumer_key,
                        consumer_secret:      config.consumer_secret,
                        access_token:         config.access_token,
                        access_token_secret:  config.access_token_secret
                    });

                    T.get('users/show', { user_id: userId }, function (err, data, resp) {
                        if (err) {
                            if (!response.headersSent) {
                                console.log(err);
                                response.sendStatus(404);
                            }
                        }
                        else {
                            username = data.screen_name;
                            userData.friendToFollowerRatio = data.friends_count / data.followers_count;
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
                                userData.source = extractSource(data);
                                userData.entropy = extractEntropy(data, numOfTweets);
                            }
                        })
                        .then(function() {
                            T.get('friends/ids', { screen_name: String(username), count: 5 }, function (err, data, resp) {
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
            //store the classification response (bot[1] or human[0]) in redis
            client.set(userId, resp.body, redis.print);
            response.send(String(resp.body));
        }
    );
}