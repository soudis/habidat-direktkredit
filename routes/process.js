/* jshint esversion: 8 */
const security = require("../utils/security");
const moment = require("moment");
const router = require("express").Router();
const utils = require("../utils");
const models = require("../models");
const settings = require("../utils/settings");
const contracttable = require("../utils/contracttable");
const exceljs = require("exceljs");
const multer = require("multer");
const _t = require("../utils/intl")._t;

module.exports = function (app) {
  const columnsVisible = [
    "contract_sign_date",
    "user_name",
    "user_iban",
    "contract_status",
    "contract_amount",
    "contract_amount_to_date",
    "contract_interest_of_year",
    "contract_interest_payment_of_year",
    "contract_interest_payment_type",
  ];

  router.get(
    "/process/interestpayment/:year",
    security.isLoggedInAdmin,
    function (req, res, next) {
      const endOfYear = moment().set("year", req.params.year).endOf("year");
      const startOfNextYear = moment()
        .set("year", req.params.year)
        .add(1, "year")
        .startOf("year");
      models.user
        .findFetchFull(models, {}, (user, contract) => {
          return (
            (contract.interest_payment_type === "yearly" ||
              (!contract.interest_payment_type &&
                settings.project.get("defaults.interest_payment_type") ===
                  "yearly")) &&
            !contract.isTerminated(endOfYear) &&
            contract.calculateToDate(startOfNextYear, req.params.year)
              .interestOfYear > 0
          );
        })
        .then((users) => {
          return models.transaction
            .min("transaction_date")
            .then((minTransactionDate) => {
              var years = [];
              for (
                var year = parseInt(moment(minTransactionDate).year());
                year <= parseInt(moment().year());
                year++
              ) {
                years.push(year.toString());
              }
              return utils.render(
                req,
                res,
                "process/interestpayment",
                {
                  success: req.flash("success"),
                  years: years,
                  year: req.params.year,
                  contracts: contracttable
                    .generateContractTable(
                      req,
                      res,
                      users,
                      moment().endOf("year").add(1, "day"),
                      req.params.year
                    )
                    .setColumnsVisible(columnsVisible),
                },
                "Jährliche Zinsauszahlung"
              );
            });
        })
        .catch((error) => next(error));
    }
  );

  router.get(
    "/process/startinterestpayment/:year/:contracts",
    security.isLoggedInAdmin,
    function (req, res, next) {
      if (
        !req.params.contracts ||
        req.params.contracts.split(",").length === 0
      ) {
        next(new Error("Keine Verträge ausgewählt"));
      }
      const startOfNextYear = moment()
        .set("year", req.params.year)
        .add(1, "year")
        .startOf("year");
      models.user
        .findFetchFull(models, {}, (user, contract) => {
          return req.params.contracts
            .split(",")
            .includes(contract.id.toString());
        })
        .then((users) => {
          var interests = 0;
          users.forEach((user) => {
            user.contracts.forEach((contract) => {
              interests +=
                Math.round(
                  contract.calculateToDate(startOfNextYear, req.params.year)
                    .interestOfYear * 100
                ) / 100;
            });
          });
          res.render("process/startinterestpayment", {
            contracts: req.params.contracts.split(","),
            year: req.params.year,
            interests: interests,
          });
        })
        .catch((error) => next(error));
    }
  );

  router.post(
    "/process/startinterestpayment",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      models.user
        .findFetchFull(models, {}, (user, contract) => {
          return req.body.contracts.split(",").includes(contract.id.toString());
        })
        .then((users) => {
          var create = [];
          users.forEach((user) => {
            user.contracts.forEach((contract) => {
              var transaction = {
                transaction_date: moment(req.body.year).endOf("year"),
                amount:
                  -Math.round(
                    contract.calculateToDate(
                      moment().add(1, "year"),
                      req.body.year
                    ).interestOfYear * 100
                  ) / 100,
                type: "interestpayment",
                contract_id: contract.id,
                payment_type: "bank",
              };
              create.push(
                models.transaction.create(transaction, {
                  trackOptions: utils.getTrackOptions(req.user, true),
                })
              );
            });
          });
          return Promise.all(create).then(() => {
            res.send({
              message: create.length + " Zahlungen angelegt.",
              redirect: "reload",
            });
          });
        })
        .catch((error) => next(error));
    }
  );

  router.get(
    "/process/import",
    security.isLoggedInAdmin,
    function (req, res, next) {
      res.render("process/import");
    }
  );

  router.post(
    "/process/import",
    security.isLoggedInAdmin,
    multer({ dest: "./upload/" }).single("file"),
    function (req, res, next) {
      Promise.resolve()
        .then(() => {
          // read file
          var workbook = new exceljs.Workbook();
          if (
            req.file.mimetype ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          ) {
            return workbook.xlsx.readFile(req.file.path);
          } else if (req.file.mimetype === "text/csv") {
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
          var example = worksheet.getRow(2);
          var dbColumns = models[req.body.import_target].getColumns();
          var fileColumns = [];
          header.eachCell((cell, colNumber) => {
            var fileColumn = cell.value;
            // try to find a matching db column
            var dbColumn = Object.keys(dbColumns).find((dbColumn) => {
              if (dbColumns[dbColumn].displayOnly !== true) {
                if (fileColumn.toLowerCase() === dbColumn.toLowerCase()) {
                  return true;
                } else if (
                  fileColumn.toLowerCase() ===
                  dbColumns[dbColumn].label.toLowerCase()
                ) {
                  return true;
                } else {
                  return false;
                }
              } else {
                delete dbColumns[dbColumn];
                return false;
              }
            });
            // second try with includes
            if (!dbColumn) {
              dbColumn = Object.keys(dbColumns).find((dbColumn) => {
                if (
                  fileColumn
                    .toLowerCase()
                    .includes(dbColumns[dbColumn].label.toLowerCase()) ||
                  dbColumns[dbColumn].label
                    .toLowerCase()
                    .includes(fileColumn.toLowerCase())
                ) {
                  return true;
                } else {
                  return false;
                }
              });
            }
            var exampleCell = example.getCell(colNumber);
            var exampleValue = exampleCell.value;
            if (exampleCell.type === exceljs.ValueType.Date) {
              exampleValue = moment(exampleValue).format("DD.MM.YYYY");
            } else if (exampleCell.text) {
              exampleValue = exampleCell.text;
            }
            fileColumns.push({
              header: fileColumn,
              mapping: dbColumn,
              example: exampleValue,
            });
          });
          return models.file
            .create(
              {
                filename: req.file.originalname,
                description: req.body.description,
                mime: req.file.mimetype,
                path: req.file.path,
                ref_table: "import_" + req.body.import_target,
              },
              { trackOptions: utils.getTrackOptions(req.user, true) }
            )
            .then((result) => {
              res.render("process/import_mapping", {
                fileColumns: fileColumns,
                dbColumns: dbColumns,
                importTarget: req.body.import_target,
                fileId: result.id,
              });
            });
        })
        .catch((error) => next(error));
    }
  );

  router.post(
    "/process/import_mapping",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      Promise.resolve()
        .then((file) => {
          var fileColumns = JSON.parse(req.body.file_columns);
          var importMappings = {};
          fileColumns.forEach((fileColumn, index) => {
            if (req.body["file_column_" + index] !== "not_assigned") {
              importMappings[req.body["file_column_" + index]] = index;
            }
          });
          if (
            req.body.import_target === "contract" &&
            importMappings["contract_user_id"] === undefined
          ) {
            throw "Eine Spalte der Datei muss der Kontonummer zugeordnet werden";
          }
          if (req.body.import_target === "user") {
            if (importMappings["user_first_name"] === undefined) {
              throw "Eine Spalte der Datei muss dem Feld Vorname zugeordnet werden";
            }
          }

          res.render(req.body.import_target + "/import", {
            importMappings: importMappings,
            importFileColumns: fileColumns,
            importFileId: req.body.file_id,
            importTarget: req.body.import_target,
          });
        })
        .catch((error) => next(error));
    }
  );

  app.use("/", router);
};
