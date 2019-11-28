var security = require('../utils/security');
var moment = require("moment");
var fs = require('fs');
var utils = require ('../utils');
var format = require ('../utils/format');
var router = require('express').Router();

module.exports = function(app){
	router.get('/docx/:id', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);		
		models.user.findOne({
			where: {
				id: req.params.id
			}
		}).then(function(user) {
			var data = {
				"first_name": user.first_name, 
				"last_name": user.last_name, 
				"logon_id": user.logon_id, 
				"password": user.password,
				"street": user.street,
				"zip": user.zip,
				"place": user.place,
				"country": user.country,
				"telno": user.telno,
				"email": user.email,
				"IBAN": user.IBAN,
				"BIC": user.BIC
			};

		    models.file.findOne({
				where: {
					id: req.query.fileid
			}}).then(function(file) {
				return file.path;		
			}).catch((error) => {
				return req.query.file;
			}).then((template) => {

				utils.generateDocx(template, user.logon_id, data, req.session.project);
				var file = fs.readFileSync("./tmp/"+ user.logon_id +".docx", 'binary');

				res.setHeader('Content-Length', file.length);
				res.setHeader('Content-Type', 'application/msword');
				res.setHeader('Content-Disposition', 'inline; filename=' + user.logon_id + '.docx');
				res.write(file, 'binary');
				res.end();
			});
		});	
	});

	router.get('/docx_c/:id', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.contract.findOne({
			where : {
				id: req.params.id
			},
			include: { 
				model: models.transaction, 
				as: 'transactions'
			}			
		}).then(function(contract) {
			models.user.findByIdFetchFull(models, contract.user_id,function(user){
				var data = {
					"first_name": user.first_name, 
					"last_name": user.last_name, 
					"logon_id": user.logon_id, 
					"password": user.password,
					"street": user.street,
					"zip": user.zip,
					"place": user.place,
					"country": user.country,
					"telno": user.telno,
					"email": user.email,
					"IBAN": user.IBAN,
					"BIC": user.BIC,
					"amount": format.formatNumber(contract.amount,2),
					"interest_rate": format.formatNumber(contract.interest_rate,2),
					"has_interest": contract.interest_rate > 0,
					"contract_date": format.formatDate(contract.contract_date),
					"termination_type": contract.termination_type,
					"termination_date": format.formatDate(contract.termination_date),
					"termination_period": contract.termination_period,
					"termination_period_type": contract.termination_period_type,
					"notes": contract.notes,
					"status": contract.status,
					"transactionList": contract.transactions
				};

				models.file.findOne({
					where: {
						id: req.query.fileid
				}}).then(function(file) {
					return file.path;		
				}).catch((error) => {
					return req.query.file;
				}).then((template) => {
					try{
						utils.generateDocx(template, user.logon_id, data, req.session.project);
					}catch(e) {
						e.properties.errors.forEach(function(err) {
						    console.log(err);
						});
					}
					var file = fs.readFileSync("./tmp/"+ user.logon_id +".docx", 'binary');

					res.setHeader('Content-Length', file.length);
					res.setHeader('Content-Type', 'application/msword');
					res.setHeader('Content-Disposition', 'inline; filename=' + user.logon_id + '_' + contract.id + '.docx');
					res.write(file, 'binary');
					res.end();
				});
			});	
		});
	});


	app.use('/', router);
};
