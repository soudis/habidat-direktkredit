/* jshint esversion: 8 */
const security = require("../utils/security");
const router = require("express").Router();
const utils = require("../utils");
const Promise = require("bluebird");
const Op = require("sequelize").Op;
const models = require("../models");
const settings = require("../utils/settings");
const fs = require("fs");
const multer = require("multer");
const email = require("../utils/email");
const moment = require("moment");
const bcrypt = require("bcrypt");
const { _t } = require("../utils/intl");

module.exports = function (app) {
  router.get(
    "/admin/accounts",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.admin
        .findAll()
        .then((users) =>
          utils.render(
            req,
            res,
            "admin/admin_accounts",
            { accounts: users, message: req.flash("error") },
            "Administrator*innen Accounts"
          )
        )
        .catch((error) => next(error));
    }
  );

  router.get(
    "/admin/add_account",
    security.isLoggedInAdmin,
    function (req, res, next) {
      utils
        .render(req, res, "admin/admin_accounts_add", {})
        .catch((error) => next(error));
    }
  );

  router.get(
    "/admin/delete/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.admin
        .destroy({
          where: {
            id: req.params.id,
          },
          trackOptions: utils.getTrackOptions(req.user, true),
        })
        .then((deleted) => {
          if (deleted > 0) {
            res.json({ redirect: utils.generateUrl(req, "/admin/accounts") });
          } else {
            res.status(500).json({
              error:
                "Es wurde kein Account gelöscht, das sollte nicht passieren!",
            });
          }
        })
        .catch((error) => {
          res.status(500).json({ error: error });
        });
    }
  );

  router.post(
    "/admin/add",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      Promise.resolve()
        .then(() => {
          if (!req.body.logon_id) {
            throw "Login ID muss angegeben werden!";
          } else if (!req.body.email) {
            throw "E-Mailadresse muss angegeben werden!";
          }

          var length = 16,
            charset =
              "!#+?-_abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            generatedPassword = "";
          for (var i = 0, n = charset.length; i < length; ++i) {
            generatedPassword += charset.charAt(Math.floor(Math.random() * n));
          }

          var salt = bcrypt.genSaltSync(10);
          var passwordHashed = bcrypt.hashSync(generatedPassword, salt);

          var user = {
            logon_id: req.body.logon_id,
            email: req.body.email,
            passwordHashed: passwordHashed,
          };
          if (req.body.ldap) {
            user.ldap = true;
          } else {
            user.ldap = false;
          }

          return models.admin.build(user);
        })
        .then((user) => {
          if (req.body.send_password_link) {
            user.setPasswordResetToken();
            return user
              .save({ trackOptions: utils.getTrackOptions(req.user, false) })
              .then(() => email.sendPasswordMail(req, res, user));
          } else {
            return user.save({
              trackOptions: utils.getTrackOptions(req.user, false),
            });
          }
        })
        .then(() =>
          res.send({ redirect: utils.generateUrl(req, "/admin/accounts") })
        )
        .catch((error) => next(error));
    }
  );

  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/images");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });

  router.post(
    "/admin/settings",
    security.isLoggedInAdmin,
    multer({ storage: storage }).fields([
      { name: "logo_upload", maxCount: 1 },
      { name: "logo_select_upload", maxCount: 1 },
    ]),
    function (req, res, next) {
      Promise.resolve()
        .then(() => {
          var setSetting = function (
            id,
            value = undefined,
            checkbox = false,
            overwriteNull = true
          ) {
            if (checkbox) {
              settings.project.set(id, value || req.body[id] ? true : false);
            } else {
              settings.project.set(
                id,
                value || req.body[id],
                true,
                overwriteNull
              );
            }
          };

          setSetting("projectname");
          setSetting("project_iban");
          setSetting("project_bic");
          setSetting("email");
          setSetting("email_sendcopy", undefined, true);
          setSetting("smtp.host", req.body.smtp_host);
          setSetting("smtp.port", req.body.smtp_port);
          setSetting("smtp.auth.user", req.body.smtp_auth_user);
          setSetting("smtp.auth.pass", req.body.smtp_auth_pass, false, false);
          setSetting("url");
          setSetting("theme");
          setSetting("defaults.interest_method", req.body.interest_method);
          setSetting(
            "defaults.interest_methods_alternative",
            utils.toArray(req.body.interest_methods_alternative)
          );
          setSetting(
            "defaults.interest_payment_type",
            req.body.interest_payment_type
          );
          setSetting("defaults.termination_type", req.body.termination_type);
          setSetting(
            "defaults.termination_period",
            req.body.termination_period
          );
          setSetting(
            "defaults.termination_period_type",
            req.body.termination_period_type
          );
          setSetting(
            "defaults.relationships",
            JSON.parse(req.body.relationships) || []
          );
          setSetting("defaults.country", req.body.country);
          setSetting("usersuffix", req.body.usersuffix);

          if (req.body.logo_change === "logo_link") {
            setSetting("logo", req.body.logo_link);
          } else if (
            req.body.logo_change === "logo_upload" &&
            req.files &&
            req.files["logo_upload"] &&
            req.files["logo_upload"].length == 1 &&
            req.files["logo_upload"][0].originalname
          ) {
            setSetting(
              "logo",
              "/public/images/" + req.files["logo_upload"][0].originalname
            );
          }

          if (req.body.logo_select_change === "logo_select_link") {
            setSetting("logo_select", req.body.logo_select_link);
          } else if (
            req.body.logo_select_change === "logo_select_upload" &&
            req.files &&
            req.files["logo_select_upload"] &&
            req.files["logo_select_upload"].length == 1 &&
            req.files["logo_select_upload"][0].originalname
          ) {
            setSetting(
              "logo_select",
              "/public/images/" +
                req.files["logo_select_upload"][0].originalname
            );
          }

          settings.project.setDefaults();

          return settings.project.save();
        })
        .then(() =>
          res.send({ redirect: utils.generateUrl(req, "/admin/settings") })
        )
        .catch((error) => next(error));
    }
  );

  router.get(
    "/admin/settings",
    security.isLoggedInAdmin,
    function (req, res, next) {
      Promise.resolve()
        .then(email.testEmailSettings)
        .catch((error) => {
          return error;
        })
        .then((emailError) => {
          console.log(emailError);
          utils.render(
            req,
            res,
            "admin/settings",
            { emailError: emailError },
            "Einstellungen"
          );
        })
        .catch((error) => next(error));
    }
  );

  router.get(
    "/admin/test_email_settings",
    security.isLoggedInAdmin,
    function (req, res, next) {
      Promise.resolve()
        .then(email.testEmailSettings)
        .catch((error) => {
          return error;
        })
        .then((emailError) => {
          if (emailError !== true) {
            utils.render(req, res, "partials/error", {
              error: {
                message: `Kein E-Mailversand möglich, bitte überprüfe die <a href="${utils.generateUrl(
                  req,
                  "/admin/settings"
                )}">SMTP Einstellungen</a>: ${emailError}`,
              },
            });
          } else {
            res.end();
          }
        })
        .catch((error) => next(error));
    }
  );

  router.get(
    "/admin/edit_settings",
    security.isLoggedInAdmin,
    function (req, res, next) {
      utils
        .render(req, res, "admin/settings_edit", {})
        .catch((error) => next(error));
    }
  );

  router.get(
    "/admin/templates",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.file
        .findAll({
          where: {
            ref_table: {
              [Op.like]: "template_%",
            },
          },
        })
        .then(function (templates) {
          const accountNotficationsComplete =
            templates.find(
              (t) =>
                t.ref_table === "template_account_notification" &&
                t.salutation === "all"
            ) ||
            (templates.find(
              (t) =>
                t.ref_table === "template_account_notification" &&
                t.salutation === "personal"
            ) &&
              templates.find(
                (t) =>
                  t.ref_table === "template_account_notification" &&
                  t.salutation === "formal"
              ));

          res.render("admin/templates", {
            title: "Vorlagen",
            templates,
            accountNotficationsComplete,
          });
        });
    }
  );

  router.get(
    "/admin/templatehelp",
    security.isLoggedInAdmin,
    function (req, res, next) {
      res.render("admin/template_help", {
        title: "Vorlagenfelder",
        userColumns: models.user.getColumns(),
        contractColumns: models.contract.getColumns(),
        transactionColumns: models.transaction.getColumns(),
      });
    }
  );

  router.get(
    "/admin/infopack",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.file
        .findAll({
          where: {
            ref_table: {
              [Op.like]: "infopack_%",
            },
          },
        })
        .then(function (files) {
          groups = {
            balance: {
              title: "Jahresabschlüsse",
              files: [],
            },
            infopack: {
              title: "Direktkreditinformationen",
              files: [],
            },
            other: {
              title: "Sonstige Dateien",
              files: [],
            },
          };
          files.map((file) => {
            var group = file.ref_table.split("_")[1];
            file.group = group;
            if (groups[group]) {
              groups[group].files.push(file);
            }
          });
          res.render("admin/infopack", {
            title: "Downloads für Direktkreditgeber*innen",
            groups: groups,
          });
        });
    }
  );

  router.get(
    "/admin/addtemplate/:type",
    security.isLoggedInAdmin,
    function (req, res, next) {
      var titles = {
        infopack_balance: "Jahresabschluss hochladen",
        infopack_infopack: "Kreditinformation hochladen",
        infopack_other: "Sonstige Datei hochladen",
        template_account_notification: "Vorlage für Kontomitteilung hochladen",
        template_user: "Vorlage für Kreditgeber*innen hochladen",
        template_contract: "Vorlage für Kredite hochladen",
      };
      utils
        .render(req, res, "admin/template_add", {
          type: req.params.type,
          formTitle: titles[req.params.type],
        })
        .catch((error) => next(error));
    }
  );

  router.post(
    "/admin/addtemplate",
    security.isLoggedInAdmin,
    multer({ dest: "./upload/" }).single("file"),
    function (req, res, next) {
      var type = req.body.type;
      Promise.resolve()
        .then(() => {
          if (type == "template_account_notification") {
            return models.file
              .findAll({
                where: {
                  ref_table: "template_account_notification",
                },
              })
              .then((files) => {
                if (
                  (files.length > 0 && req.body.salutation === "all") ||
                  files.find(
                    (f) =>
                      (f.salutation || "all") === "all" ||
                      f.salutation === req.body.salutation
                  )
                ) {
                  throw _t("error_salutation_exists");
                } else {
                  return;
                }
              });
          } else {
            return;
          }
        })
        .then(() =>
          models.file.create(
            {
              filename: req.file.originalname,
              description: req.body.description,
              salutation: req.body.salutation,
              mime: req.file.mimetype,
              path: req.file.path,
              ref_table: type,
            },
            { trackOptions: utils.getTrackOptions(req.user, true) }
          )
        )
        .then(() => res.json({ redirect: "reload" }))
        .catch((error) => next(error));
    }
  );

  router.get(
    "/admin/auditlog/:timeframe",
    security.isLoggedInAdmin,
    function (req, res, next) {
      var where = {
        timestamp: {
          [Op.gte]: moment()
            .subtract(
              req.params.timeframe.substr(0, req.params.timeframe.length - 1),
              req.params.timeframe.substr(req.params.timeframe.length - 1, 1)
            )
            .toDate(),
        },
      };
      Promise.join(
        models.userLog.findAll({ where: where, include: { all: true } }),
        models.contractLog.findAll({
          where: where,
          include: [
            { model: models.admin, as: "user" },
            {
              model: models.contract,
              as: "target",
              include: { model: models.user, as: "user" },
            },
          ],
        }),
        models.transactionLog.findAll({
          where: where,
          include: [
            { model: models.admin, as: "user" },
            {
              model: models.transaction,
              as: "target",
              include: {
                model: models.contract,
                as: "contract",
                include: { model: models.user, as: "user" },
              },
            },
          ],
        }),
        models.fileLog.findAll({
          where: where,
          include: [
            { model: models.admin, as: "user" },
            {
              model: models.file,
              as: "target",
              include: { model: models.user, as: "user" },
            },
          ],
        }),
        function (userLog, contractLog, transactionLog, fileLog) {
          const addType = function (list, type) {
            list.forEach((entry) => {
              entry.type = type;
            });
            return list;
          };
          var auditLog = addType(userLog, "user").concat(
            addType(contractLog, "contract"),
            addType(transactionLog, "transaction"),
            addType(fileLog, "file")
          );
          auditLog.sort((a, b) => {
            return moment(a.timestamp).isAfter(moment(b.timestamp));
          });
          res.render("admin/auditlog", {
            timeframe: req.params.timeframe,
            auditLog: auditLog,
            title: "Änderungsprotokoll",
          });
        }
      );
    }
  );
  app.use("/", router);
};
