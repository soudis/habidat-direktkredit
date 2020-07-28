/* jshint esversion: 8 */

const fs        	= require("fs");
const path      	= require("path");
const Sequelize 	= require("sequelize");
const env       	= process.env.NODE_ENV || "database";
const settings  	= require('../utils/settings');
const Umzug 		= require('umzug');
const tracker       = require('../utils/tracker');
const crypto 		= require('crypto');

var createdb = function() {

	// defining database connection
	var dbURI = settings.config.get('database.uri');
	if (!dbURI) {
		dbURI = settings.config.get('database.dialect')+ '://' + settings.config.get('database.username') + ':' + encodeURIComponent(settings.config.get('database.password')) + '@' + settings.config.get('database.host') + '/' + settings.config.get('database.database');
	}
	var sequelize = new Sequelize(dbURI, {
		logging: false,
		pool: {
			idle: 30000,
			min: 1,
			max: 1
		},
		dialectOptions: {
			decimalNumbers: true
		}
	});
	if (dbURI.startsWith('mysql://')) {
		sequelize.query('SET FOREIGN_KEY_CHECKS = 0', {raw: true}).catch(console.log);
	}

	// define sequelize models
	var db = {};
	fs.readdirSync(__dirname)
		.filter(function(file) {
			return (file.indexOf(".") !== -1) && (file !== "index.js");
		})
		.forEach(function(file) {
			var model = sequelize.import(path.join(__dirname, file));
			db[model.name] = model;
      // create table if not exist
/*      db[model.name].sync()
        .catch((error) => {
          console.log("Error syncing model " + model.name + ": " + error);
      }) */
  		});

	// define model associations
	Object.keys(db).forEach(function(modelName) {
		if ("associate" in db[modelName]) {
			db[modelName].associate(db);
		}
		if (modelName != 'admin') {
			db[modelName + 'Log'] = tracker(db[modelName], sequelize, {userModel: db.admin, persistant: true,  changes: ['update', 'create', 'delete']});
		}
	});


	// create database structure or applying pending database modifications
	const umzug = new Umzug({
		migrations: {
			path: path.join(__dirname, './migrations'),
			params: [
				sequelize.getQueryInterface()
			]
		},
		storage: 'sequelize',
		storageOptions: {
			sequelize: sequelize
		},
		logging: console.log
	});

	umzug.up()
		.then(() => {
			console.info('All migrations performed successfully');
			// insert admin user if environment variables are set
			if (process.env.HABIDAT_DK_ADMIN_EMAIL && process.env.HABIDAT_DK_ADMIN_USERNAME) {
				return db.admin.count()
					.then(count => {
						if (count === 0) {
							return db.admin.create({
									email: process.env.HABIDAT_DK_ADMIN_EMAIL,
									logon_id: process.env.HABIDAT_DK_ADMIN_USERNAME,
									password: crypto.randomBytes(16).toString('hex'),
									ldap: false
								}, { trackOptions: { track: false, user_id: -1 } })
								.then(() => console.info('Admin user', process.env.HABIDAT_DK_ADMIN_USERNAME, 'with e-mail address', process.env.HABIDAT_DK_ADMIN_EMAIL, 'created'));
						}
						return;
					});
			}
			return;
		})
		.catch(error => {
			console.error('Error migrating database: ', error);
		})

	// return models as object
	db.sequelize = sequelize;
	return db;
};

module.exports = createdb();


