/* jshint esversion: 8 */
const project  = require('../config/project.json');
const jsonfile = require('jsonfile');
const Promise  = require('bluebird');
const path = require('path');

const set = function(path, value, overwrite = true, overwriteNull = false) {
	if (value != null || overwriteNull) {
		// iterate through object path, init unexisting objects and find parent
		var parent = this;
		var prev;
		path.split('.').forEach(part => {
			if (prev) {
				// create parent object if not exists
				if (!parent[prev]) {
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

const get = function(path) {
	cursor = this;
	if (path) {
		for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
			cursor = cursor[path[i]];
		}
	}
	return cursor;
};

const initConfig = () => {
	console.info("Loading app configuration...");
	var config = require('../config/config.json');

	config.set = set;
	config.get = get;

	// overwrite config file values with environment variables (mainly for docker usage)
	config.set('database.uri',         process.env.HABIDAT_DK_DB_URI);
	config.set('database.host',        process.env.HABIDAT_DK_DB_HOST);
	config.set('database.dialect',     process.env.HABIDAT_DK_DB_DIALECT);
	config.set('database.user',        process.env.HABIDAT_DK_DB_USER);
	config.set('database.password',    process.env.HABIDAT_DK_DB_PASSWORD);
	config.set('database.database',    process.env.HABIDAT_DK_DB_DATABASE);

	config.set('auth.admin.method',                process.env.HABIDAT_DK_ADMIN_AUTH);
	config.set('auth.admin.ldap.uri',              process.env.HABIDAT_DK_LDAP_URI);
	config.set('auth.admin.ldap.bindDN',           process.env.HABIDAT_DK_LDAP_BINDDN);
	config.set('auth.admin.ldap.bindCredentials',  process.env.HABIDAT_DK_LDAP_PASSWORD);
	config.set('auth.admin.ldap.searchBase',       process.env.HABIDAT_DK_LDAP_BASE);
	config.set('auth.admin.ldap.searchFilter',     process.env.HABIDAT_DK_LDAP_SEARCHFILTER);

	config.set('debug',               process.env.HABIDAT_DK_DEBUG || false);
	config.set('site.https',          process.env.HABIDAT_DK_HTTPS);
	config.set('site.sslcert',        process.env.HABIDAT_DK_SSL_CERT);
	config.set('site.sslkey',         process.env.HABIDAT_DK_SSL_KEY);
	config.set('site.porthttp',       process.env.HABIDAT_DK_PORT_HTTP);
	config.set('site.porthttps',      process.env.HABIDAT_DK_PORT_HTTPS);
	config.set('site.reverseproxy',   process.env.HABIDAT_DK_REVERSE_PROXY);

	return config;
};

const initProject = () => {
	console.info("Loading project settings...");
	var project = require('../config/project.json');

	project.set = set;
	project.get = get;
	project.save = function() {
		var project = this;
		return new Promise((resolve, reject) => {
			jsonfile.writeFile(path.join(__dirname,'../config/project.json'), project, function (err) {
				if (!err) {
					resolve(project);
				} else {
					reject(err);
				}
			});
		});
	};

	// use environment variables as default values (do not overwrite project.json values)
	project.set('projectid',                            process.env.HABIDAT_DK_PROJECT_ID, true);
	project.set('projectname',                          process.env.HABIDAT_DK_PROJECT_NAME, false);
	project.set('logo',                                 process.env.HABIDAT_DK_PROJECT_LOGO, false);
	project.set('email',                                process.env.HABIDAT_DK_PROJECT_EMAIL, false);
	project.set('url',                                  process.env.HABIDAT_DK_PROJECT_URL, false);
	project.set('theme',                                process.env.HABIDAT_DK_PROJECT_THEME || 'red', false);
	project.set('defaults.interest_method',             process.env.HABIDAT_DK_PROJECT_DEFAULTS_INTEREST_METHOD, false);
	project.set('defaults.interest_payment_type',       process.env.HABIDAT_DK_PROJECT_DEFAULTS_INTEREST_PAYMENT_TYPE, false);
	project.set('defaults.termination_type',            process.env.HABIDAT_DK_PROJECT_DEFAULTS_TERMINATION_TYPE, false);
	project.set('defaults.termination_period',          process.env.HABIDAT_DK_PROJECT_DEFAULTS_TERMINATION_PERIOD, false);
	project.set('defaults.termination_period_type',     process.env.HABIDAT_DK_PROJECT_DEFAULTS_TERMINATION_PERIOD_TYPE, false);
	project.set('defaults.country',                     process.env.HABIDAT_DK_PROJECT_DEFAULTS_COUNTRY, false);

	return project;
};

exports.config = initConfig();
exports.project = initProject();
