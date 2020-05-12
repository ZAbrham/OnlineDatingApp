var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');
var handlebars = exphbs.handlebars;
var moment = require('moment');
var marked = require('marked');
var app = express();
var PORT = 3000;
var User = require('./User.js')


//data-base
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', () => {
  console.log('MONGODB connection error!');
  process.exit(1);
})

/// MIDDLEWARE
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({ defaultLayout: 'main', partialsDir: "views/partials/" }));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));
// Sockets
var http = require('http').Server(app);
var io = require('socket.io')(http);


//serever set up
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.engine('handlebars', exphbs({ defaultLayout: 'main', partialsDir: "views/partials/" }));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));

//global vars
var filters = ['teen', '20-29', '30-39', '>40', 'random'];

//home page
app.get('/', (req, res) => {
  User.find({}, (err, users) => {
    if(err) throw err;
    res.render('home', {
      users: users,
      filters: filters
    })
  })
});

//accessing accounts by username
app.get('/account/:username', (req, res) =>{
  var username = req.params.username;
  User.findOne({username:username}, (err, user) => {
    if(err) throw err;
    res.render('user', {
      user: user
    })
  })
})

//filtering by country
app.get('/country/:country', (req, res) => {
  var country = req.params.country;
  User.find({country: req.params.country}, (err, users) =>{
    if(err) throw err;
    res.render('home', {
      users: users,
      country: country,
      filters: filters
    })
  })
});

//filtering by age
app.get('/filter/:by', (req, res) => {
  var filter = req.params.by;
  if(filter === 'teen'){
    res.render('fbi');
  }else if(filter === '20-29'){
    User.find({}, (err, users) => {
      if(err) throw err;
      users = users.filter(user => user.age >= 20 && user.age <= 28);
      res.render('home', {
        users: users,
        filters: filters
      });
    });
  }else if(filter === '30-39'){
    User.find({}, (err, users) => {
      if(err) throw err;
      users = users.filter(user => user.age >= 30 && user.age <= 39);
      res.render('home', {
        users: users,
        filters: filters
      });
    });
  }else if(filter === '>40'){
    User.find({}, (err, users) => {
      if(err) throw err;
      users = users.filter(user => user.age >= 40);
      res.render('home', {
        users: users,
        filters: filters
      });
    });
  }else if(filter === 'random'){
    User.find({}, (err, users) => {
      if(err) throw err;
      var user = _.sample(users);
      res.render('user', {
        user:user
      })
    })

  }else {
    res.redirect('/');
  }
})

//
app.get('/create', (req,res)=> {
  res.render('create', {});
});


app.post('/create', (req, res) => {
  if(req.body.password !== req.body.cpassword)
    return res.render('create', {again: true});
  else {
    var user = new User({
      username: req.body.username,
      age: parseInt(req.body.age),
      sex: req.body.sex,
      country: req.body.country,
      password: req.body.username,
      hobbies: req.body.hobbies.split(','),
      messages: []
    });
    user.save((err) =>{
      if(err) throw err;
      io.emit('new user', user);
      res.redirect('/');
    })
  }

});

io.on('connection', function(socket) {
    console.log('NEW connection.');
    socket.on('disconnect', function(){
        console.log('Oops. A user disconnected.');
    });
});

// Start listening on port PORT
http.listen(PORT, function() {
    console.log('Server listening on port:', PORT);
});
