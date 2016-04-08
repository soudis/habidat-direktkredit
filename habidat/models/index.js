"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "database";
var config    = require(__dirname + '/../config/config.json')[env];
var sequelize = new Sequelize(config.database, config.username, config.password, {logging:false});
var db        = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
	console.log(file);
    return (file.indexOf(".") !== -1) && (file !== "index.js");
  })
  .forEach(function(file) {
		console.log(file);
    var model = sequelize.import(path.join(__dirname, file));
	console.log(file);
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

