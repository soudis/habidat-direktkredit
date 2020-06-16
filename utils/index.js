/* jshint esversion: 8 */
const DocxGen = require('docxtemplater');
const JSZipUtils = require('jszip');
const fs = require('fs');
const moment = require('moment');
const converter = require('libreoffice-convert');
const json2csv = require('json2csv');
const exceljs = require('exceljs');
const urlUtil = require('url');
const settings = require('./settings');


exports.render = (req, res, template, data, title = undefined) => {
	return Promise.resolve()
		.then(() => {
			data.title = title;
			res.render(template, data);
		});
};

exports.renderToText = (req, res, template, data, title = undefined) => {
	return new Promise((resolve, reject) => {
		data.title = title;
		res.render(template, data, (error, html) => {
			if (error) {
				reject(error);
			} else {
				resolve(html);
			}
		});
	});
};

exports.getTrackOptions = function(user, track) {
	return{ track: track, user_id: user?user.id:-1 };
}

exports.generateDocx = function(templateFile, data){
	var path = templateFile;
	var file = fs.readFileSync(path, 'binary');
	var zip = new JSZipUtils(file);
	var doc=new DocxGen();
	doc.loadZip(zip);
	doc.setData(data);
	doc.render();
	return doc.getZip().generate({type:"nodebuffer"});
};

exports.convertToPdf = function(stream){

	return new Promise((resolve, reject) => {
		converter.convert(stream, '.pdf', undefined, (err, result) => {
		    if (err) {
		      reject(err);
		    }
		    resolve(result);
		});
	});


};

exports.generateTransactionList = function(transactionList){
	return Promise.resolve()
		.then(() => {
			var workbook = new exceljs.Workbook();
			workbook.creator = 'DK Plattform';
			workbook.created = new Date();

			var dataWorksheet = workbook.addWorksheet('Jahresliste');

			var fieldNames = ["Nummer", "Nachname", "Vorname", "Vertragsnummer", "Vorgang", "Datum", "Betrag", "Zinssatz", "Zinsbetrag"];
			var fieldList = ['id', 'last_name', 'first_name','contract_id', 'type', 'date', 'amount', 'interest_rate', 'interest'];

			dataWorkSheetColumns = [];
			fieldList.forEach((column, index) => {
				dataWorkSheetColumns.push({header: fieldNames[index], key: column, width: 20});
			});
			dataWorksheet.columns = dataWorkSheetColumns;
			transactionList.forEach(transaction => {
				var row = [];
				fieldList.forEach(field => {
					if (field === 'date') {
						row.push(transaction[field].toDate());
					} else {
						row.push(transaction[field]);
					}

				})
				dataWorksheet.addRow(row);
			});
			return workbook;
		})
};

exports.generateUrl = function(req, url) {
	var url_parts = urlUtil.parse(req.url);
	var projectId = settings.project.get('projectid');
	if (req.addPath && url.startsWith('/')) {
		return req.addPath+url;
	} else {
		return url;
	}
}
