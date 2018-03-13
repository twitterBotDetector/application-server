var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    userId: {type: String, required: true},
    userName: {type: String},
    token: {type: String, required: true},
    tokenSecret: {type: String, required: true}
});

module.exports = mongoose.model('User', userSchema);