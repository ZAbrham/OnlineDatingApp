var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var datingSchema = new mongoose.Schema({
  username: {
    type: String
  },
  sex: {
    type: String
  },
  age: {
    type: Number
  },
  country: {
    type: String
  },
  hobbies: {
    type: [String]
  }
});

var User = mongoose.model('User', datingSchema);
module.exports = User;
