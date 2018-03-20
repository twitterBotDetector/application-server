exports.logoutUser = function(app) {
    app.get('/logout', function (req, res) {
        req.session.destroy(function (err) {
            res.redirect('/');
        });
    });
}