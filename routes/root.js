/* jshint esversion: 8 */
const path = require("path");
const fs = require("fs");
const security = require("../utils/security");
const passport = require("passport");
const router = require("express").Router();
const settings = require("../utils/settings");
const models = require("../models");
const utils = require("../utils");
const email = require("../utils/email");
const bcrypt = require("bcrypt");
const archiver = require("archiver");

module.exports = function (app) {
  router.get("/projectconfig", function (req, res, next) {
    var project = settings.project.get(undefined);
    res.json({
      projectname: project.projectname,
      logo: project.logo,
      logo_select: project.logo_select,
    });
  });

  router.get("/imprint", function (req, res) {
    res.render("imprint");
  });

  /* Welcome Site */
  router.get("/", security.isLoggedInAdmin, function (req, res, next) {
    res.redirect(utils.generateUrl(req, "/user/list"));
  });

  /* Welcome Site */
  router.get("/login", function (req, res, next) {
    res.render("index", {
      title: "Login",
      error:
        req.flash("loginMessage").length > 0
          ? "Falscher Benutzername oder falsches Passwort"
          : undefined,
      success: req.flash("success"),
    });
  });

  /* OIDC-Login */
  router.get("/login-oidc", passport.authenticate("user-oidc"));

  /* OIDC-Admin-Login */
  router.get("/login-oidc-admin", passport.authenticate("admin-oidc"));

  /* OIDC-Callback */
  router.get(
    "/login-oidc-cb-admin",
    passport.authenticate("admin-oidc", {
      failureRedirect: "/login",
      failureMessage: true,
    }),
    function (req, res, next) {
      res.redirect(utils.generateUrl(req, "/user/list"));
    },
  );
  /* OIDC-Callback */
  router.get(
    "/login-oidc-cb",
    passport.authenticate("user-oidc", {
      failureRedirect: "/login",
      failureMessage: true,
    }),
    function (req, res, next) {
      res.redirect(utils.generateUrl(req, "/profile"));
    },
  );

  router.get("/getpassword", function (req, res, next) {
    res.render("getpassword", {
      title: "Passwort rücksetzen",
      error: req.flash("error"),
    });
  });

  router.get(
    "/setpassword/user",
    security.isLoggedIn,
    function (req, res, next) {
      res.render("setpassword", {
        user: req.user,
        usertype: "user",
        title: "Passwort ändern",
        error: req.flash("error"),
      });
    },
  );

  router.get(
    "/setpassword/admin",
    security.isLoggedInAdmin,
    function (req, res, next) {
      res.render("setpassword", {
        user: req.user,
        usertype: "admin",
        title: "Passwort ändern",
        error: req.flash("error"),
      });
    },
  );

  router.get("/getpassword/:token", function (req, res, next) {
    models.admin
      .findByToken(req.params.token)
      .catch((error) => {
        // if no admin account was found by token try user accounts
        return models.user.findByToken(req.params.token);
      })
      .then((user) => {
        res.render("setpassword", {
          token: req.params.token,
          usertype: user.isAdmin() ? "admin" : "user",
          user: user,
          title: "Passwort setzen",
          error: req.flash("error"),
        });
      })
      .catch((error) => {
        req.flash("error", error);
        res.redirect(utils.generateUrl(req, "/getpassword"));
      });
  });

  router.post("/setpassword", security.isLoggedIn, function (req, res, next) {
    if (!req.body.password || req.body.password === "") {
      req.flash("error", "Passwort darf nicht leer sein!");
      res.redirect(utils.generateUrl(req, "/setpassword/" + req.body.usertype));
    } else if (req.body.password !== req.body.passwordRepeat) {
      req.flash("error", "Passwörter müssen übereinstimmen");
      res.redirect(utils.generateUrl(req, "/setpassword/" + req.body.usertype));
    } else {
      Promise.resolve()
        .then(() => {
          var salt = bcrypt.genSaltSync(10);
          var passwordHashed = bcrypt.hashSync(req.body.password, salt);
          if (req.body.usertype === "admin") {
            return models.admin.update(
              {
                passwordHashed: passwordHashed,
                passwordResetToken: null,
                passwordResetExpires: null,
              },
              {
                where: { id: req.user.id },
                trackOptions: utils.getTrackOptions(req.user, true),
              },
            );
          } else {
            return models.user.update(
              {
                passwordHashed: passwordHashed,
                password: null,
                passwordResetToken: null,
                passwordResetExpires: null,
              },
              {
                where: { id: req.user.id },
                trackOptions: utils.getTrackOptions(req.user, true),
              },
            );
          }
        })
        .then(() => {
          req.flash("success", "Dein Passwort wurde geändert");
          res.redirect(utils.generateUrl(req, "/"));
        });
    }
  });

  router.post("/setpasswordbytoken", function (req, res, next) {
    if (!req.body.password || req.body.password === "") {
      req.flash("error", "Passwort darf nicht leer sein!");
      res.redirect(utils.generateUrl(req, "/getpassword/" + req.body.token));
    } else if (req.body.password !== req.body.passwordRepeat) {
      req.flash("error", "Passwörter müssen übereinstimmen");
      res.redirect(utils.generateUrl(req, "/getpassword/" + req.body.token));
    } else {
      Promise.resolve()
        .then(() => {
          var salt = bcrypt.genSaltSync(10);
          var passwordHashed = bcrypt.hashSync(req.body.password, salt);
          if (req.body.usertype === "admin") {
            return models.admin.update(
              {
                passwordHashed: passwordHashed,
                passwordResetToken: null,
                passwordResetExpires: null,
              },
              {
                where: { passwordResetToken: req.body.token },
                trackOptions: utils.getTrackOptions(req.user, true),
              },
            );
          } else {
            return models.user.update(
              {
                passwordHashed: passwordHashed,
                password: null,
                passwordResetToken: null,
                passwordResetExpires: null,
              },
              {
                where: { passwordResetToken: req.body.token },
                trackOptions: utils.getTrackOptions(req.user, true),
              },
            );
          }
        })
        .then(() => {
          req.flash(
            "success",
            "Dein Passwort wurde gesetzt, logge dich jetzt ein",
          );
          res.redirect(utils.generateUrl(req, "/"));
        });
    }
  });

  router.post("/getpassword", function (req, res, next) {
    models.admin
      .findOne({ where: { email: req.body.email } })
      .then((user) => {
        if (!user) {
          // if no admin account was found by token try user accounts
          return models.user.findOne({ where: { email: req.body.email } });
        } else {
          return user;
        }
      })
      .then((user) => {
        if (!user) {
          return;
        } else {
          console.log("user found: ", user.isAdmin());
          user.setPasswordResetToken();
          return user
            .save({ trackOptions: utils.getTrackOptions(req.user, false) })
            .then((user) => email.sendPasswordMail(req, res, user));
        }
      })
      .then(() => {
        req.flash(
          "success",
          "Falls dein Account gefunden wurde, hast du ein E-Mail mit einem Link bekommen. Bitte sieh auch in deinem Spam-Ordner nach.",
        );
        res.redirect(utils.generateUrl(req, "/"));
      })
      .catch((error) => {
        req.flash("error", "E-Mail konnte nicht versandt werden: " + error);
        res.redirect(utils.generateUrl(req, "/getpassword"));
      });
  });

  /*
  router.get('/project', function(req, res, next) {
        res.render('select-project', { title: 'habiDAT - Projectauswahl',projects: projects} );
  });
*/
  /* Welcome Site */
  /*	router.get('/project/:project', function(req, res, next) {
    req.session.project = req.params.project;
    req.session.projectConfig = projects[req.params.project];
    req.logout();
        res.redirect('/');
  });*/

  router.get("/admin", security.isLoggedInAdmin, function (req, res) {
    res.redirect(utils.generateUrl(req, "/user/list"));
  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  router.get("/logout", function (req, res, next) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect(utils.generateUrl(req, "/"));
    });
  });

  //=====================================
  //LOGOUT ==============================
  //=====================================
  router.get("/admin-logout", function (req, res) {
    req.logout();
    res.redirect(utils.generateUrl(req, "/"));
  });

  var loginStrategies = [];
  settings.config.get("auth.admin.method").forEach((strategy) => {
    if (strategy !== "oidc") {
      loginStrategies.push("admin-" + strategy);
    }
  });
  settings.config.get("auth.user.method").forEach((strategy) => {
    if (strategy !== "oidc") {
      loginStrategies.push("user-" + strategy);
    }
  });
  router.post("/login", function (req, res, next) {
    passport.authenticate(loginStrategies, function (err, user, info) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.redirect(utils.generateUrl(req, "/"));
      }
      req.logIn(user, function (err) {
        if (err) {
          return next(err);
        }
        if (req.session.returnTo) {
          return res.redirect(req.session.returnTo);
        } else {
          return res.redirect(utils.generateUrl(req, "/profile"));
        }
      });
    })(req, res, next);
  });

  router.get("/migrate", function (req, res, next) {
    var token =
      req.query.token ||
      req.get("X-Migration-Token") ||
      (req.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    var expectedToken = process.env.MIGRATION_TOKEN;

    if (!expectedToken || token !== expectedToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    var uploadDir = path.join(__dirname, "..", "upload");

    Promise.all([
      models.user.findAll({ raw: true }),
      models.contract.findAll({ raw: true }),
      models.transaction.findAll({ raw: true }),
      models.admin.findAll({ raw: true }),
      models.file.findAll({ raw: true }),
    ])
      .then(function (results) {
        var dump = {
          user: results[0],
          contract: results[1],
          transaction: results[2],
          admin: results[3],
          file: results[4],
        };
        var archive = archiver("zip", { zlib: { level: 9 } });
        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="habidat-migration-' +
            new Date().toISOString().slice(0, 10) +
            '.zip"',
        );
        archive.on("error", function (err) {
          next(err);
        });
        archive.pipe(res);
        archive.append(JSON.stringify(dump, null, 2), {
          name: "database.json",
        });
        if (fs.existsSync(uploadDir)) {
          archive.directory(uploadDir, "upload");
        }
        archive.finalize();
      })
      .catch(function (err) {
        next(err);
      });
  });

  if (settings.config.get("debug")) {
    router.get("/test", function (req, res, next) {
      models.user.findFetchFull(models, { id: 62 }).then((users) => {
        res.json(users[0].getTransactionList(2022));
      });
    });
  }

  app.use("/", router);
};
