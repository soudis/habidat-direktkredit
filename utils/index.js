/* jshint esversion: 8 */
const DocxGen = require("docxtemplater");
const PizZip = require("pizzip");
const fs = require("fs");
const moment = require("moment");
const converter = require("libreoffice-convert");
const exceljs = require("exceljs");
const urlUtil = require("url");
const settings = require("./settings");
const models = require("../models");
const Promise = require("bluebird");

exports.render = (req, res, template, data, title = undefined) => {
  return Promise.resolve().then(() => {
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

exports.getTrackOptions = function (user, track) {
  return { track: track, user_id: user ? user.id : -1 };
};

exports.generateDocx = function (templateFile, data) {
  return Promise.resolve().then(() => {
    data.current_date = moment().format("DD.MM.YYYY");
    data.project_name = settings.project.get("projectname");
    data.project_iban = settings.project.get("project_iban");
    data.project_bic = settings.project.get("project_bic");

    var path = templateFile;
    var file = fs.readFileSync(path, "binary");
    var doc = new DocxGen();
    var zip = new PizZip(file);
    doc.loadZip(zip);
    doc.setData(data);
    doc.render();
    return doc.getZip().generate({ type: "nodebuffer" });
  });
};

exports.convertToPdf = function (stream) {
  return new Promise((resolve, reject) => {
    converter.convert(stream, ".pdf", undefined, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
};

exports.generateTransactionList = function (transactionList) {
  return Promise.resolve().then(() => {
    var workbook = new exceljs.Workbook();
    workbook.creator = "DK Plattform";
    workbook.created = new Date();

    var dataWorksheet = workbook.addWorksheet("Jahresliste");

    var fieldNames = [
      "Nummer",
      "Nachname",
      "Vorname",
      "Vertragsnummer",
      "Vorgang",
      "Datum",
      "Betrag",
      "Zinssatz",
      "Zinsbetrag",
    ];
    var fieldList = [
      "id",
      "last_name",
      "first_name",
      "contract_id",
      "type",
      "date",
      "amount",
      "interest_rate",
      "interest",
    ];

    dataWorkSheetColumns = [];
    fieldList.forEach((column, index) => {
      dataWorkSheetColumns.push({
        header: fieldNames[index],
        key: column,
        width: 20,
      });
    });
    dataWorksheet.columns = dataWorkSheetColumns;
    transactionList.forEach((transaction) => {
      var row = [];
      fieldList.forEach((field) => {
        if (field === "date") {
          row.push(transaction[field].toDate());
        } else {
          row.push(transaction[field]);
        }
      });
      dataWorksheet.addRow(row);
    });
    return workbook;
  });
};

exports.generateUrl = function (req, url) {
  var url_parts = urlUtil.parse(req.url);
  var projectId = settings.project.get("projectid");
  if (req.addPath && url.startsWith("/")) {
    return req.addPath + url;
  } else {
    return url;
  }
};

exports.processImportFile = function (
  fileId,
  importTarget,
  importMappings,
  validateAndCreate
) {
  return models.file
    .findByPk(fileId)
    .then((file) => {
      var workbook = new exceljs.Workbook();
      if (
        file.mime ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        return workbook.xlsx.readFile(file.path);
      } else if (file.mime === "text/csv") {
        return workbook.csv.readFile(req.file.path, {
          dateFormats: ["DD.MM.YYYY"],
          parserOptions: { delimiter: ",", quote: true },
        });
      } else {
        throw _t("error_wrong_filetype");
      }
    })
    .then((workbook) => {
      var worksheet = workbook.worksheets[0];
      var header = worksheet.getRow(1);
      var dbColumns = models[importTarget].getColumns();
      var promises = [];
      worksheet.eachRow((row, rowIndex) => {
        var getValue = function (columnName, bodyValue = undefined) {
          if (importMappings[columnName] !== undefined) {
            var cell = row.getCell(importMappings[columnName] + 1);
            var value = cell.value;
            if (cell.type === exceljs.ValueType.Number) {
              if (cell.numFmt && cell.numFmt.includes("%")) {
                // Detect Percent Values
                value = cell.value * 100;
              } else {
                value = cell.value;
              }
            } else if (cell.type === exceljs.ValueType.Hyperlink) {
              value = value.text;
            }
            return value;
          } else {
            return bodyValue;
          }
        };
        if (rowIndex > 1) {
          promises.push(
            validateAndCreate(getValue, rowIndex)
              .then((object) => {
                return {
                  success: true,
                  rowIndex: rowIndex,
                  row: row,
                  object: object,
                };
              })
              .catch((error) => {
                return {
                  success: false,
                  rowIndex: rowIndex,
                  row: row,
                  error: error,
                };
              })
          );
        }
      });
      return Promise.each(promises, (promise) => {
        return promise;
      });
    });
};

exports.Warning = function (message) {
  this.message = message;
  this.name = "Warning";
};
