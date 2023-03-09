/* jshint esversion: 8 */
const Sequelize = require("sequelize");
const moment = require('moment');
const fs = require('fs');
const settings = require('../../utils/settings');
const LDAPStrategy = require('passport-ldapauth');
var OpenIDConnectStrategy = require('passport-openidconnect');
const crypto = require("crypto");
const models = require('../../models');
const utils = require('..');
var log_file = fs.createWriteStream(__dirname + '/../../log/access.log', { flags: 'a' });

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;


function logAuthFailed(req, userid) {
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	log_file.write(moment().format('YYYY-MM-DD HH:mm:SS') + ' AUTH-FAIL: URL: ' + req.url + ', USER: ' + userid + ', CLIENT IP: ' + ip + '\n');
	console.log(moment().format('YYYY-MM-DD HH:mm:SS') + ' AUTH-FAIL: URL: ' + req.url + ', USER: ' + userid + ', CLIENT IP: ' + ip);
}
// expose this function to our app using module.exports
module.exports = function (passport) {

	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function (user, done) {
		done(null, { id: user.id, administrator: user.isAdmin() });
	});

	// used to deserialize the user
	passport.deserializeUser(function (sessionUser, done) {
		if (sessionUser.administrator) {
			models.admin.findByPk(sessionUser.id).then(function (user) {
				done(null, user);
			});
		} else {
			models.user.findByPk(sessionUser.id).then(function (user) {
				done(null, user);
			});
		}
	});

	// =========================================================================
	// LOCAL LOGIN =============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

	passport.use('local-login', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField: 'userid',
		passwordField: 'password',
		passReqToCallback: true // allows us to pass back the entire request to the callback
	},
		function (req, userid, password, done) { // callback with email and password from our form

			// find a user whose email is the same as the forms email
			// we are checking to see if the user trying to login already exists
			models.user.findOne({ where: Sequelize.or({ logon_id: userid }, { email: userid }) }).then(function (user) {

				// if no user is found, return the message
				if (!user) {
					logAuthFailed(req, userid);
					return done(null, false, req.flash('loginMessage', 'Benutzer nicht gefunden')); // req.flash is the way to set flashdata using connect-flash
				}

				// if the user is found but the password is wrong
				// if (user.password && user.password !== password || !user.password && !user.comparePassword(password)) {
				// 	logAuthFailed(req,userid);
				// 	return done(null, false, req.flash('loginMessage', 'Falsches Passwort')); // create the loginMessage and save it to session as flashdata
				// }
				user.lastLogin = moment();
				user.loginCount = (user.loginCount || 0) + 1;
				models.user.update({
					lastLogin: user.lastLogin,
					loginCount: user.loginCount
				}, {
					where: { id: user.id }, trackOptions: utils.getTrackOptions(user, false)
				})
					.then(() => {
						done(null, user);
					});
			});

		}));

	// =========================================================================
	// OICD User LOGIN ========================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'
	if (settings.config.get('auth.admin.method') === "oidc") {
		passport.use('openidconnect-user', new OpenIDConnectStrategy(settings.config.get('auth.admin.oidc'),

			function (req, user, done) { // callback with email and password from our form

				// find a user whose email is the same as the forms email
				// we are checking to see if the user trying to login already exists
				models.user.findOne({ where: Sequelize.or({ logon_id: user.username }, { email: user.username }) }).then(function (dbUser) {
					// if no user is found, return the message
					if (!dbUser) {
						models.user.create({
							logon_id: user.username,
							email: user.username,
							firstName: user.given_name,
							lastName: user.family_name,
							lastLogin: moment(),
							passwordHashed: crypto.randomBytes(16).toString("hex"),
							loginCount: 1
						}, { trackOptions: utils.getTrackOptions(user, false) }).then(function (createdUser) {
							done(null, createdUser);
						});
					}
					dbUser.lastLogin = moment();
					dbUser.loginCount = (dbUser.loginCount || 0) + 1;
					dbUser.update({
						lastLogin: dbUser.lastLogin,
						loginCount: dbUser.loginCount
					}, {
						where: { id: dbUser.id }, trackOptions: utils.getTrackOptions(dbUser, false)
					})
						.then(() => {
							done(null, dbUser);
						});
				});

			}));

	}
	// =========================================================================
	// LDAP ADMIN LOGIN ========================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'
	if (settings.config.get('auth.admin.method') === "ldap") {
		passport.use('ldap-login-admin', new LDAPStrategy(settings.config.get('auth.admin.ldap'), (req, user, done) => {
			models.admin.findAll({
				where: {
					ldap: true
				}
			}).then(function (users) {
				// if there are no LDAP users, all LDAP users are accepted
				if (!users || users.length == 0) {
					req.flash('loginMessage', "Keine LDAP Accounts");
					done(null, false);
				} else {
					// if there are LDAP users, then check if current cn exists
					var dbUser = users.find((dbUser) => { return dbUser.logon_id.toLowerCase() === user.cn.toLowerCase(); });
					if (dbUser) {
						dbUser.lastLogin = moment();
						dbUser.loginCount = (dbUser.loginCount || 0) + 1;
						models.admin.update({
							lastLogin: dbUser.lastLogin,
							loginCount: dbUser.loginCount
						}, {
							where: { id: dbUser.id }, trackOptions: utils.getTrackOptions(dbUser, false)
						})
							.then(() => {
								done(null, dbUser);
							});
					} else {
						req.flash('loginMessage', "LDAP Benutzer*in nicht in Liste der Admin-Accounts");
						done(null, false);
					}
				}
			});
		}));
	}

	// =========================================================================
	// OICD ADMIN LOGIN ========================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'
	if (settings.config.get('auth.admin.method') === "oidc") {
		console.log("OIDC Admin");
		console.log(settings.config.get('auth.admin.oidcAdmin'));
		passport.use('openidconnect-admin', new OpenIDConnectStrategy(settings.config.get('auth.admin.oidcAdmin'), (req, user, done) => {
			models.admin.findAll({
				where: {
					ldap: true
				}
			}).then(function (users) {
				// if there are no LDAP users, all LDAP users are accepted
				if (!users || users.length == 0) {
					// req.flash('loginMessage', "Keine OIDC Accounts");
					done(null, false);
				} else {
					// if there are LDAP users, then check if current cn exists
					var dbUser = users.find((dbUser) => { return dbUser.email.toLowerCase() === user.username.toLowerCase(); });
					if (dbUser) {
						dbUser.lastLogin = moment();
						dbUser.loginCount = (dbUser.loginCount || 0) + 1;
						models.admin.update({
							lastLogin: dbUser.lastLogin,
							loginCount: dbUser.loginCount
						}, {
							where: { id: dbUser.id }, trackOptions: utils.getTrackOptions(dbUser, false)
						})
							.then(() => {
								done(null, dbUser);
							});
					} else {
						return done(null, false, req.flash('loginMessage', 'OIDC Benutzer*in nicht in Liste der Admin-Accounts')); // req.flash is the way to set flashdata using connect-flash
					}
				}
			});
		}));
	}
	// =========================================================================
	// LOCAL ADMIN LOGIN =======================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

	passport.use('local-login-admin', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField: 'userid',
		passwordField: 'password',
		passReqToCallback: true // allows us to pass back the entire request to the callback
	},
		function (req, userid, password, done) { // callback with email and password from our form
			models.admin.findOne({ where: Sequelize.or({ logon_id: userid }, { email: userid }) }).then(function (user) {
				// if no user is found, return the message
				if (!user) {
					logAuthFailed(req, userid);
					return done(null, false, req.flash('loginMessage', 'Benutzer nicht gefunden')); // req.flash is the way to set flashdata using connect-flash
				}

				// if the user is found but the password is wrong
				if (!user.comparePassword(password)) {
					logAuthFailed(req, userid);
					return done(null, false, req.flash('loginMessage', 'Falsches Passwort')); // create the loginMessage and save it to session as flashdata
				}

				user.lastLogin = moment();
				user.loginCount = (user.loginCount || 0) + 1;
				models.admin.update({
					lastLogin: user.lastLogin,
					loginCount: user.loginCount
				}, {
					where: { id: user.id }, trackOptions: utils.getTrackOptions(user, false)
				})
					.then(() => {
						done(null, user);
					})
					.catch(error => {
						done(null, false, req.flash('loginMessage', 'Fehler: ' + error)); // create the loginMessage and save it to session as flashdata
					});
			});

		}));

};