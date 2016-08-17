var security = require('../utils/security');
var communication = require('../utils/communication');
var router = require('express').Router();

module.exports = function(app){
	
	router.get('/communication/main', security.isLoggedInAdmin, function(req, res) {
		res.render('communication/main', { title: 'Kommunikation'});
	});
	
	router.post('/communication/email', security.isLoggedInAdmin, function(req, res) {
		communication.getEmails(req.body.mode, function(emails) {
			res.setHeader('Content-Length', emails.length);
			res.setHeader('Content-Type', 'text/text');
			res.setHeader('Content-Disposition', 'inline; filename=emailaddresses.txt');
			res.write(emails);
			res.end();		
		});
	});

	app.use('/', router);
};
