/* jshint esversion: 8 */
const models = require("../models");
const security = require("../utils/security");
const intl = require("../utils/intl");
const communication = require("../utils/communication");
const router = require("express").Router();
const moment = require("moment");
const exceljs = require("exceljs");

module.exports = function (app) {
  router.post(
    "/communication/email",
    security.isLoggedInAdmin,
    function (req, res) {
      communication.getEmails(req.body.mode).then((emails) => {
        res.setHeader("Content-Length", emails.length);
        res.setHeader("Content-Type", "text/text");
        res.setHeader(
          "Content-Disposition",
          "inline; filename=emailaddresses.txt"
        );
        res.write(emails);
        res.end();
      });
    }
  );

  router.post(
    "/communication/addresses",
    security.isLoggedInAdmin,
    function (req, res, next) {
      return models.user
        .getUsers(models, req.body.mode, moment())
        .then((users) => {
          var workbook = new exceljs.Workbook();
          workbook.creator = "DK Plattform";
          workbook.created = new Date();
          var dataWorksheet = workbook.addWorksheet(
            `Adressen (${intl._t(req.body.mode)} ${intl._t("contracts")})`
          );
          var dataWorkSheetColumns = [];
          const fieldLabels = [
            "User ID",
            "Typ",
            "Anrede",
            "Titel",
            "Nachname",
            "Vorname",
            "Titel, nachgestellt",
            "Strasse",
            "PLZ",
            "Ort",
            "Land",
            "Telefonnummer",
            "E-Mail",
          ];
          fieldLabels.forEach((label) => {
            dataWorkSheetColumns.push({
              header: label,
              //              key: column.id,
              width: 20,
            });
          });
          dataWorksheet.columns = dataWorkSheetColumns;
          users.forEach((user) => {
            dataWorksheet.addRow([
              user.id,
              intl._t(`user_type_${user.type || "person"}`),
              intl._t(`user_salutation_${user.salutation || "personal"}`),
              user.title_prefix,
              user.last_name,
              user.first_name,
              user.title_suffix,
              user.street,
              user.zip,
              user.place,
              user.country,
              user.telno,
              user.email,
            ]);
          });
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=Adressen_${intl._t(req.body.mode)}_${intl._t(
              "contracts"
            )}_${moment().format("YYYYMMDDHHmmss")}.xlsx`
          );
          return workbook.xlsx.write(res).then(() => res.end());
        })
        .catch(next);
    }
  );

  app.use("/", router);
};
