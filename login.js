module.exports = function(app) {
    app.get('/login', function(request, response) {
        response.send('hey there!')
    });
}