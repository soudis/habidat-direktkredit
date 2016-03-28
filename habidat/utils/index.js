var DocxGen = require('docxtemplater');
var JSZipUtils = require('jszip');
var fs = require('fs');
var moment = require('moment');

var json2csv = require('json2csv');


exports.generateDocx = function(templateFile, outputFile, data){
	
	var file = fs.readFileSync("./templates/docx/" + templateFile + ".docx", 'binary');
		var zip = new JSZipUtils(file);
        var doc=new DocxGen(zip);
        doc.setData(data); 
        doc.render();
        var out=doc.getZip().generate({type:"nodebuffer"});
        fs.writeFileSync("./tmp/"+ outputFile +".docx", out);
        console.log("done");
};

exports.generateTransactionList = function(transactionList, outputFile){

	var fieldNames = ["Nachname", "Vorname", "Vertragsnummer", "Vorgang", "Datum", "Betrag", "Zinssatz", "Zinsbetrag"];
	var fieldList = ['last_name', 'first_name','contract_id', 'type', 'date', 'amount', 'interest_rate', 'interest'];
	var csvRet;
	json2csv({ data: transactionList, fieldNames: fieldNames, fields: fieldList }, function(err, csv) {
		  if (err) console.log(err);
		  csvRet = csv;
		});
	return csvRet;
};
