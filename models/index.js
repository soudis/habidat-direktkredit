/* jshint esversion: 8 */

const fs        	= require("fs");
const path      	= require("path");
const Sequelize 	= require("sequelize");
const env       	= process.env.NODE_ENV || "database";
const settings  	= require('../utils/settings');
const Umzug 		= require('umzug');

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

	(async () => {
		try {
			await umzug.up();
			console.info('All migrations performed successfully');
		} catch (error) {
			console.error('Error migrating database: ', error);
		}
	})();

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
	});

	// return models as object
	db.sequelize = sequelize;
	return db;
};

module.exports = createdb();

