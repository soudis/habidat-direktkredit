var express = require('express');
var router = express.Router();
var models  = require('../models');
var passport = require('passport');
var Sequelize = require("sequelize");
var moment = require("moment");
var util = require('util');
var url = require('url');
var utils = require('../utils');
var fs = require('fs');

function redirectReload(redirectUrl) {
  var u = url.parse(redirectUrl, true, false);
  u.query['v'] = +new Date(); // add versioning to bust cache 
  delete u.search;
  return url.format(u);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', message: req.flash('loginMessage') } );
});

/* GET home page. */
router.get('/admin-logon', function(req, res, next) {
  res.render('admin/admin-logon', { title: 'Express', message: req.flash('loginMessage') });
});


// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
router.get('/profile', isLoggedIn, function(req, res) {
	models.user.find({
		where: {
			id: req.user.id
		}, 
		include:{ 
			model: models.contract, 
			as: 'contracts', 
			include : { 
				model: models.transaction, 
				as: 'transactions'
			}
		}
	}).then(function(user) {
    res.render('profile', {
        user : user // get the user out of session and pass to template
    });
	});
});

router.get('/files', isLoggedIn, function(req, res) {
    var dk_files = [];
    var dir = "public/files/dk";
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
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

router.get('/admin', isLoggedInAdmin, function(req, res) {
	res.redirect('/user/list');
});

router.get('/procrastinate', function(req, res) {
	res.render('procrastinate', {lastURL: req.headers.referer});
});

router.get('/user/list', isLoggedInAdmin, function(req, res) {
	models.user.findAll({  	      
		  where: ['administrator <> 1'],
		  include:{ 
				model: models.contract, 
				as: 'contracts', 
				include : { 
					model: models.transaction, 
					as: 'transactions'
				}
			},
			order:[['last_name'], ['first_name'],[{ 
				model: models.contract, 
				as: 'contracts'}, 
				'sign_date'],[{
              model: models.contract, 
				as: 'contracts'					
				},{
			    model: models.transaction, 
				as: 'transactions'
				}, 
				'transaction_date']]
		}).then(function(users){
		res.render('user/list', {users: users, title: 'DK Liste'});
	});
});

/* GET home page. */
router.get('/user/add', isLoggedInAdmin, function(req, res, next) {
  res.render('user/add', { title: 'Neuer Direktkredit', message: req.flash('errorMessage') });
});

/* GET home page. */
router.get('/user/edit/:id', isLoggedInAdmin, function(req, res, next) {
	models.user.find({
		where: {
			id: req.params.id
		}
	}).then(function(user) {
		  res.render('user/edit', { user:user, title: 'Direktkreditgeber*in Bearbeiten', message: req.flash('errorMessage') });
	});	
});

/* GET home page. */
router.get('/contract/edit/:id', isLoggedInAdmin, function(req, res, next) {
	models.contract.find({
		where : {
			id: req.params.id
		}
	}).then(function(contract) {
		models.user.find({
			where: {
				id: contract.user_id
			}, 
			include:{ 
				model: models.contract, 
				as: 'contracts', 
				include : { 
					model: models.transaction, 
					as: 'transactions'
				}
			},
			order:[[{ 
				model: models.contract, 
				as: 'contracts'}, 
				'sign_date'],[{
                model: models.contract, 
				as: 'contracts'					
				},{
			    model: models.transaction, 
				as: 'transactions'
				}, 
				'transaction_date']]	
		}).then(function(user) {
			  res.render('contract/edit', { user:user, editContract:contract, title: 'Direktkredit bearbeiten', message: req.flash('errorMessage') });
		});	
	});
});

/* GET home page. */
router.get('/transaction/edit/:id', isLoggedInAdmin, function(req, res, next) {
	models.transaction.find({
		where : {
			id: req.params.id
		}
	}).then(function(transaction) {
		models.contract.find({
			where:{
				id: transaction.contract_id
			}
		}).then(function(contract) {
			models.user.find({
				where: {
					id: contract.user_id
				}, 
				include:{ 
					model: models.contract, 
					as: 'contracts', 
					include : { 
						model: models.transaction, 
						as: 'transactions'
					}
				},
				order:[[{ 
					model: models.contract, 
					as: 'contracts'}, 
					'sign_date'],[{
	                model: models.contract, 
					as: 'contracts'					
					},{
				    model: models.transaction, 
					as: 'transactions'
					}, 
					'transaction_date']]	
			}).then(function(user) {
				  res.render('user/show', { user:user, editTransaction:transaction, title: 'Zahlung bearbeiten', message: req.flash('errorMessage') });
			});	
		});
	});	
});

/* GET home page. */
router.get('/transaction/add/:id', isLoggedInAdmin, function(req, res, next) {
		models.contract.find({
			where:{
				id: req.params.id
			}
		}).then(function(contract) {
			models.user.find({
				where: {
					id: contract.user_id
				}, 
				include:{ 
					model: models.contract, 
					as: 'contracts', 
					include : { 
						model: models.transaction, 
						as: 'transactions'
					}
				},
				order:[[{ 
					model: models.contract, 
					as: 'contracts'}, 
					'sign_date'],[{
	                model: models.contract, 
					as: 'contracts'					
					},{
				    model: models.transaction, 
					as: 'transactions'
					}, 
					'transaction_date']]	
			}).then(function(user) {
				  var addTransaction =  {contract_id : contract.id};
				  res.render('user/show', { user:user, addTransaction:addTransaction, title: 'Zahlung anlegen', message: req.flash('errorMessage') });
			});	
		});
});

/* GET home page. */
router.get('/user/show/:id', isLoggedInAdmin, function(req, res, next) {
	models.user.find({
		where: {
			id: req.params.id
		}, 
		include:{ 
			model: models.contract, 
			as: 'contracts', 
			include : { 
				model: models.transaction, 
				as: 'transactions'
			}
		},
		order:[[{ 
			model: models.contract, 
			as: 'contracts'}, 
			'sign_date'],[{
            model: models.contract, 
			as: 'contracts'					
			},{
		    model: models.transaction, 
			as: 'transactions'
			}, 
			'transaction_date']]
	}).then(function(user) {
		  res.render('user/show', { user:user, title: 'Direktkreditgeber*in', message: req.flash('errorMessage') });
	});	
});

/* GET home page. */
router.get('/contract/add/:id', isLoggedInAdmin, function(req, res, next) {
	models.user.find({
		where: {
			id: req.params.id
		}, 
		include:{ 
			model: models.contract, 
			as: 'contracts', 
			include : { 
				model: models.transaction, 
				as: 'transactions'
			}
		},
		order:[[{ 
			model: models.contract, 
			as: 'contracts'}, 
			'sign_date'],[{
            model: models.contract, 
			as: 'contracts'					
			},{
		    model: models.transaction, 
			as: 'transactions'
			}, 
			'transaction_date']]
	}).then(function(user) {
		  res.render('contract/add', { user:user, title: 'Direktkredit Einfügen', message: req.flash('errorMessage') });
	});	
});


router.get('/statistics/downloads', isLoggedInAdmin, function(req, res) {
	res.render('statistics/downloads', { title: 'Downloads'});
});

router.post('/user/add', isLoggedInAdmin, function(req, res) {
	
	var length = 8,
    charset = "!#+?-_abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    password = "";
	for (var i = 0, n = charset.length; i < length; ++i) {
		password += charset.charAt(Math.floor(Math.random() * n));
	}
	
	models.user.create({
		first_name: req.body.first_name,
		last_name: req.body.last_name,
		street: req.body.street,
		zip: req.body.zip,
		place: req.body.place,
		telno: req.body.telno,
		email: req.body.email,
		IBAN: req.body.IBAN,
		BIC: req.body.BIC,
        logon_id: Math.abs(Math.random() * 100000000),
        password: password
		
	}).then(function(user) {
		res.redirect('/user/show/' + user.id);
	});	
});

router.post('/contract/add', isLoggedInAdmin, function(req, res) {
	
	
	models.contract.create({
		sign_date: moment(req.body.sign_date, 'DD.MM.YYYY')+1000*60*60*24,
		termination_date: req.body.termination_date==""?null:moment(req.body.termination_date, "DD.MM.YYYY")+1000*60*60*24,
		amount: req.body.amount,
		interest_rate: req.body.interest_rate,
		period: req.body.period,	
		user_id: req.body.id,
		status: req.body.status,
		notes: req.body.notes
	}).then(function(user) {
		res.redirect('/user/show/' + req.body.id);
	});	
});

router.get('/contract/delete/:id', isLoggedInAdmin, function(req, res) {
	
	models.contract.find({
		where: {
			id: req.params.id
		}, 
		include:{ 
			model: models.transaction, 
			as: 'transactions'
		}
	}).then(function(contract) {
		  contract.destroy();
		  res.redirect(redirectReload(req.headers.referer));
	});	
});


router.post('/user/edit', isLoggedInAdmin, function(req, res) {
	models.user.update({
		first_name: req.body.first_name,
		last_name: req.body.last_name,
		street: req.body.street,
		zip: req.body.zip,
		place: req.body.place,
		telno: req.body.telno,
		email: req.body.email,
		IBAN: req.body.IBAN,
		BIC: req.body.BIC	
	}, {where:{id:req.body.id}}).then(function(user) {
		res.redirect('/user/show/' + req.body.id);
	});	
});

router.post('/contract/edit', isLoggedInAdmin, function(req, res) {
	models.contract.update({
		sign_date: moment(req.body.sign_date, 'DD.MM.YYYY')+1000*60*60*24,
		termination_date: req.body.termination_date==""?null:moment(req.body.termination_date, "DD.MM.YYYY")+1000*60*60*24,
		amount: req.body.amount,
		interest_rate: req.body.interest_rate,
		period: req.body.period,	
		status: req.body.status,
		notes: req.body.notes
	}, {where:{id:req.body.id}}).then(function(contract) {
		res.redirect('/user/show/' + req.body.user_id);
	});	
});

router.post('/transaction/edit', isLoggedInAdmin, function(req, res) {
	models.transaction.update({
		transaction_date: moment(req.body.transaction_date, 'DD.MM.YYYY')+1000*60*60*24,
		amount: req.body.amount,
		type: req.body.type
	}, {where:{id:req.body.id}}).then(function(transaction) {
		res.redirect('/user/show/' + req.body.user_id);
	});	
});

router.post('/transaction/add', isLoggedInAdmin, function(req, res) {
	models.transaction.create({
		transaction_date: moment(req.body.transaction_date, 'DD.MM.YYYY')+1000*60*60*24,
		amount: req.body.amount,
		type: req.body.type,
		contract_id: req.body.contract_id
	}).then(function(transaction) {
		res.redirect('/user/show/' + req.body.user_id);
	});	
});

router.get('/transaction/delete/:id', isLoggedInAdmin, function(req, res) {
	
	models.transaction.find({
		where: {
			id: req.params.id
		}
	}).then(function(transaction) {
		  transaction.destroy();
		  res.redirect(redirectReload(req.headers.referer));
	});	
});

router.post('/statistics/transactionList', isLoggedInAdmin, function(req, res) {
	
	models.user.all({
		  include:{ 
				model: models.contract, 
				as: 'contracts', 
				include : { 
					model: models.transaction, 
					as: 'transactions'
				}
			}
	}).then(function(users) {
		var transactionList = [];
		users.forEach(function(user) {
			user.getTransactionList(req.body.year).forEach( function (transaction) {
				transactionList.push(transaction);
			});
		});
		transactionList.sort(function(a,b) {
			if (a.date.diff(b.date) > 0)
				return 1;
			else if(b.date.diff(a.date) > 0)
				return -1;
			else {
				var comp = new String(a.last_name).localeCompare(b.last_name);
				if (comp === 0)	{
					return new String(a.first_name).localeCompare(b.first_name);
				} else {
					return comp;
				}
			}
		});
		var filename = "./tmp/Jahresliste_"+ req.body.year +".csv"
		file = utils.generateTransactionList(transactionList, filename);

		res.setHeader('Content-Length', file.length);
		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'inline; filename=Jahresliste_'+ req.body.year +'.csv');
		res.write(file);
		res.end();

	});	
});


//=====================================
//DOCX ==============================
//=====================================
router.get('/docx/:id', isLoggedInAdmin, function(req, res) {
	
	models.user.find({
		where: {
			id: req.params.id
		}
	}).then(function(user) {
		var data = {"first_name": user.first_name, "logon_id": user.logon_id, "password": user.password};
		utils.generateDocx(req.query.file, user.logon_id, data);
		var file = fs.readFileSync("./tmp/"+ user.logon_id +".docx", 'binary');

		res.setHeader('Content-Length', file.length);
		res.setHeader('Content-Type', 'application/msword');
		res.setHeader('Content-Disposition', 'inline; filename=' + user.logon_id + '.docx');
		res.write(file, 'binary');
		res.end();
	});	
});




// =====================================
// LOGOUT ==============================
// =====================================
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

//=====================================
//LOGOUT ==============================
//=====================================
router.get('/admin-logout', function(req, res) {
 req.logout();
 res.redirect('/admin');
});

router.post('/logon', passport.authenticate('local-login', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));


router.post('/admin-logon', passport.authenticate('local-login-admin', {
    successRedirect : '/admin', // redirect to the secure profile section
    failureRedirect : '/admin-logon', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

module.exports = router;

//route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
    	return next();
	// 	if they aren't redirect them to the home page
	res.redirect('/');
}

//route middleware to make sure a user is logged in
function isLoggedInAdmin(req, res, next) {
	// 	if user is authenticated in the session, carry on 
	if (req.isAuthenticated() && req.user.isAdmin())
		return next();
	else if (req.isAuthenticated())
		req.logout();
	// if they aren't redirect them to the home page
	res.redirect('/admin-logon');
}


