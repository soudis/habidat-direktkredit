/* jshint esversion: 8 */
const security = require("../utils/security");
const statistics = require("../utils/statistics");
const format = require("../utils/format");
const moment = require("moment");
const utils = require("../utils");
const router = require("express").Router();
const models = require("../models");
const _t = require("../utils/intl")._t;
const multer = require("multer");
const Promise = require("bluebird");
const contracttable = require("../utils/contracttable");
const settings = require("../utils/settings");

module.exports = function (app) {
  /* Add contract */
  router.get(
    "/contract/add/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.user
        .findByIdFetchFull(models, req.params.id)
        .then((user) => utils.render(req, res, "contract/add", { user: user }))
        .catch((error) => next(error));
    }
  );

  /* Edit contract */
  router.get(
    "/contract/edit/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.contract
        .findByPk(req.params.id)
        .then((contract) => {
          return models.user
            .findByIdFetchFull(models, contract.user_id)
            .then((user) =>
              utils.render(req, res, "contract/edit", {
                user: user,
                editContract: contract,
              })
            );
        })
        .catch((error) => next(error));
    }
  );

  /* Edit contract */
  router.get(
    "/contract/amount_to_date/:contract_id/:transaction_id/:date",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.contract
        .findByIdFetchFull(models, req.params.contract_id)
        .then((contract) =>
          res.json({
            amountToDate: contract.calculateToDate(
              moment(req.params.date, "YYYY-MM-DD"),
              undefined,
              req.params.transaction_id
            ).end,
          })
        )
        .catch((error) => res.status(500).json({ error: error }));
    }
  );

  router.post(
    "/contract/import",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      var validateAndCreate = function (getValue, rowIndex) {
        return Promise.join(
          models.user.findByPk(getValue("contract_user_id")),
          models.contract.validateOrGenerateId(
            getValue("contract_id", req.body.id),
            rowIndex - 1
          ),
          (user, contractId) => {
            var userId = getValue("contract_user_id");
            if (userId === undefined || userId === null || userId === "") {
              throw "Kontonummer fehlt oder ist nicht zugeordnet";
            }
            console.log("userid", userId);
            console.log("user", user);
            if (!user || !user.id) {
              throw "Kein Konto mit Kontonummer " + userId + " gefunden";
            }

            var depositAmount = getValue("contract_deposit_amount");
            var depositDate = getValue("contract_deposit_date");
            if (depositAmount > 0 && !!!depositDate) {
              throw "Einzahlungsbetrag vorhanden, aber kein Einzahlungsdatum angegeben oder zugeordnet";
            }

            var termination_date = null;
            if (req.body.termination_type == "T") {
              termination_date = !!getValue(
                "contract_termination_date",
                req.body.termination_date_T
              )
                ? moment(req.body.termination_date_T)
                : null;
            } else if (req.body.termination_type == "D") {
              termination_date =
                req.body.termination_date_D == ""
                  ? null
                  : moment(req.body.termination_date_D);
            }
            var termination_period_type = null,
              termination_period = null;
            if (req.body.termination_type == "T") {
              termination_period_type = req.body.termination_period_type_T;
              termination_period = req.body.termination_period_T;
            } else if (req.body.termination_type == "P") {
              termination_period_type = req.body.termination_period_type_P;
              termination_period = req.body.termination_period_P;
            }

            var interest_payment_type = getValue(
              "contract_interest_payment_type",
              req.body.interest_payment_type
            );
            ["end", "yearly"].forEach((type) => {
              if (
                !!interest_payment_type &&
                interest_payment_type.toLowerCase() ===
                  _t("interest_payment_type_" + type).toLowerCase()
              ) {
                interest_payment_type = type;
              }
            });

            var interest_method = getValue(
              "contract_interest_method",
              req.body.interest_method
            );
            if (
              interest_method &&
              !(
                settings.project.get("defaults.interest_methods_alternative") ||
                []
              ).includes(interest_method)
            ) {
              throw "Alternative Zinsberechnungsmethode nicht unter den erlaubten alternativen Zinsberechnungsmethoden (siehe Einstellungen)";
            }

            return models.contract
              .create(
                {
                  id: contractId,
                  sign_date: moment(
                    getValue("contract_sign_date", req.body.sign_date)
                  ),
                  interest_payment_type: interest_payment_type,
                  termination_date: termination_date,
                  termination_type: req.body.termination_type,
                  termination_period: termination_period,
                  termination_period_type: termination_period_type,
                  amount: getValue("contract_amount", req.body.amount),
                  interest_rate: getValue(
                    "contract_interest_rate",
                    req.body.interest_rate
                  ),
                  interest_method: interest_method,
                  user_id: userId,
                  status: req.body.status,
                  notes: getValue("contract_notes", req.body.notes),
                  notes_public: req.body.notes_public ? true : false,
                },
                { trackOptions: utils.getTrackOptions(req.user, true) }
              )
              .then((contract) => {
                if (depositAmount > 0) {
                  var transaction = {
                    transaction_date: moment(depositDate).format("YYYY-MM-DD"),
                    amount: depositAmount,
                    type: "initial",
                    contract_id: contract.id,
                    payment_type: "other",
                  };
                  return models.transaction
                    .create(transaction, {
                      trackOptions: utils.getTrackOptions(req.user, true),
                    })
                    .then((transaction) => {
                      return contract;
                    });
                } else {
                  return contract;
                }
              });
          }
        );
      };

      utils
        .processImportFile(
          req.body.import_file_id,
          "contract",
          JSON.parse(req.body.import_mappings),
          validateAndCreate
        )
        .then((result) => {
          var errors = result.filter((entry) => {
            return !entry.success;
          });
          var contractIds = result
            .filter((entry) => {
              return entry.success;
            })
            .map((entry) => {
              return entry.object.id;
            });
          return models.user
            .findFetchFull(models, {}, (user, contract) => {
              return contractIds.includes(contract.id);
            })
            .then((users) => {
              var importMappings = JSON.parse(req.body.import_mappings);
              var visibleColumns = Object.keys(importMappings);
              visibleColumns.push("contract_id");
              visibleColumns.push("user_name");
              var contractTable = contracttable
                .generateContractTable(req, res, users)
                .setColumnsVisible(visibleColumns);
              res.render("process/import_result", {
                rowCount: result.length,
                errors: errors,
                contracts: contractTable,
                importTarget: "contract",
              });
            });
        })
        .catch((error) => next(error));
    }
  );

  router.post(
    "/contract/add",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      Promise.resolve()
        .then(() => {
          return models.user.findByPk(req.body.user_id).then((user) => {
            if (user.country === "DE" && !req.body.ignore_warning) {
              return statistics
                .getGermanContractsByYearAndInterestRate(
                  req.body.sign_date,
                  req.body.interest_rate
                )
                .then((result) => {
                  if (
                    result.length > 0 &&
                    result[0].totalAmount + req.body.amount > 100000
                  ) {
                    throw new utils.Warning(
                      "In diesem Zeitraum sind für diesen Zinssatz bereits Kredite aus Deutschland in der Höhe von " +
                        format.formatMoney(result[0].totalAmount) +
                        " angelegt (siehe Auswertungen / Kredite aus Deutschland)"
                    );
                  }
                });
            }
            return;
          });
        })
        .then(() => {
          if (req.body.id && req.body.id !== "") {
            return models.contract.findByPk(req.body.id).then((taken) => {
              if (taken) {
                throw "Kreditnummer bereits vergeben";
              } else {
                return req.body.id;
              }
            });
          } else {
            return models.contract.max("id").then((id) => {
              return id + 1;
            });
          }
        })
        .then((contractId) => {
          var termination_date = null;
          if (req.body.termination_type == "T") {
            termination_date =
              req.body.termination_date_T == ""
                ? null
                : moment(req.body.termination_date_T);
          } else if (req.body.termination_type == "D") {
            termination_date =
              req.body.termination_date_D == ""
                ? null
                : moment(req.body.termination_date_D);
          }
          var termination_period_type = null,
            termination_period = null;
          if (req.body.termination_type == "T") {
            termination_period_type = req.body.termination_period_type_T;
            termination_period = req.body.termination_period_T;
          } else if (req.body.termination_type == "P") {
            termination_period_type = req.body.termination_period_type_P;
            termination_period = req.body.termination_period_P;
          }
          return models.contract.create(
            {
              id: contractId,
              sign_date: moment(req.body.sign_date),
              interest_payment_type: req.body.interest_payment_type,
              termination_date: termination_date,
              termination_type: req.body.termination_type,
              termination_period: termination_period,
              termination_period_type: termination_period_type,
              amount: req.body.amount,
              interest_rate: req.body.interest_rate,
              interest_method: req.body.interest_method,
              user_id: req.body.user_id,
              status: req.body.status,
              notes: req.body.notes,
              notes_public: req.body.notes_public ? true : false,
            },
            { trackOptions: utils.getTrackOptions(req.user, true) }
          );
        })
        .then((contract) =>
          models.contract.findOne({
            where: { id: contract.id },
            include: [{ model: models.transaction, as: "transactions" }],
          })
        )
        .then((contract) => {
          return models.file.getContractTemplates().then((templates) =>
            utils.render(req, res, "contract/show", {
              templates_contract: templates,
              contract: contract,
            })
          );
        })
        .catch((error) => next(error));
    }
  );

  router.post(
    "/contract/edit",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      return Promise.resolve()
        .then(() => {
          return models.user.findByPk(req.body.user_id).then((user) => {
            if (user.country === "DE" && !req.body.ignore_warning) {
              return statistics
                .getGermanContractsByYearAndInterestRate(
                  req.body.sign_date,
                  req.body.interest_rate,
                  req.body.id
                )
                .then((result) => {
                  if (
                    result.length > 0 &&
                    result[0].totalAmount + parseFloat(req.body.amount) > 100000
                  ) {
                    throw new utils.Warning(
                      "In diesem Zeitraum sind für diesen Zinssatz bereits Kredite aus Deutschland in der Höhe von " +
                        format.formatMoney(result[0].totalAmount) +
                        " angelegt (siehe Auswertungen / Kredite aus Deutschland)"
                    );
                  }
                });
            }
            return;
          });
        })
        .then(() => models.contract.findByIdFetchFull(models, req.body.id))
        .then((contract) => {
          // if there is a deposit from last year or earlier print warning when changing crucial info to the interest calculation
          if (
            contract.getDepositDate() &&
            contract.getDepositDate().year() < moment().year() &&
            !req.body.ignore_warning
          ) {
            const checkField = (field, value, label) => {
              console.log(field, contract[field], value);
              if ((contract[field] || "") !== (value || ""))
                throw new utils.Warning(
                  `Dieser Vertrag hat bereits Zahlungen aus den Vorjahren, ${label} zu ändern, ändert im Nachhinein die berechneten Zinsen`
                );
            };
            checkField(
              "interest_rate",
              parseFloat(req.body.interest_rate),
              "den Zinssatz"
            );
            checkField(
              "interest_method",
              req.body.interest_method,
              "die Zinsberechnungsmethode"
            );
          }

          if (
            !req.body.ignore_warning &&
            contract.amount != parseFloat(req.body.amount) &&
            contract.amount < contract.calculateToDate().deposits
          ) {
            throw new utils.Warning(
              `Der geänderte Vertragswert (${format.formatMoney(
                parseFloat(req.body.amount)
              )}) ist kleiner als die Einzahlungen (${format.formatMoney(
                contract.contract.calculateToDate().deposits
              )})`
            );
          }

          if (contract.interest_rate !== req.body.inter)
            var termination_date = null;
          if (req.body.termination_type == "T") {
            termination_date =
              req.body.termination_date_T == ""
                ? null
                : moment(req.body.termination_date_T).format("YYYY-MM-DD");
          } else if (req.body.termination_type == "D") {
            termination_date =
              req.body.termination_date_D == ""
                ? null
                : moment(req.body.termination_date_D).format("YYYY-MM-DD");
          }
          var termination_period_type = null,
            termination_period = null;
          if (req.body.termination_type == "T") {
            termination_period_type = req.body.termination_period_type_T;
            termination_period = req.body.termination_period_T;
          } else if (req.body.termination_type == "P") {
            termination_period_type = req.body.termination_period_type_P;
            termination_period = req.body.termination_period_P;
          }

          return models.contract.update(
            {
              sign_date: moment(req.body.sign_date).toDate(),
              termination_date: termination_date,
              interest_payment_type: req.body.interest_payment_type,
              termination_type: req.body.termination_type,
              termination_period: parseFloat(termination_period),
              termination_period_type: termination_period_type,
              amount: parseFloat(req.body.amount),
              interest_rate: parseFloat(req.body.interest_rate),
              interest_method: req.body.interest_method,
              status: req.body.status,
              notes: req.body.notes,
              notes_public: req.body.notes_public ? true : false,
            },
            {
              where: { id: req.body.id },
              trackOptions: utils.getTrackOptions(req.user, true),
            }
          );
        })

        .then(() => models.contract.findByIdFetchFull(models, req.body.id))
        .then((contract) => {
          return models.file.getContractTemplates().then((templates) =>
            utils.render(req, res, "contract/show", {
              templates_contract: templates,
              contract: contract,
            })
          );
        })
        .catch((error) => next(error));
    }
  );

  router.get(
    "/contract/delete/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.contract
        .destroy({
          where: { id: req.params.id },
          trackOptions: utils.getTrackOptions(req.user, true),
        })
        .then((deleted) => {
          if (deleted > 0) {
            res.json({});
          } else {
            res.json({
              error:
                "Vertrag konnte nicht gelöscht werden, überprüfe bitte ob noch Zahlungen bestehen",
            });
          }
        })
        .catch((error) => {
          res.status(500).json({ error: error });
        });
    }
  );

  router.post(
    "/contract/bulkdelete",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      var ids = JSON.parse(req.body.ids);
      models.contract
        .destroy({
          where: { id: ids },
          trackOptions: utils.getTrackOptions(req.user, true),
        })
        .then(function (deleted) {
          if (deleted > 0) {
            res.json({ deletedRows: deleted });
          } else {
            res.json({
              error: "Kreditverträge konnten nicht gelöscht werden:" + error,
            });
          }
        })
        .catch(function (error) {
          res.json({
            error: "Kreditverträge konnten nicht gelöscht werden: " + error,
          });
        });
    }
  );

  app.use("/", router);
};
