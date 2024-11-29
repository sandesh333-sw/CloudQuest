const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");

router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

router.post("/signup", wrapAsync(async (req, res) => {
    try{
        const { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password); // Register the user using Passport.js
        console.log(registeredUser); r
        res.redirect("/listings"); 
    } catch(e){
        console.log(e);
        res.redirect("/signup");
    }
   
}));

router.get("/login", (req, res) => {
    res.render("users/login.ejs");
})


router.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login", 
        failureFlash: true, 
    }),
    async (req, res) => {
        req.flash("success", "Welcome to CloudQuest! You are logged in.");
        res.redirect("/listings");
    }
);


module.exports  = router;