var express = require('express');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

//index page
app.get('/', function(request, response) {
  response.render('index');
});
  
var server_port = process.env.PORT || 8085;
app.listen(server_port, function () {
    console.log( "Listening on " + server_port  );
});    