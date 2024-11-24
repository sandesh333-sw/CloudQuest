const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

// Middleware to validate a review
const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        throw new ExpressError(400, error.message);
    } else {
        next();
    }
};

// Middleware to validate a listing
const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        throw new ExpressError(400, error.message);
    } else {
        next();
    }
};

// Route: POST Review
router.post(
    "/:id/reviews",
    validateReview,
    wrapAsync(async (req, res) => {
        const listing = await Listing.findById(req.params.id);
        if (!listing) throw new ExpressError(404, "Listing not found");

        const newReview = new Review(req.body.review);
        listing.reviews.push(newReview);

        await newReview.save();
        await listing.save();

        res.redirect(`/listings/${listing._id}`);
    })
);

// Route: DELETE Review
router.delete(
    "/:id/reviews/:reviewId",
    wrapAsync(async (req, res) => {
        const { id, reviewId } = req.params;

        // Remove the review from the listing
        await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

        // Delete the review from the Review collection
        await Review.findByIdAndDelete(reviewId);

        res.redirect(`/listings/${id}`);
    })
);

// Route: Index
router.get(
    "/",
    wrapAsync(async (req, res) => {
        const alllistings = await Listing.find({});
        res.render("listings/index", { alllistings });
    })
);

// Route: New Listing Form
router.get("/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Route: Show Listing
router.get(
    "/:id",
    wrapAsync(async (req, res) => {
        const listing = await Listing.findById(req.params.id).populate("reviews");
        if (!listing) throw new ExpressError(404, "Listing not found");

        res.render("listings/show", { listing });
    })
);

// Route: Create Listing
router.post(
    "/",
    validateListing,
    wrapAsync(async (req, res) => {
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    })
);

// Route: Edit Listing Form
router.get(
    "/:id/edit",
    wrapAsync(async (req, res) => {
        const listing = await Listing.findById(req.params.id);
        if (!listing) throw new ExpressError(404, "Listing not found");

        res.render("listings/edit.ejs", { listing });
    })
);

// Route: Update Listing
router.put(
    "/:id",
    validateListing,
    wrapAsync(async (req, res) => {
        await Listing.findByIdAndUpdate(req.params.id, { ...req.body.listing });
        res.redirect("/listings");
    })
);

// Route: Delete Listing
router.delete(
    "/:id",
    wrapAsync(async (req, res) => {
        const deletedListing = await Listing.findByIdAndDelete(req.params.id);
        if (!deletedListing) throw new ExpressError(404, "Listing not found");

        res.redirect("/listings");
    })
);

module.exports = router;
