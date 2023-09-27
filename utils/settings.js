/* jshint esversion: 8 */
const jsonfile = require("jsonfile");
const Promise = require("bluebird");
const path = require("path");

const set = function (path, value, overwrite = true, overwriteNull = false) {
  if (value != null || overwriteNull) {
    // iterate through object path, init unexisting objects and find parent
    var parent = this;
    var prev;
    path.split(".").forEach((part) => {
      if (prev) {
        // create parent object if not exists or overwrite if the type is not an object
        if (!parent[prev] || typeof parent[prev] !== "object") {
          parent[prev] = {};
        }
        parent = parent[prev];
      }
      prev = part;
    });
    // set value
    if (parent[prev] == null || overwrite) {
      if (value === "true") {
        parent[prev] = true;
      } else if (value === "false") {
        parent[prev] = false;
      } else {
        parent[prev] = value;
      }
    }
  }
};

const get = function (path) {
  cursor = this;
  if (path) {
    for (var i = 0, path = path.split("."), len = path.length; i < len; i++) {
      if (!cursor[path[i]]) {
        return undefined;
      }
      cursor = cursor[path[i]];
    }
  }
  return cursor;
};

const initConfig = () => {
  console.info("Loading app configuration...");
  var config = require("../config/config.json");

  config.set = set;
  config.get = get;

  // overwrite config file values with environment variables (mainly for docker usage)
  config.set("database.uri", process.env.HABIDAT_DK_DB_URI);
  config.set("database.host", process.env.HABIDAT_DK_DB_HOST);
  config.set("database.dialect", process.env.HABIDAT_DK_DB_DIALECT);
  config.set("database.user", process.env.HABIDAT_DK_DB_USER);
  config.set("database.password", process.env.HABIDAT_DK_DB_PASSWORD);
  config.set("database.database", process.env.HABIDAT_DK_DB_DATABASE);

  config.set(
    "auth.admin.method",
    process.env.HABIDAT_DK_AUTH_ADMIN_METHOD?.split(",")
  );
  // Admin authentication (LDAP)
  config.set(
    "auth.admin.ldap.server.url",
    process.env.HABIDAT_DK_AUTH_ADMIN_LDAP_URI
  );
  config.set(
    "auth.admin.ldap.server.host",
    process.env.HABIDAT_DK_AUTH_ADMIN_LDAP_HOST
  );
  config.set(
    "auth.admin.ldap.server.port",
    process.env.HABIDAT_DK_AUTH_ADMIN_LDAP_PORT
  );
  config.set(
    "auth.admin.ldap.server.bindDN",
    process.env.HABIDAT_DK_AUTH_ADMIN_LDAP_BINDDN
  );
  config.set(
    "auth.admin.ldap.server.bindCredentials",
    process.env.HABIDAT_DK_AUTH_ADMIN_LDAP_PASSWORD
  );
  config.set(
    "auth.admin.ldap.server.searchBase",
    process.env.HABIDAT_DK_AUTH_ADMIN_LDAP_BASE
  );
  config.set(
    "auth.admin.ldap.server.searchFilter",
    process.env.HABIDAT_DK_AUTH_ADMIN_LDAP_SEARCHFILTER
  );
  // Admin authentication (OIDC)
  config.set(
    "auth.admin.oidc.label",
    process.env.HABIDAT_DK_AUTH_ADMIN_OIDC_LABEL
  );
  config.set(
    "auth.admin.oidc.issuer",
    process.env.HABIDAT_DK_AUTH_ADMIN_OIDC_ISSUER
  );
  config.set(
    "auth.admin.oidc.clientID",
    process.env.HABIDAT_DK_AUTH_ADMIN_OIDC_CLIENT_ID
  );
  config.set(
    "auth.admin.oidc.clientSecret",
    process.env.HABIDAT_DK_AUTH_ADMIN_OIDC_CLIENT_SECRET
  );
  config.set(
    "auth.admin.oidc.authorizationURL",
    process.env.HABIDAT_DK_AUTH_ADMIN_OIDC_AUTH_URL
  );
  config.set(
    "auth.admin.oidc.callbackURL",
    process.env.HABIDAT_DK_AUTH_ADMIN_OIDC_CALLBACK_URL
  );
  config.set(
    "auth.admin.oidc.tokenURL",
    process.env.HABIDAT_DK_AUTH_ADMIN_OIDC_TOKEN_URL
  );
  config.set(
    "auth.admin.oidc.userInfoURL",
    process.env.HABIDAT_DK_AUTH_ADMIN_OIDC_USERINFO_URL
  );

  // User authentication
  config.set(
    "auth.user.method",
    process.env.HABIDAT_DK_AUTH_USER_METHOD?.split(",")
  );
  // User authentication (OIDC)
  config.set(
    "auth.user.oidc.label",
    process.env.HABIDAT_DK_AUTH_USER_OIDC_LABEL
  );
  config.set(
    "auth.user.oidc.issuer",
    process.env.HABIDAT_DK_AUTH_USER_OIDC_ISSUER
  );
  config.set(
    "auth.user.oidc.clientID",
    process.env.HABIDAT_DK_AUTH_USER_OIDC_CLIENT_ID
  );
  config.set(
    "auth.user.oidc.clientSecret",
    process.env.HABIDAT_DK_AUTH_USER_OIDC_CLIENT_SECRET
  );
  config.set(
    "auth.user.oidc.authorizationURL",
    process.env.HABIDAT_DK_AUTH_USER_OIDC_AUTH_URL
  );
  config.set(
    "auth.user.oidc.callbackURL",
    process.env.HABIDAT_DK_AUTH_USER_OIDC_CALLBACK_URL
  );
  config.set(
    "auth.user.oidc.tokenURL",
    process.env.HABIDAT_DK_AUTH_USER_OIDC_TOKEN_URL
  );
  config.set(
    "auth.user.oidc.userInfoURL",
    process.env.HABIDAT_DK_AUTH_USER_OIDC_USERINFO_URL
  );

  config.set("debug", process.env.HABIDAT_DK_DEBUG || false);
  config.set("site.https", process.env.HABIDAT_DK_HTTPS);
  config.set("site.sslcert", process.env.HABIDAT_DK_SSL_CERT);
  config.set("site.sslkey", process.env.HABIDAT_DK_SSL_KEY);
  config.set("site.porthttp", process.env.HABIDAT_DK_PORT_HTTP);
  config.set("site.porthttps", process.env.HABIDAT_DK_PORT_HTTPS);
  config.set("site.reverseproxy", process.env.HABIDAT_DK_REVERSE_PROXY);

  return config;
};

const initProject = () => {
  console.info("Loading project settings...");
  var project = require("../config/project.json");

  project.set = set;
  project.get = get;
  project.save = function () {
    var project = this;
    return new Promise((resolve, reject) => {
      jsonfile.writeFile(
        path.join(__dirname, "../config/project.json"),
        project,
        function (err) {
          if (!err) {
            resolve(project);
          } else {
            reject(err);
          }
        }
      );
    });
  };

  project.setDefaults = function () {
    // use environment variables as default values (do not overwrite project.json values)
    this.set("projectid", process.env.HABIDAT_DK_PROJECT_ID, true);
    this.set("projectname", process.env.HABIDAT_DK_PROJECT_NAME, false);
    this.set("project_iban", process.env.HABIDAT_DK_PROJECT_IBAN, false);
    this.set("project_bic", process.env.HABIDAT_DK_PROJECT_BIC, false);
    this.set("logo", process.env.HABIDAT_DK_PROJECT_LOGO, false);
    this.set("logo_select", process.env.HABIDAT_DK_PROJECT_LOGO_SELECT, false);
    this.set("email", process.env.HABIDAT_DK_PROJECT_EMAIL, false);
    this.set(
      "email_sendcopy",
      process.env.HABIDAT_DK_PROJECT_EMAIL_SENDCOPY,
      false
    );
    this.set("url", process.env.HABIDAT_DK_PROJECT_URL, false);
    this.set("theme", process.env.HABIDAT_DK_PROJECT_THEME || "red", false);
    this.set("smtp.host", process.env.HABIDAT_DK_SMTP_HOST, false);
    this.set("smtp.port", process.env.HABIDAT_DK_SMTP_PORT || "25", false);
    this.set("smtp.auth.user", process.env.HABIDAT_DK_SMTP_USER, false);
    this.set("smtp.auth.pass", process.env.HABIDAT_DK_SMTP_PASSWORD, false);
    this.set(
      "defaults.interest_method",
      process.env.HABIDAT_DK_PROJECT_DEFAULTS_INTEREST_METHOD,
      false
    );
    this.set(
      "defaults.interest_payment_type",
      process.env.HABIDAT_DK_PROJECT_DEFAULTS_INTEREST_PAYMENT_TYPE,
      false
    );
    this.set(
      "defaults.termination_type",
      process.env.HABIDAT_DK_PROJECT_DEFAULTS_TERMINATION_TYPE,
      false
    );
    this.set(
      "defaults.termination_period",
      process.env.HABIDAT_DK_PROJECT_DEFAULTS_TERMINATION_PERIOD,
      false
    );
    this.set(
      "defaults.termination_period_type",
      process.env.HABIDAT_DK_PROJECT_DEFAULTS_TERMINATION_PERIOD_TYPE,
      false
    );
    this.set(
      "defaults.country",
      process.env.HABIDAT_DK_PROJECT_DEFAULTS_COUNTRY,
      false
    );
    this.set(
      "defaults.interest_rate_type",
      process.env.HABIDAT_DK_INTEREST_RATE_TYPE,
      false
    );
  };

  project.setDefaults();

  return project;
};

exports.config = initConfig();
exports.project = initProject();
