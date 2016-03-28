// config/passport.js

var Sequelize = require("sequelize");
var models  = require('../models');

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;


function logAuthFailed(req, userid) {
	console.log('AUTH-FAIL: URL: ' + req.url + ', Authentification failure for ' + userid + ' from ' + req.ip);
}
// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
    	models["user"].findById(id).then( function(user) {
            done(null, user);
        });
    });
    
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'userid',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, userid, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
    	console.log('try to logon');
        models["user"].findOne({where: Sequelize.or({logon_id: userid}, {email: userid})}).then( function( user) {

            // if no user is found, return the message
            if (!user) {
            	logAuthFailed(req,userid);
                return done(null, false, req.flash('loginMessage', 'Benutzer nicht gefunden')); // req.flash is the way to set flashdata using connect-flash
            }

            // if the user is found but the password is wrong
            if (user.password != password) {
            	logAuthFailed(req,userid);            	
                return done(null, false, req.flash('loginMessage', 'Falsches Passwort')); // create the loginMessage and save it to session as flashdata
            }

            // all is well, return successful user
            return done(null, user);
        });

    }));
    
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login-admin', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'userid',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, userid, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
    	console.log('try to logon');
        models["user"].findOne({where: Sequelize.or({logon_id: userid}, {email: userid})}).then( function( user) {

            // if no user is found, return the message
            if (!user) {
            	logAuthFailed(req,userid);            	
                return done(null, false, req.flash('loginMessage', 'Benutzer nicht gefunden')); // req.flash is the way to set flashdata using connect-flash
            }

            // if the user is found but the password is wrong
            if (user.password != password) {
            	logAuthFailed(req,userid);            	
                return done(null, false, req.flash('loginMessage', 'Falsches Passwort')); // create the loginMessage and save it to session as flashdata
            }
            
            if (!user.isAdmin()) {
            	logAuthFailed(req,userid);            	
            	return done(null, false, req.flash('loginMessage', 'Das ist leider kein Administrator Account')); // create the loginMessage and save it to session as flashdata
            }

            // all is well, return successful user
            return done(null, user);
        });

    }));

};