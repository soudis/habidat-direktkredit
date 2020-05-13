/* jshint esversion: 8 */
const DocxGen = require('docxtemplater');
const JSZipUtils = require('jszip');
const fs = require('fs');
const moment = require('moment');
const converter = require('office-converter')();
const json2csv = require('json2csv');


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

exports.generateTransactionList = function(transactionList, outputFile){

	var fieldNames = ["Nummer", "Nachname", "Vorname", "Vertragsnummer", "Vorgang", "Datum", "Betrag", "Zinssatz", "Zinsbetrag"];
	var fieldList = ['id', 'last_name', 'first_name','contract_id', 'type', 'date', 'amount', 'interest_rate', 'interest'];
	var csvRet;
	json2csv({ data: transactionList, fieldNames: fieldNames, fields: fieldList }, function(err, csv) {
		  if (err) console.log(err);
		  csvRet = csv;
		});
	return csvRet;
};
