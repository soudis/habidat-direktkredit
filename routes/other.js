/* jshint esversion: 8 */
const security = require('../utils/security');
const moment = require("moment");
const fs = require('fs');
const utils = require ('../utils');
const format = require ('../utils/format');
const router = require('express').Router();
const models  = require('../models');

module.exports = function(app){
	router.get('/docx/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.user.findByIdFetchFull(models, req.params.id)
			.then(function(user) {
				var data = user.getRow();
				Object.keys(data).forEach(key => {
					data[key] = data[key].value;
				})
				data.user_contracts = user.contracts.map(contract => {
					var data = contract.getRow();
					Object.keys(data).forEach(key => {
						data[key] = data[key].value;
					})
					data.contract_transactions = contract.transactions.map(transaction => {
						var data = transaction.getRow();
						Object.keys(data).forEach(key => {
							data[key] = data[key].value;
						})
						return data;
					})
				})
				data.user_address = data.user_address.replace('</br>', "\n");

			    return models.file.findOne({
					where: {
						id: req.query.fileid
				}})
				.then(function(file) {
					return utils.generateDocx(file.path, data)
						.then(result => {

							res.setHeader('Content-Length', result.length);
							res.setHeader('Content-Type', 'application/msword');
							res.setHeader('Content-Disposition', 'inline; filename="' + file.description + ' - Konto ' + user.id + ' (' + user.getFullName() + ').docx"');
							res.write(result, 'binary');
							res.end();
						});
				})
			}).catch(error => next(error));
	});

	router.get('/docx_c/:id', security.isLoggedInAdmin, function(req, res, next) {
		models.contract.findOne({
			where : {
				id: req.params.id
			},
			include: {
				model: models.transaction,
				as: 'transactions'
			}
		}).then(function(contract) {
			return models.user.findByIdFetchFull(models, contract.user_id)
				.then(user => {
					userData = user.getRow();
					Object.keys(userData).forEach(key => {
						userData[key] = userData[key].value;
					})

					contractData = contract.getRow();
					Object.keys(contractData).forEach(key => {
						contractData[key] = contractData[key].value;
					})
					contractData.contract_transactions = contract.transactions.map(transaction => {
						var data = transaction.getRow();
						Object.keys(data).forEach(key => {
							data[key] = data[key].value;
						})
					})

					var data = Object.assign(userData, contractData);

					data.user_address = data.user_address.replace('</br>', "\n");					


				    return models.file.findOne({
						where: {
							id: req.query.fileid
					}})
					.then(function(file) {
						return utils.generateDocx(file.path, data)
							.then(result => {
								res.setHeader('Content-Length', result.length);
								res.setHeader('Content-Type', 'application/msword');
								res.setHeader('Content-Disposition', 'inline; filename="' + file.description + ' - Konto ' + user.id + ' (' + user.getFullName() + ') - Vertrag ' + contract.id + '.docx"');
								res.write(result, 'binary');
								res.end();
							});
					})
				});
		}).catch(error => next(error));
	});


	app.use('/', router);
};
