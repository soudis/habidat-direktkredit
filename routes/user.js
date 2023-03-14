/* jshint esversion: 8 */
const security = require("../utils/security");
const moment = require("moment");
const router = require("express").Router();
const utils = require("../utils");
const Promise = require("bluebird");
const models = require("../models");
const multer = require("multer");
const exceljs = require("exceljs");
const crypto = require("crypto");
const contracttable = require("../utils/contracttable");
const settings = require("../utils/settings");

module.exports = function (app) {
  function renderUser(req, res, models, data) {
    return Promise.join(
      models.file.getUserTemplates(data.user.salutation),
      models.file.getContractTemplates(data.user.salutation),
      (templates_user, templates_contract) => {
        data.templates_user = templates_user;
        data.templates_contract = templates_contract;
        utils.render(req, res, "user/show", data);
      }
    );
  }

  const columnsVisible = [
    "contract_sign_date",
    "user_name",
    "contract_status",
    "contract_amount",
    "contract_deposit",
    "contract_withdrawal",
    "contract_amount_to_date",
  ];

  router.get(
    "/user/list/cancelled",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.user
        .cancelledAndNotRepaid(models, {})
        .then((users) =>
          utils.render(
            req,
            res,
            "user/list",
            {
              contracts: contracttable
                .generateContractTable(req, res, users)
                .setColumnsVisible(
                  (
                    columnsVisible.join(",") +
                    ",contract_termination_type,contract_termination_date,contract_payback_date"
                  ).split(",")
                ),
            },
            "Gekündigte, nicht ausgezahlte Kredite"
          )
        )
        .catch((error) => next(error));
    }
  );

  router.get("/user/list", security.isLoggedInAdmin, function (req, res, next) {
    models.user
      .findFetchFull(models, {})
      .then((users) =>
        utils.render(
          req,
          res,
          "user/list",
          {
            success: req.flash("success"),
            contracts: contracttable
              .generateContractTable(req, res, users)
              .setColumnsVisible(columnsVisible),
          },
          "Kreditliste"
        )
      )
      .catch((error) => next(error));
  });

  router.post(
    "/user/saveview",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.admin
        .findByPk(req.user.id)
        .then((user) => {
          var views;
          if (user.savedViews) {
            views = JSON.parse(user.savedViews);
          } else {
            views = [];
          }
          views.push(req.body.view);
          user.savedViews = JSON.stringify(views);
          req.user.savedViews = user.savedViews;
          return user
            .save({ trackOptions: utils.getTrackOptions(req.user, false) })
            .then(() => {
              res.send({ id: views.length - 1 });
            });
        })
        .catch((error) => next);
    }
  );

  router.post(
    "/user/saveview/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.admin
        .findByPk(req.user.id)
        .then((user) => {
          var views;
          if (user.savedViews) {
            views = JSON.parse(user.savedViews);
          } else {
            views = [];
          }
          views.splice(req.params.id, 1, req.body.view);
          user.savedViews = JSON.stringify(views);
          req.user.savedViews = user.savedViews;
          return user
            .save({ trackOptions: utils.getTrackOptions(req.user, false) })
            .then(() => {
              res.send({ id: req.params.id });
            });
        })
        .catch((error) => next);
    }
  );

  router.get(
    "/user/deleteview/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.admin
        .findByPk(req.user.id)
        .then((user) => {
          var views;
          if (user.savedViews) {
            views = JSON.parse(user.savedViews);
          } else {
            views = [];
          }
          views.splice(req.params.id, 1);
          user.savedViews = JSON.stringify(views);
          req.user.savedViews = user.savedViews;
          return user
            .save({ trackOptions: utils.getTrackOptions(req.user, false) })
            .then(() => {
              res.send({ id: req.body.id });
            });
        })
        .catch((error) => next);
    }
  );

  router.get("/user/add", security.isLoggedInAdmin, function (req, res, next) {
    res.render("user/add");
  });

  router.get(
    "/user/edit/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.user
        .findByIdFetchFull(models, req.params.id)
        .then((user) =>
          utils.render(
            req,
            res,
            "user/edit",
            { user: user },
            "Direktkreditgeber*in Bearbeiten"
          )
        )
        .catch((error) => next(error));
    }
  );

  router.get(
    "/user/show/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.user
        .findByIdFetchFull(models, req.params.id)
        .then((user) =>
          renderUser(req, res, models, {
            user: user,
            title: "Direktkreditgeber*in",
          })
        )
        .catch((error) => next(error));
    }
  );

  router.post(
    "/user/import",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      var validateAndCreate = function (getValue, rowIndex) {
        return models.user
          .validateEmailAddress(getValue("user_email", req.body.email), true)
          .then(() =>
            models.user.validateOrGenerateId(
              getValue("user_id", req.body.id),
              rowIndex - 1
            )
          )
          .then((userId) => {
            var user_type = getValue("user_type", req.body.type).toLowerCase();
            var dbColumns = models.user.getColumns();
            if (!["organisation", "person"].includes(user_type)) {
              throw (
                dbColumns["user_type"].label +
                ' muss entweder "organsiation" oder "person" sein'
              );
            }
            var first_name =
              user_type === "person"
                ? getValue("user_first_name", req.body.first_name)
                : getValue("user_first_name", req.body.organisation_name);
            var last_name =
              user_type === "person"
                ? getValue("user_last_name", req.body.last_name)
                : null;

            if (user_type === "person") {
              if (!!!first_name) {
                throw "Vorname fehlt";
              }
              if (!!!last_name) {
                throw "Nachname fehlt";
              }
            } else if (user_type === "organsiation") {
              if (!!!first_name) {
                throw "Organisationsname fehlt";
              }
            }

            var relationship = getValue(
              "user_relationship",
              req.body.relationship
            );
            var allowedRelationships = settings.project
              .get("defaults.relationships")
              .map((rel) => {
                return rel.toLowerCase();
              });
            if (
              relationship &&
              relationship !== "" &&
              !allowedRelationships.includes(relationship.toLowerCase())
            ) {
              throw (
                'Beziehung zum Projekt "' +
                relationship +
                '" ist nicht unter den erlaubten Werten (' +
                settings.project.get("defaults.relationships").join(", ") +
                ")"
              );
            } else if (relationship && relationship !== "") {
              relationship = settings.project.get("defaults.relationships")[
                allowedRelationships.indexOf(relationship.toLowerCase())
              ];
            } else {
              relationship = settings.project.get("defaults.relationships")[0];
            }

            var country = getValue("user_country", req.body.country);
            if (!country) {
              country = settings.project.get("defaults.country");
            }
            country = country.toUpperCase();

            return models.user.create(
              {
                id: userId,
                type: user_type,
                salutation:
                  user_type === "person"
                    ? getValue("user_salutation", req.body.salutation)
                    : null,
                title_prefix:
                  user_type === "person"
                    ? getValue("user_title_prefix", req.body.title_prefix)
                    : null,
                first_name:
                  user_type === "person"
                    ? getValue("user_first_name", req.body.first_name)
                    : getValue("user_first_name", req.body.organisation_name),
                last_name:
                  user_type === "person"
                    ? getValue("user_last_name", req.body.last_name)
                    : null,
                title_suffix:
                  user_type === "person"
                    ? getValue("user_title_suffix", req.body.title_suffix)
                    : null,
                street: getValue("user_street", req.body.street),
                zip: getValue("user_zip", req.body.zip),
                place: getValue("user_place", req.body.place),
                telno: getValue("user_telno", req.body.telno),
                email: getValue("user_email", req.body.email),
                country: country,
                IBAN: getValue("user_iban", req.body.IBAN),
                BIC: getValue("user_bic", req.body.BIC),
                account_notification_type: getValue(
                  "user_account_notification_type",
                  req.body.account_notification_type
                ),
                logon_id: Math.abs(Math.random() * 100000000),
                password: crypto.randomBytes(16).toString("hex"),
                relationship: relationship,
                membership_status: getValue(
                  "user_membership_status",
                  req.body.membership_status
                ),
              },
              {
                trackOptions: utils.getTrackOptions(req.user, true),
              }
            );
          });
      };

      utils
        .processImportFile(
          req.body.import_file_id,
          "user",
          JSON.parse(req.body.import_mappings),
          validateAndCreate
        )
        .then((result) => {
          var users = result
            .filter((entry) => {
              return entry.success;
            })
            .map((entry) => {
              return entry.object;
            });
          var errors = result.filter((entry) => {
            return !entry.success;
          });
          var importMappings = JSON.parse(req.body.import_mappings);
          var visibleColumns = Object.keys(importMappings);
          visibleColumns.push("user_id");
          visibleColumns.push("user_address");
          res.render("process/import_result", {
            rowCount: result.length,
            errors: errors,
            contracts: contracttable
              .generateContractTable(req, res, users)
              .setColumnsVisible(visibleColumns),
            importTarget: "user",
          });
        })
        .catch((error) => next(error));
    }
  );

  router.post(
    "/user/add",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      models.user
        .validateEmailAddress(req.body.email, req.body.ignore_warning)
        .then(() => models.user.validateOrGenerateId(req.body.id))
        .then((userId) => {
          var length = 8,
            charset =
              "!#+?-_abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            password = "";
          for (var i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
          }
          return models.user.create(
            {
              id: userId,
              type: req.body.type,
              salutation: req.body.salutation,
              title_prefix:
                req.body.type === "person" ? req.body.title_prefix : null,
              first_name:
                req.body.type === "person"
                  ? req.body.first_name
                  : req.body.organisation_name,
              last_name: req.body.type === "person" ? req.body.last_name : null,
              title_suffix:
                req.body.type === "person" ? req.body.title_suffix : null,
              street: req.body.street,
              zip: req.body.zip,
              place: req.body.place,
              telno: req.body.telno,
              email: req.body.email,
              country: req.body.country,
              IBAN: req.body.IBAN,
              BIC: req.body.BIC,
              account_notification_type: req.body.account_notification_type,
              logon_id: Math.abs(Math.random() * 100000000),
              password: password,
              relationship: req.body.relationship,
              membership_status: req.body.membership_status,
            },
            { trackOptions: utils.getTrackOptions(req.user, true) }
          );
        })
        .then((user) =>
          res.send({
            redirect: utils.generateUrl(req, "/user/show/" + user.id),
          })
        )
        .catch((error) => next(error));
    }
  );

  router.post(
    "/user/edit",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      models.user
        .update(
          {
            salutation: req.body.salutation,
            type: req.body.type,
            title_prefix:
              req.body.type === "person" ? req.body.title_prefix : "",
            first_name:
              req.body.type === "person"
                ? req.body.first_name
                : req.body.organisation_name,
            last_name: req.body.type === "person" ? req.body.last_name : "",
            title_suffix:
              req.body.type === "person" ? req.body.title_suffix : "",
            street: req.body.street,
            zip: req.body.zip,
            place: req.body.place,
            country: req.body.country,
            telno: req.body.telno,
            email: req.body.email,
            IBAN: req.body.IBAN,
            BIC: req.body.BIC,
            account_notification_type: req.body.account_notification_type,
            relationship: req.body.relationship,
            membership_status: req.body.membership_status,
          },
          {
            where: { id: req.body.id },
            trackOptions: utils.getTrackOptions(req.user, true),
          }
        )
        .then(() => res.send({ redirect: "reload" }))
        .catch((error) => next(error));
    }
  );

  router.get(
    "/user/delete/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.user
        .destroy({
          where: { id: req.params.id },
          trackOptions: utils.getTrackOptions(req.user, true),
        })
        .then(function (deleted) {
          if (deleted > 0) {
            res.json({ redirect: utils.generateUrl(req, "/user/list") });
          } else {
            res.json({
              error:
                "Direktkreditgeber*in konnte nicht gelöscht werden, überprüfe bitte ob noch Verträge oder Dateien bestehen",
            });
          }
        })
        .catch(function (error) {
          res.json({
            error:
              "Direktkreditgeber*in konnte nicht gelöscht werden, überprüfe bitte ob noch Verträge oder Dateien bestehen",
          });
        });
    }
  );

  router.post(
    "/user/bulkdelete",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      var ids = JSON.parse(req.body.ids);
      models.user
        .destroy({
          where: { id: ids },
          trackOptions: utils.getTrackOptions(req.user, true),
        })
        .then(function (deleted) {
          if (deleted > 0) {
            res.json({ deletedRows: deleted });
          } else {
            res.json({
              error:
                "Direktkreditgeber*innen konnten nicht gelöscht werden:" +
                error,
            });
          }
        })
        .catch(function (error) {
          res.json({
            error:
              "Direktkreditgeber*innen konnten nicht gelöscht werden: " + error,
          });
        });
    }
  );

  const generateDatasheetRow = function (
    interestYear,
    fields,
    contractTableRow
  ) {
    var row = [];
    contracttable
      .getContractTableColumns(interestYear)
      .forEach((column, index) => {
        if (fields === "all" || fields.includes(column.id)) {
          row.push(contractTableRow[index].valueRaw);
        }
      });
    return row;
  };

  router.get(
    "/user/loginas/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.user
        .findByPk(req.params.id)
        .then((user) => {
          req.logIn(user, (error) => {
            if (error) {
              next(error);
            } else {
              res.redirect(utils.generateUrl(req, "/"));
            }
          });
        })
        .catch((error) => next);
    }
  );

  router.post(
    "/user/export",
    security.isLoggedInAdmin,
    function (req, res, next) {
      var userIds = req.body.users.split(",");
      var fields = req.body.fields.split(",");
      var contractIds = req.body.contracts.split(",");
      var interestYear = req.body.interest_year
        ? req.body.interest_year
        : moment().subtract(1, "years").year();

      var workbook = new exceljs.Workbook();
      workbook.creator = "DK Plattform";
      workbook.created = new Date();

      var dataWorksheet = workbook.addWorksheet("Daten");

      dataWorkSheetColumns = [];
      contracttable
        .getContractTableColumns(interestYear)
        .forEach((column, index) => {
          if (fields === "all" || fields.includes(column.id)) {
            dataWorkSheetColumns.push({
              header: column.label,
              key: column.id,
              width: 20,
            });
          }
        });
      dataWorksheet.columns = dataWorkSheetColumns;
      models.user.findFetchFull(models, {}).then((users) => {
        users.forEach((user) => {
          if (userIds.includes(user.id.toString())) {
            var contractsCount = 0;
            if (user.contracts) {
              user.contracts.forEach((contract) => {
                if (contractIds.includes(contract.id.toString())) {
                  contractsCount++;
                  dataWorksheet.addRow(
                    generateDatasheetRow(
                      interestYear,
                      fields,
                      contracttable.contractTableRow(
                        user,
                        contract,
                        undefined,
                        interestYear
                      )
                    )
                  );
                }
              });
            }

            if (contractsCount === 0) {
              dataWorksheet.addRow(
                generateDatasheetRow(
                  interestYear,
                  fields,
                  contracttable.contractTableRow(
                    user,
                    undefined,
                    undefined,
                    interestYear
                  )
                )
              );
            }
          }
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=direktkredite_" +
            moment().format("YYYYMMDDHHmmss") +
            ".xlsx"
        );
        return workbook.xlsx.write(res).then(() => res.end());
      });
    }
  );

  app.use("/", router);
};
