var security = require('../utils/security');
var moment = require("moment");
var utils = require('../utils');
var fs = require('fs');
var numeral = require('numeral');
var format = require('../utils/format');
var router = require('express').Router();
var projects = require('../config/projects.json');

module.exports = function(app){

// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
router.get('/profile', security.isLoggedIn, function(req, res) {
	if (req.user.dn || req.user.administrator) {
		res.redirect('/admin');
	} else {
		var models  = require('../models')(req.session.project);
		models.user.findByIdFetchFull(models, req.user.id,function(user){
			res.render('profile', {
				user : user, // get the user out of session and pass to template
				title: "Direktkreditinfo"
			});
		});
	}
});

router.get('/files', security.isLoggedIn, function(req, res) {
	var models  = require('../models')(req.session.project);		
	models.file.findAll({
		where: {
			ref_table: {
		      $like: "infopack_%"
		    }
		}
	}).then(function(files) {
		groups = {
			balance: {
				title: "Jahresabschlüsse",
				files: []
			},
			infopack: {
				title: "Direktkreditinformationen",
				files: []
			},
			other: {
				title: "Sonstige Dateien",
				files: []
			}
		}
		files.map((file => {
			var group = file.ref_table.split("_")[1];
			file.group = group;
			if (groups[group]) {
				groups[group].files.push(file);
			} 
		}))
		res.render('files', { title: 'Dateien und Informationen zum Projekt', groups: groups });
	});		
});


router.post('/accountnotification', security.isLoggedIn, function(req, res) {
	var models  = require('../models')(req.session.project);	
	models.user.findByIdFetchFull(models, req.user.id,function(user){
		var transactionList = user.getTransactionList(req.body.year);
		
		transactionList.sort(function(a,b) {
			if (a.contract_id > b.contract_id)
				return 1;
			else if (b.contract_id > a.contract_id)
				return -1;
			else {	
				if (a.date.diff(b.date) > 0)
					return 1;
				else if(b.date.diff(a.date) > 0)
					return -1;
				else 
					return 0;
			}
		});
		
		var interestTotal = 0;
		transactionList.forEach(function(transaction){
			if (transaction.type.startsWith("Zinsertrag")) {
				interestTotal = interestTotal + transaction.amount;
			}
			transaction.date = format.formatDate(transaction.date);
			transaction.amount = format.formatMoney(transaction.amount);
			transaction.interest_rate = format.formatPercent(transaction.interest_rate);

		});
		
		var data = {
				"id": user.id,
				"first_name": user.first_name?user.first_name:"",
				"last_name": user.last_name?user.last_name:"",
				"street" :user.street,
				"zip": user.zip,
				"place": user.place,
				"country": user.country,
				"telno": user.telno,
				"email": user.email,
				"IBAN": user.IBAN,
				"BIC": user.BIC,				
				"year": req.body.year,
				"current_date": format.formatDate(moment()),
				"transactionList": transactionList,
				"interestTotal": format.formatMoney(interestTotal)};
		var filename =  "Kontomitteilung " + user.id + " " + req.body.year;
	    models.file.find({
			where: {
				ref_table: "template_account_notification"
		}}).then(function(file) {
			return file.path;		
		}).catch((error) => {
			return "account_notification";
		}).then((template) => {
			utils.generateDocx(template, filename, data, req.session.project);

			utils.convertToPdf(filename, function(err) {
				var file;
				if (!err) {
					file = fs.readFileSync("./tmp/"+ filename +".pdf", 'binary');

					res.setHeader('Content-Length', file.length);
					res.setHeader('Content-Type', 'application/pdf');
					res.setHeader('Content-Disposition', 'inline; filename=' + filename + '.pdf');
					res.write(file, 'binary');
					res.end();			
				} else {
					console.log("Error generating PDF: ", err)
					file = fs.readFileSync("./tmp/"+ filename +".docx", 'binary');

					res.setHeader('Content-Length', file.length);
					res.setHeader('Content-Type', 'application/msword');
					res.setHeader('Content-Disposition', 'inline; filename=' + filename + '.docx');
					res.write(file, 'binary');
					res.end();
				}
			});
		});		


	});
});
app.use('/', router);
};
