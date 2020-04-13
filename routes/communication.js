const models  = require('../models');
const security = require('../utils/security');
const communication = require('../utils/communication');
const router = require('express').Router();
const sequelize = require("sequelize");
const moment = require("moment");
const json2csv = require('json2csv');

module.exports = function(app){
	
	router.post('/communication/email', security.isLoggedInAdmin, function(req, res) {
		communication.getEmails(req.body.mode)
			.then(emails => {
				res.setHeader('Content-Length', emails.length);
				res.setHeader('Content-Type', 'text/text');
				res.setHeader('Content-Disposition', 'inline; filename=emailaddresses.txt');
				res.write(emails);
				res.end();		
			});
	});

	router.post('/communication/addresses', security.isLoggedInAdmin, function(req, res) {
		var fieldNames = ["Nachname", "Vorname", "Strasse", "PLZ", "Ort", "Land", "Telefonnummer", "E-Mail"];
		var fieldList = ['last_name', 'first_name','street', 'zip', 'place', 'country', 'telno', 'email'];
		models.user.getUsers(models, req.body.mode, moment(req.body.to_date, "DD.MM.YYYY"))
			.then(users => {
				json2csv({ data: users, fieldNames: fieldNames, fields: fieldList }, function(err, csv) {
					if (err) {
					  	res.render(error, {error:err, message: 'Adressdatei konnte nicht generiert werden'});
					} else {
						res.setHeader('Content-Length', (new Buffer(csv)).length);
						res.setHeader('Content-Type', 'text/csv');
						res.setHeader('Content-Disposition', 'inline; filename=Addressliste.csv');
						res.write(csv);
						res.end();
					}
				});
			});
	});

	app.use('/', router);
};
