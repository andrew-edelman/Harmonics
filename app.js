require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const _ = require('lodash');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const flash = require('connect-flash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.secret,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//Mongoose DB Setup

//Create database connection

mongoose.connect("mongodb://localhost:27017/harmonicsDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

//Create collection schema

const gigSchema = new mongoose.Schema ({
  date: {
    type: Date,
    required: [true]
  },
  genre: String,
});

const venueSchema = new mongoose.Schema ({
  venueName: {
	   type: String,
	   required: [true]
  },
  venueBookingEmail: {
	   type: String,
	   required: [true]
  },
  venueAddress: String,
  venueWebsite: String,
  gigs: [gigSchema],
  venueAbout: String
});

const bandSchema = new mongoose.Schema ({
  bandName: {
    type: String,
    required: [true]
  },
  bandEmail: String,
  bandGenre: String,
  bandWebsite: String,
  bandMusic: String,
  gigs: [gigSchema],
  bandAbout: String
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    require: [true]
  },
  password: {
    type: String,
    require: [true]
  },
  firstName: String,
  lastName: String,
  bands: [bandSchema],
  venues: [venueSchema]
});

userSchema.plugin(passportLocalMongoose);


//Create model and collection using a schema
//The collection name should be singular and capitalized, mongoose will make it plural and uncapitalize the name

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy({passReqToCallback: true}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const Venue = mongoose.model("Venue", venueSchema);

const Gig = mongoose.model("Gig", gigSchema);

const Band = mongoose.model("Band", bandSchema);


//Create root Route

app.get("/", function(req, res){
  res.render("landing", {currentUser: req.user});
});

//Create route for gigs list

app.get("/gigslist", function(req, res){

  Venue.find({}, function(err, foundVenues){

    res.render("gigslist", {venueList: foundVenues, currentUser: req.user});
  });

});


//route for accessing the list of all venues

app.route("/venues")
.get(function(req, res){

  Venue.find({}, function(err, foundVenues){
    res.render("venues", {venueList: foundVenues, currentUser: req.user});
  });
});

//Route for accessing a single venue details

app.route("/venues/:_id")
.get(function(req, res){
  console.log(req.params);
  var foundVenueID = req.params._id;

  Venue.findById({_id: foundVenueID}, function(err, foundVenue){
    console.log(foundVenue);
    User.findOne({venues: {$elemMatch: {_id: foundVenueID}}}, function(err, venueUser){
      console.log(venueUser);
      var myVenue = _.isEqual(venueUser._id, req.user._id);
      if (myVenue == true){
        console.log("my venue");
        res.render("venuepage", {venue: foundVenue, currentUser: req.user, myVenue: myVenue});

      } else {
        console.log("not my venue");
        res.render("venuepage", {venue: foundVenue, currentUser: req.user, myVenue: myVenue});

      }
    });
  });

});

//Route for creating a new gig

app.route("/venues/:_id/creategig")
.get(function(req, res){
  Venue.findOne({_id: req.params._id}, function(err, foundVenue){
    res.render("creategig", {venue: foundVenue, currentUser: req.user});
  });

})
.post(function(req, res){
  const newGig = new Gig ({
    date: req.body.newGigDate,
    genre: req.body.newGigGenre,
  });

  newGig.save();

  // var pushGig = {date: req.body.newGigDate, genre: req.body.newGigGenre};

  Venue.updateOne({_id: req.body.venueID}, {$push: {gigs: newGig}}, function(err){
    if (!err) {
      console.log("gig successfully created to venue");
    } else {
      console.log(err);
    }
  });

  User.updateOne({_id: req.user._id, 'venues._id': req.body.venueID}, {$push: {'venues.$.gigs': newGig}}, {upsert: true}, function(err){
    if (!err) {
      console.log("gig successfully pushed to user");
    } else {
      console.log(err);
    }
  });

  res.redirect("/venues/" + req.body.venueID);

});

//Create a new band route

app.route("/createband")
.get(function(req, res){
  res.render("createband", {currentUser: req.user});
})
.post(function(req, res){

  const newBand = new Band ({
    bandName: req.body.bandName,
    bandEmail: req.body.bandEmail,
    bandGenre: req.body.bandGenre,
    bandWebsite: req.body.bandWebsite,
    bandMusic: req.body.bandMusic,
    bandAbout: req.body.bandAbout
  });

  newBand.save();

  // var pushBand = {bandName: req.body.bandName,
  // bandEmail: req.body.bandEmail,
  // bandGenre: req.body.bandGenre,
  // bandWebsite: req.body.bandWebsite,
  // bandMusic: req.body.bandMusic,
  // bandAbout: req.body.bandAbout};

  User.updateOne({_id: req.user._id}, {$push: {bands: newBand}}, function(err){
    if (!err) {
      console.log("band successfully created");
    } else {
      console.log(err);
    }
  });

  res.redirect("/profile/" + req.user._id);

});

//Create a new venue route

app.route("/createvenue")
.get(function(req, res){
  res.render("createvenue", {currentUser: req.user});
})
.post(function(req, res){

  const newVenue = new Venue ({
    venueName: req.body.venueName,
    venueBookingEmail: req.body.venueBookingEmail,
    venueAddress: req.body.venueAddress,
    venueWebsite: req.body.venueWebsite,
    venueAbout: req.body.venueAbout
  });

  newVenue.save();

  // var pushVenue = {venueName: req.body.venueName,
  // venueBookingEmail: req.body.venueBookingEmail,
  // venueAddress: req.body.venueAddress,
  // venueWebsite: req.body.venueWebsite,
  // venueAbout: req.body.venueAbout};

  User.updateOne({_id: req.user._id}, {$push: {venues: newVenue}}, function(err){
    if (!err) {
      console.log("venue successfully created");
    } else {
      console.log(err);
    }
  });

  res.redirect("/profile/" + req.user._id);

});

//User profile  page
app.route("/profile/:_id")
.get(function(req, res){
  const findUserID = req.user._id;
  User.findOne({_id: findUserID}, function(err, foundUser){
    res.render("profile", {currentUser: foundUser});
  });
})
.post(function(req, res){

});

//User Authentication Routes
app.route("/login")
.get(function(req, res){
  res.render("login", {flash: req.flash('error'), currentUser: req.user});
})
.post(function(req, res, next){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err){
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/profile/" + req.user._id);
      });
    }
  });

});

app.route("/register")
.get(function(req, res){
  res.render("register", {currentUser: req.user});
})
.post(function(req, res){

  User.register(
    {username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName},
    req.body.password,
    function(err, user){
    if (err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/profile/" + req.user._id);
      });
    }
  });

});

app.route("/logout")
.get(function(req, res){
  req.logout();
  res.redirect("/");
});

//Create server port

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
