var DocxGen = require('docxtemplater');
var JSZipUtils = require('jszip');
var fs = require('fs');
var moment = require('moment');
var projects    = require('../config/projects.json');
// var cloudconvert = new (require('cloudconvert'))('oqxW0tKE_7gykv8GDULnAcRTv50QTqMtIPbFBtVzgQFUQe2VridmQ7czMIGtccFwO0ZvsyMNV-6IB4qXxWSo_g');
var converter = require('office-converter')();

var json2csv = require('json2csv');

exports.getUserTemplates = function(models, callback){
	models.file.findAll({
		where: {
			ref_table: "template_user"
		}
	}).then(function(templates) {
		callback(templates);
	}).catch(() => {
		callback([]);
	});	
};

exports.getContractTemplates = function(models, callback){
	models.file.findAll({
		where: {
			ref_table: "template_contract"
		}
	}).then(function(templates) {
		callback(templates);
	}).catch(() => {
		callback([]);
	});	
};


exports.generateDocx = function(templateFile, outputFile, data, project){
	var path = templateFile;
	if (templateFile.indexOf('/') === -1) {
		path = __dirname + '/..' +  projects[project].templates + "/" + templateFile + ".docx";
	}
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
