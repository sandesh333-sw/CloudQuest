const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// Database connection
async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");
    } catch (err) {
        console.log(err);
    }
}

main();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

// Home Route
app.get("/", (req, res) => {
    res.send("Hi, pulami");
});

//Validate the listing
const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
        
        if(error){
            throw new ExpressError(400, error);
        } else {
            next();
        }
};

// Index Route
app.get("/listings", async (req, res) => {
    try {
        const alllistings = await Listing.find({});
        res.render("listings/index", { alllistings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving listings.");
    }
});

//New route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");

});

// Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    try {
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).send("Listing not found");
        }
        res.render("listings/show", { listing }); // Corrected here
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving listing.");
    }
}));

//Create Route
app.post(
    "/listings", 
    validateListing,
    wrapAsync(async (req, res, next) => {
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
}));

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async(req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
}));

//Update Route
app.put("/listings/:id",
    validateListing,
     wrapAsync(async (req, res) =>{
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect("/listings");

}));

//Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

//REVIEWS
//POST ROUTE
app.post("/listings/:id/reviews", wrapAsync(async(req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
}));



// Sample Listing Route (Commented out)
// app.get("/testListing", async (req, res) => {
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Kathmandu",
//         country: "India",
//     });
//     await sampleListing.save();
//     console.log("Sample was saved");
//     res.send("Successful");
// });



//Errors
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});


app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.render("error.ejs", {message});
});

    // let { statusCode = 500, message = "Something went wrong!"} = err;
    // res.render("error.ejs");
    // res.status(statusCode).send(message);

app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
