//Import Twit Package
var Twit = require('twit');

//Import Config File
var config = require('/config');

//object of twit to call functions inside it
var tweeB = new Twit(config);

var total = 2

var params = {
	  q: 'from:gandhivivek96' , count: 2
}

T.get('search/tweets', params, searchedData);

function searchedData(err, data, response) {
  for(var i =0; i<total; i++){
      
    console.log("Time " + data.statuses[i].tweet.created_at);
    console.log("Name " + data.statuses[i].tweet.user.name);
	console.log("Tweet " + data.statuses[i].tweet.text);
  }	
  
}