var security = require('../utils/security');
var format = require('../utils/format');
var moment = require("moment");
var router = require('express').Router();
var url = require('url');
var utils = require('../utils');
var Promise = require('bluebird');
var Op = require("sequelize").Op;

module.exports = function(app){

	const umlautMap = {
	  '\u00dc': 'UE',
	  '\u00c4': 'AE',
	  '\u00d6': 'OE',
	  '\u00fc': 'ue',
	  '\u00e4': 'ae',
	  '\u00f6': 'oe',
	  '\u00df': 'ss',
	}

	var replaceUmlaute = function (str) {
	  return str
	    .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
	      const big = umlautMap[a.slice(0, 1)];
	      return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
	    })
	    .replace(new RegExp('['+Object.keys(umlautMap).join('|')+']',"g"),
	      (a) => umlautMap[a]
	    );
	}


	function renderUser(req, res, models, data) {
		return Promise.join(models.file.getUserTemplates(), models.file.getContractTemplates(),
			(templates_user, templates_contract) => {
				data.templates_user = templates_user;
				data.templates_contract = templates_contract;
				utils.render(req, res, 'user/show', data)
			})
    }

    function generateContractTable(req, res, users) {
    	contracts = {
    		columns: [
    			{id: "contract_sign_date", label: "Vertragsdatum", priority: "2"},
    			{id: "user_id", label: "User ID"},
    			{id: "user_name", label: "Name", priority: "2"},
    			{id: "user_address", label: "Adresse"},
    			{id: "user_telno", label:"Telefon"},
    			{id: "user_email", label:"E-Mail"},
    			{id: "user_iban", label:"IBAN"},
    			{id: "user_bic", label: "BIC"},
    			{id: "user_relationship", label:"Beziehung"},
    			{id: "contract_id", label:"Vertrag ID"},
    			{id: "contract_amount", label: "Vertragswert", class: "text-right"},
    			{id: "contract_interest_rate", label: "Zinssatz", class: "text-right"},
    			{id: "contract_deposit", label: "Einzahlungen", class: "text-right"},
    			{id: "contract_withdrawal", label: "Auszahlungen", class: "text-right"},
    			{id: "contract_amount_to_date", label: "Aushaftend", class: "text-right"},
    			{id: "contract_interest_to_date", label: "Zinsen", class: "text-right"},
    			{id: "contract_termination_type", label: "Kündigungsart"},
    			{id: "contract_termination_date", label: "Kündigungsdatum"},
    			{id: "contract_payback_date", label: "Rückzahlungsdatum"},
    			{id: "contract_status", label: "Status", class: "text-center", priority: "2"}
    		],
		    setColumnsVisible: function(visibleColumns) {
		    	this.columns.forEach(column => {
		    		if (visibleColumns.includes(column.id)) {
		    			column.visible = true;
		    		} else {
		    			column.visible = false;
		    		}
		    	})
		    	return this;
		    },
    		data: []
    	}
    	users.forEach(user => {
    		user.contracts.forEach(contract => {
    			var interest = contract.calculateInterest(req.session.project)
    			contracts.data.push([
    				{ value: moment(contract.sign_date).format('DD.MM.YYYY'), order: moment(contract.sign_date) },
		            { value:  user.id  },
		            { value: user.getFullName(), order: replaceUmlaute(user.getFullName())},
		            { value: user.getAddress(true) },
		            { value: user.telno },
		            { value: user.email },
		            { value: user.IBAN },
		            { value: user.BIC },
		            { value: user.relationship },
		            { value: contract.id },
		            { value: format.formatMoney(contract.amount,2), order: contract.amount},
		            { value: format.formatPercent(contract.interest_rate,3), order: contract.interest_rate},
		            { value: format.formatMoney(contract.getDepositAmount(), 2), order: contract.getDepositAmount(), class: contract.getDepositAmount()>0?"text-success":""},
		            { value: format.formatMoney(contract.getWithdrawalAmount(), 2), order: contract.getWithdrawalAmount(), class: contract.getWithdrawalAmount()<0?"text-danger":"" },
		            { value: format.formatMoney(contract.getAmountToDate(req.session.project, moment())), order: contract.getAmountToDate(req.session.project, moment()) },
		            { value: format.formatMoney(interest.now), order: interest.now},
		            { value: contract.getTerminationTypeFullString(req.session.projectConfig) },
		            { value: contract.termination_date?moment(contract.termination_date).format('DD.MM.YYYY'):"", order: contract.termination_date?moment(contract.termination_date):""},
		            { value: contract.getPaybackDate(req.session.projectConfig)?moment(contract.getPaybackDate(req.session.projectConfig)).format('DD.MM.YYYY'):"", order: contract.getPaybackDate(req.session.projectConfig)?moment(contract.getPaybackDate(req.session.projectConfig)):""},
		            { value: contract.getStatus() }
    			]);
    		})
    	})
    	return contracts;
    }    

    const columnsVisible = ['contract_sign_date', 'user_name', 'contract_status', 'contract_amount', "contract_deposit", "contract_withdrawal", 'contract_amount_to_date'];

	router.get('/user/list/cancelled', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.cancelledAndNotRepaid(models, req.session.project, { administrator: {[Op.not]: '1'}})
			.then(users => utils.render(req, res, 'user/list', 
				{
					users: users, 
					noAggregation: true, 
					additionalFields: [{label: "Auszubezahlender Betrag", key: "payback_amount", type: "number"},{label: "Vertragsdatum", key: "contract_date", type: "date"},{label: "Kündigungsart", key: "termination_type", type: "string"},{label: "Rückzahlungsdatum", key: "payback_date", type: "date"}]
				}, 'Direktkreditgeber*innen Liste (gekündigte, nicht ausgezahlte Kredite)'))
			.catch(error => next(error));
	});
	
	router.get('/user/list', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.findFetchFull(models, { administrator: {[Op.not]: '1'}})
			.then(users => utils.render(req, res, 'user/list', {contracts: generateContractTable(req, res, users).setColumnsVisible(columnsVisible)}, 'Kreditliste'))
			.catch(error => next(error));
	});

	router.get('/user/add', security.isLoggedInAdmin, function(req, res, next) {
	  res.render('user/add');
	});

	router.get('/user/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.findByIdFetchFull(models, req.params.id)
			.then(user => utils.render(req, res, 'user/edit', { user:user}, 'Direktkreditgeber*in Bearbeiten'))
			.catch(error => next(error));
	});

	router.get('/user/show/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.findByIdFetchFull(models, req.params.id)
			.then(user =>  renderUser(req, res, models, { user:user, title: 'Direktkreditgeber*in' }))
			.catch(error => next(error));
	});

	router.post('/user/add', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		Promise.resolve()
			.then(() => {
				var length = 8,
			    charset = "!#+?-_abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
			    password = "";
				for (var i = 0, n = charset.length; i < length; ++i) {
					password += charset.charAt(Math.floor(Math.random() * n));
				}
				return models.user.create({
					first_name: req.body.first_name,
					last_name: req.body.last_name,
					street: req.body.street,
					zip: req.body.zip,
					place: req.body.place,
					telno: req.body.telno,
					email: req.body.email,
					country: req.body.country,
					IBAN: req.body.IBAN,
					BIC: req.body.BIC,
			        logon_id: Math.abs(Math.random() * 100000000),
			        password: password,
			        administrator:false,
			        ldap: false,
			        relationship: req.body.relationship					
				})
			})
			.then(user => res.redirect('/user/show/' + user.id))
			.catch(error => next(error));
	});

	router.get('/admin/accounts', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.findFetchFull(models, {administrator: true})
			.then(users => utils.render(req, res, 'admin/admin_accounts', {accounts: users, message: req.flash('error')}, 'Administrator*innen Accounts'))
			.catch(error => next(error));
	});

	router.get('/admin/add_account', security.isLoggedInAdmin, function(req, res, next) {
		utils.render(req, res, 'admin/admin_accounts_add', {})
			.catch(error => next(error));
	});	

	router.get('/admin/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.destroy({
			where: {
				id: req.params.id,
				administrator: true
			}
		}).then(deleted => {
			if(deleted > 0) {
			 	res.json({redirect: '/admin/accounts'});
			} else {
				res.status(500).json({error: 'Es wurde kein Account gelöscht, das sollte nicht passieren!'});
			}
		}).catch(error => {
			res.status(500).json({error: error});
		});  
	});


	router.post('/admin/add', security.isLoggedInAdmin, function(req, res, next) {
		
		Promise.resolve()
			.then(() => {

				if (!req.body.logon_id) {
					throw 'Login ID muss angegeben werden!';
				} else if (!req.body.ldap && !req.body.password) {
					throw 'Passwort fehlt!';
				} else if (!req.body.ldap && req.body.password != req.body.password2) {
					throw 'Passwörter sind nicht gleich!';
				}

				var models  = require('../models')(req.session.project);
				var length = 16,
			    charset = "!#+?-_abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
			    generatedPassword = "";
				for (var i = 0, n = charset.length; i < length; ++i) {
					generatedPassword += charset.charAt(Math.floor(Math.random() * n));
				}
				var user = {
					logon_id: req.body.logon_id,
					administrator: true
				}
				if (req.body.ldap) {
					user.ldap = true;
					user.password = generatedPassword;
				} else {
					user.ldap = false;
					user.password = req.body.password;
				}
				
				return models.user.create(user);
			})
			.then(() => res.send({redirect: '/admin/accounts'}))
			.catch(error => next(error))

	});


	router.post('/user/edit', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.update({
				first_name: req.body.first_name,
				last_name: req.body.last_name,
				street: req.body.street,
				zip: req.body.zip,
				place: req.body.place,
				country: req.body.country,			
				telno: req.body.telno,
				email: req.body.email,
				IBAN: req.body.IBAN,
				BIC: req.body.BIC,
				relationship: req.body.relationship
			}, {where: { id:req.body.id } })
			.then(user => res.redirect('/user/show/' + req.body.id))
			.catch(error => next(error));
	});

	router.get('/user/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.user.destroy({ where: { id: req.params.id }})
			.then(function(deleted) {
				if(deleted > 0) {
				 	res.json({redirect: '/user/list'});
				} else {
					res.json({error: 'Direktkreditgeber*in konnte nicht gelöscht werden, überprüfe bitte ob noch Verträge oder Dateien bestehen'})
				}
			}).catch(function(error) {
				res.json({error: 'Direktkreditgeber*in konnte nicht gelöscht werden, überprüfe bitte ob noch Verträge oder Dateien bestehen'})
			});  
	});

	app.use('/', router);

};
