var models  = require('../models');
var security = require('../utils/security');
var moment = require("moment");
var utils = require('../utils');
var fs = require('fs');
var numeral = require('numeral');
var format = require('../utils/format');
var router = require('express').Router();

module.exports = function(app){

// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
router.get('/profile', security.isLoggedIn, function(req, res) {
	models.user.findByIdFetchFull(models, req.user.id,function(user){
		res.render('profile', {
			user : user, // get the user out of session and pass to template
			title: "Direktkreditinfo"
		});
	});
});

router.get('/files', security.isLoggedIn, function(req, res) {
    var dk_files = [];
    var dir = "public/files/dk";
    var name;
    var files = fs.readdirSync(dir);
    for (var i in files){
        name = dir + '/' + files[i];
        if (!fs.statSync(name).isDirectory()){
        	dk_files.push({"name": files[i], "link":name});
        }
    }
    
    var balance_files = [];
    dir = "public/files/balance";
    files = fs.readdirSync(dir);
    for (i in files){
        name = dir + '/' + files[i];
        if (!fs.statSync(name).isDirectory()){
        	balance_files.push({"name": files[i], "link":name});
        }
    }
   res.render('files', {
     dk_files : dk_files, balance_files:balance_files, title: "Dateien" // get the user out of session and pass to template
 });
});


router.post('/accountnotification', security.isLoggedIn, function(req, res) {
	
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
			transaction.interest_rate = format.formatPercent(transaction.interest_rate/100);

		});
		
		var data = {
				"id": user.id,
				"first_name": user.first_name?user.first_name:"",
				"last_name": user.last_name?user.first_name:"",
				"street" :user.street,
				"zip": user.zip,
				"place": user.place,
				"year": req.body.year,
				"current_date": format.formatDate(moment()),
				"transactionList": transactionList,
				"interestTotal": format.formatMoney(interestTotal)};
		var filename =  "Kontomitteilung " + user.id + " " + req.body.year;
		utils.generateDocx("account_notification", filename, data);
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
app.use('/', router);
};
