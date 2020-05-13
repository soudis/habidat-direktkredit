/* jshint esversion: 8 */
const router = require('express').Router();

module.exports = function(app){

	router.get('/procrastinate', function(req, res) {
		res.render('procrastinate', {lastURL: req.headers.referer});
	});

	app.use('/', router);

};