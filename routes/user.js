const security = require('../utils/security');
const format = require('../utils/format');
const moment = require("moment");
const router = require('express').Router();
const url = require('url');
const utils = require('../utils');
const Promise = require('bluebird');
const Op = require("sequelize").Op;
const models  = require('../models');
const multer = require('multer');
const exceljs = require('exceljs');

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

    const contractTableColumns = [
			{id: "contract_sign_date", label: "Vertragsdatum", priority: "2", filter: 'date'},
			{id: "user_id", label: "User ID", filter: 'text'},
			{id: "user_name", label: "Name", priority: "2", filter: 'text'},
			{id: "user_address", label: "Adresse", filter: 'text'},
			{id: "user_telno", label:"Telefon", filter: 'text'},
			{id: "user_email", label:"E-Mail", filter: 'text'},
			{id: "user_iban", label:"IBAN", filter: 'text'},
			{id: "user_bic", label: "BIC", filter: 'text'},
			{id: "user_relationship", label:"Beziehung", filter: 'list'},
			{id: "contract_id", label:"Vertrag ID", filter: 'text'},
			{id: "contract_amount", label: "Vertragswert", class: "text-right", filter: 'number'},
			{id: "contract_interest_rate", label: "Zinssatz", class: "text-right", filter: 'number'},
			{id: "contract_deposit", label: "Einzahlungen", class: "text-right", filter: 'number'},
			{id: "contract_withdrawal", label: "Auszahlungen", class: "text-right", filter: 'number'},
			{id: "contract_amount_to_date", label: "Aushaftend", class: "text-right", filter: 'number'},
			{id: "contract_interest_to_date", label: "Zinsen", class: "text-right", filter: 'number'},
			{id: "contract_termination_type", label: "Kündigungsart", filter: 'list'},
			{id: "contract_termination_date", label: "Kündigungsdatum", filter: 'date'},
			{id: "contract_payback_date", label: "Rückzahlungsdatum", filter: 'date'},
			{id: "contract_status", label: "Status", class: "text-center", priority: "2", filter: 'list'}
		]

	const contractTableRow = function(user, contract = undefined) {
		if (contract) {
			var interest = contract.calculateInterest();
			return [
    				{ valueRaw: contract.sign_date, value: moment(contract.sign_date).format('DD.MM.YYYY'), order: moment(contract.sign_date).format('YYYY/MM/DD') },
		            { valueRaw: user.id, value:  user.id  },
		            { valueRaw: user.getFullName(), value: user.getFullName(), order: replaceUmlaute(user.getFullName())},
		            { valueRaw: user.getAddress(true), value: user.getAddress(true) },
		            { valueRaw: user.telno, value: user.telno },
		            { valueRaw: user.email, value: user.email },
		            { valueRaw: user.IBAN, value: user.IBAN },
		            { valueRaw: user.BIC, value: user.BIC },
		            { valueRaw: user.relationship, value: user.relationship },
		            { valueRaw: contract.id, value: contract.id },
		            { valueRaw: contract.amount, value: format.formatMoney(contract.amount,2), order: contract.amount},
		            { valueRaw: contract.interest_rate, value: format.formatPercent(contract.interest_rate,3), order: contract.interest_rate},
		            { valueRaw: contract.getDepositAmount(), value: format.formatMoney(contract.getDepositAmount(), 2), order: contract.getDepositAmount(), class: contract.getDepositAmount()>0?"text-success":""},
		            { valueRaw: contract.getWithdrawalAmount(), value: format.formatMoney(contract.getWithdrawalAmount(), 2), order: contract.getWithdrawalAmount(), class: contract.getWithdrawalAmount()<0?"text-danger":"" },
		            { valueRaw: contract.getAmountToDate(moment()), value: format.formatMoney(contract.getAmountToDate(moment())), order: contract.getAmountToDate(moment()) },
		            { valueRaw: interest.now, value: format.formatMoney(interest.now), order: interest.now},
		            { valueRaw: contract.getTerminationTypeFullString(), value: contract.getTerminationTypeFullString()},
		            { valueRaw: contract.termination_date?contract.termination_date:"", value: contract.termination_date?moment(contract.termination_date).format('DD.MM.YYYY'):"", order: contract.termination_date?moment(contract.termination_date).format('YYYY/MM/DD'):""},
		            { valueRaw: contract.getPaybackDate()?contract.getPaybackDate().format('YYYY-MM-DD'):"", value: contract.getPaybackDate()?moment(contract.getPaybackDate()).format('DD.MM.YYYY'):"", order: contract.getPaybackDate()?moment(contract.getPaybackDate()).format('YYYY/MM/DD'):""},
		            { valueRaw: contract.getStatus(), value: contract.getStatus() }
    			];		
		} else {
			return [
					false,
		            { valueRaw: user.id, value:  user.id  },
		            { valueRaw: user.getFullName(), value: user.getFullName(), order: replaceUmlaute(user.getFullName())},
		            { valueRaw: user.getAddress(true), value: user.getAddress(true) },
		            { valueRaw: user.telno, value: user.telno },
		            { valueRaw: user.email, value: user.email },
		            { valueRaw: user.IBAN, value: user.IBAN },
		            { valueRaw: user.BIC, value: user.BIC },
		            { valueRaw: user.relationship, value: user.relationship },
	                false,
	                false,
	                false,
	                false,
	                false,
	                false,
	                false,
	                false,
	                false,
	                false,
	                false,
				];
		}
	}

    function generateContractTable(req, res, users) {
    	contracts = {
    		columns: contractTableColumns,
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
    		if (user.contracts.length === 0) {
    			contracts.data.push(contractTableRow(user))
    		}
    		user.contracts.forEach(contract => {
    			contracts.data.push(contractTableRow(user, contract));
    		})
    	})
    	contracts.columns.forEach((column, index) => {
    		if (column.filter === 'list') {
    			var options = [];
    			contracts.data.forEach(row => {
    				if (!options.includes(row[index].value || '-')) {    					
    					options.push(row[index].value || '-');
    				}
    			})
    			column.filterOptions = options;
    		}
    	})
    	return contracts;
    }    

    const columnsVisible = ['contract_sign_date', 'user_name', 'contract_status', 'contract_amount', "contract_deposit", "contract_withdrawal", 'contract_amount_to_date'];

	router.get('/user/list/cancelled', security.isLoggedInAdmin, function(req, res, next) {
		models.user.cancelledAndNotRepaid(models, { administrator: {[Op.not]: '1'}})
			.then(users => utils.render(req, res, 'user/list', {contracts: generateContractTable(req, res, users).setColumnsVisible((columnsVisible.join(',')+',contract_termination_type,contract_termination_date,contract_payback_date').split(','))}, 'Gekündigte, nicht ausgezahlte Kredite'))
			.catch(error => next(error));
	});
	
	router.get('/user/list', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findFetchFull(models, { administrator: {[Op.not]: '1'}})
			.then(users => utils.render(req, res, 'user/list', {success: req.flash('success'), contracts: generateContractTable(req, res, users).setColumnsVisible(columnsVisible)}, 'Kreditliste'))
			.catch(error => next(error));
	});

	router.post('/user/saveview', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByPk(req.user.id)
			.then(user => {
				var views;
				if (user.savedViews) {
					views = JSON.parse(user.savedViews);	
				} else {
					views = [];
				}
				views.push(req.body.view)
				user.savedViews = JSON.stringify(views);
				req.user.savedViews = user.savedViews;
				return user.save().then(() => {
					res.send({id: views.length - 1})
				});
			})
			.catch(error => next);
	});

	router.post('/user/saveview/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByPk(req.user.id)
			.then(user => {
				var views;
				if (user.savedViews) {
					views = JSON.parse(user.savedViews);	
				} else {
					views = [];
				}
				views.splice(req.params.id, 1, req.body.view)
				user.savedViews = JSON.stringify(views);
				req.user.savedViews = user.savedViews;
				return user.save().then(() => {
					res.send({id: req.params.id})
				});
			})
			.catch(error => next);
	});	

	router.get('/user/deleteview/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByPk(req.user.id)
			.then(user => {
				var views;
				if (user.savedViews) {
					views = JSON.parse(user.savedViews);	
				} else {
					views = [];
				}
				views.splice(req.params.id, 1)
				user.savedViews = JSON.stringify(views);
				req.user.savedViews = user.savedViews;
				return user.save().then(() => {
					res.send({id: req.body.id})
				});
			})
			.catch(error => next);
	});	

	router.get('/user/add', security.isLoggedInAdmin, function(req, res, next) {
	  res.render('user/add');
	});

	router.get('/user/edit/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByIdFetchFull(models, req.params.id)
			.then(user => utils.render(req, res, 'user/edit', { user:user}, 'Direktkreditgeber*in Bearbeiten'))
			.catch(error => next(error));
	});

	router.get('/user/show/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByIdFetchFull(models, req.params.id)
			.then(user =>  renderUser(req, res, models, { user:user, title: 'Direktkreditgeber*in' }))
			.catch(error => next(error));
	});

	router.post('/user/add', security.isLoggedInAdmin, multer().none(), function(req, res, next) {
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
			.then(user => res.send({redirect : '/user/show/' + user.id}))
			.catch(error => next(error));
	});

	router.post('/user/edit', security.isLoggedInAdmin, multer().none(), function(req, res, next) {
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
			.then(() => res.send({redirect: 'reload'}))
			.catch(error => next(error));
	});

	router.get('/user/delete/:id', security.isLoggedInAdmin, function(req, res, next) {
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

	const generateDatasheetRow = function(fields, contractTableRow) {
		var row = [];
		contractTableColumns.forEach((column, index) => {
			if (fields === 'all' || fields.includes(column.id)) {
				console.log(contractTableRow[index].valueRaw);
				row.push(contractTableRow[index].valueRaw);
			}
		})		
		return row;
	}

	router.post('/user/export', security.isLoggedInAdmin, function(req, res, next) {
		var userIds = req.body.users.split(',');
		var fields = req.body.fields.split(',');
		var contractIds = req.body.contracts.split(',');
		
		

		var workbook = new exceljs.Workbook();
		workbook.creator = 'DK Plattform';
		workbook.created = new Date();

		var dataWorksheet = workbook.addWorksheet('Daten');

		dataWorkSheetColumns = [];
		contractTableColumns.forEach((column, index) => {
			if (fields === 'all' || fields.includes(column.id)) {
				dataWorkSheetColumns.push({header: column.label, key: column.id, width: 20})				
			}
		})
		dataWorksheet.columns = dataWorkSheetColumns;
		models.user.findFetchFull(models, { administrator: {[Op.not]: '1'}})
			.then(users => {
				users.forEach(user => {
		    		if (userIds.includes(user.id.toString())) {
		    			console.log('user acc');
		    			var contractsCount = 0;
		    			if (user.contracts) {
		    				user.contracts.forEach(contract => {
				    			if (contractIds.includes(contract.id.toString())) {
				    				console.log('contract acc');
				    				contractsCount ++;
				    				dataWorksheet.addRow(generateDatasheetRow(fields, contractTableRow(user, contract)));
				    			}	    			
				    		})
		    			}
			    		
			    		if (contractsCount === 0) {
			    			dataWorksheet.addRow(generateDatasheetRow(fields, contractTableRow(user)));
			    		}    		
			    	}
		    	})	

		    	res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		        res.setHeader('Content-Disposition', 'attachment; filename=direktkredite_' + moment().format('YYYYMMDDHHmmss') + ".xlsx");
		        return workbook.xlsx.write(res)
		            .then(() => res.end());
				
			})
    	
	});	

	app.use('/', router);

};
