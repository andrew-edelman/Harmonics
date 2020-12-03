const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//Create root route

app.get("/", function(req, res){
  Venue.find({}, function(err, foundVenues){
    res.render("gigslist", {venueList: foundVenues});
  });

});

//New Venue Creation Route

app.route("/newvenue")
.get(function(req, res){

  res.render("newvenue");

})
.post(function(req, res){

  const newVenue = new Venue ({
    venueName: req.body.newVenueName,
    address: req.body.newVenueAddress,
    bookingEmail: req.body.newVenueEmail,
    venueWebsite: req.body.newVenueWebsite,
    aboutVenue: req.body.newVenueAbout
  });

  newVenue.save();

  res.redirect("/");
});

//New Band Creation Route

app.route("/newband")
.get(function(req, res){

  res.render("newband");

})
.post(function(req, res){

  const newBand = new Band ({
    bandName: req.body.newBandName,
    genre: req.body.newBandGenre,
    bandWebsite: req.body.newBandWebsite,
    bandEmail: req.body.newBandEmail,
    linkToMusic: req.body.newBandMusic,
    aboutBand: req.body.newBandAbout
  });

  newBand.save();

  res.redirect("/");
});

//route for accessing the list of all venues

app.route("/venues")
.get(function(req, res){
  Venue.find({}, function(err, foundVenues){
    res.render("venues", {venueList: foundVenues});
  });
});

//Route for accessing a single venue details

app.route("/venues/:venueName")
.get(function(req, res){
  const foundVenueName = req.params.venueName;
  console.log(foundVenueName);
  Venue.findOne({venueName: foundVenueName}, function(err, foundVenue){
    res.render("venuepage", {venue: foundVenue});
  });

});

//Route for creating a new gig

app.route("/venues/:venueName/creategig")
.get(function(req, res){
  res.render("creategig", {venueName: req.params.venueName});
})
.post(function(req, res){
  const newGig = new Gig ({
    date: req.body.newGigDate,
    genre: req.body.newGigGenre,
    onBill: req.body.newGigOnBill
  });

  newGig.save();

  var pushGig = {date: req.body.newGigDate, genre: req.body.newGigGenre, onBill: req.body.newGigOnBill};

  Venue.updateOne({venueName: req.params.venueName}, {$push: {gigs: pushGig}}, function(err){
    if (!err) {
      console.log("gig successfully created to venue");
    } else {
      console.log(err);
    }
  });
  res.redirect("/venues/" + req.params.venueName);

});

//Mongoose DB Setup

//Create database connection

mongoose.connect("mongodb://localhost:27017/harmonicsDB", {useNewUrlParser: true, useUnifiedTopology: true});

//Create collection schema
const gigSchema = new mongoose.Schema ({
  date: {
    type: Date,
    required: [true]
  },
  genre: String,
  onBill: String
});

const venueSchema = new mongoose.Schema ({
  venueName: {
	type: String,
	required: [true]
  },
  address: String,
  bookingEmail: {
    type: String,
    required: [true]
  },
  venueWebsite: String,
  gigs: [gigSchema],
  aboutVenue: String
});

const bandSchema = new mongoose.Schema ({
  bandName: {
    type: String,
    required: [true]
  },
  genre: String,
  bandWebsite: String,
  bandEmail: String,
  linkToMusic: String,
  aboutBand: String
});

//Create model and collection using a schema
//The collection name should be singular and capitalized, mongoose will make it plural and uncapitalize the name

const Venue = mongoose.model("Venue", venueSchema);

const Gig = mongoose.model("Gig", gigSchema);

const Band = mongoose.model("Band", bandSchema);

//Create starter data

// const gig1 = new Gig({
//   date: 1/1/2021,
//   genre: "Rock",
//   onBill: "Sweet Chicle"
// });
//
// gig1.save();
//
// const martyrs = new Venue({
//   venueName: "Martyrs",
//   address: "3855 N Lincoln Ave, Chicago, IL, 60613",
//   bookingEmail: "brenna@martyrslive.com",
//   venueWebsite: "martyrslive.com",
//   gigs: gig1,
//   aboutVenue: "great venue"
// });
//
// martyrs.save();
//
// const sweetchicle = new Band({
//   bandName: "Sweet Chicle",
//   genre: "Blues, Rock, Funk",
//   bandWebsite: "sweetchicle.com",
//   bandEmail: "sweetchicleband@gmail.com",
//   linkToMusic: "sweetchicle.com",
//   aboutBand: "great band"
// });
//
// sweetchicle.save();
//
// Gig.insertMany([gig1], function(err){
//   if (err){
//     console.log(err);
//   } else {
//     console.log("successfully saved gig");
//   }
// });
//
// Venue.insertMany([martyrs], function(err){
//   if (err){
//     console.log(err);
//   } else {
//     console.log("successfully saved venue");
//   }
// });
//
// Band.insertMany([sweetchicle], function(err){
//   if (err){
//     console.log(err);
//   } else {
//     console.log("successfully saved band");
//   }
// });

//Create server port

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
