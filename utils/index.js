/* jshint esversion: 8 */
const DocxGen = require('docxtemplater');
const JSZipUtils = require('jszip');
const fs = require('fs');
const moment = require('moment');
const converter = require('office-converter')();
const json2csv = require('json2csv');
const exceljs = require('exceljs');


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

exports.generateDocx = function(templateFile, outputFile, data){
	var path = templateFile;
	var file = fs.readFileSync(path, 'binary');
	var zip = new JSZipUtils(file);
	var doc=new DocxGen();
	doc.loadZip(zip);
	doc.setData(data);
	doc.render();
	var out=doc.getZip().generate({type:"nodebuffer"});
	fs.writeFileSync("./tmp/"+ outputFile +".docx", out);
	console.log("done");
};

exports.convertToPdf = function(file, callback){

	converter.generatePdf('./tmp/' + file + '.docx', function(err, result) {
		// Process result if no error
		if (result && result.status === 0) {
		  console.log('Output File located at ' + result.outputFile);
		  callback(null);
		} else {
		  callback('Error converting PDF: ' + err);
		}
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
