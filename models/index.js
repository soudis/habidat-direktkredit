"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "database";
var config    = require(__dirname + '/../config/config.json')[env];
var projects  = require(__dirname + '/../config/projects.json');
var migration = require('./migration');
var currentProject, sequelize;

var createdb = function(project) {

  if (!currentProject || project !== currentProject) {
    sequelize = new Sequelize('mysql://'+projects[project].db.username+':'+projects[project].db.password+'@'+config.host+'/'+projects[project].db.database, {logging:false, pool:false});
    sequelize.query('SET FOREIGN_KEY_CHECKS = 0', {raw: true}).catch(console.log);
    migration.up(sequelize);
    currentProject = project;
  }
  global.project = projects[project];
  var db        = {};

  fs
    .readdirSync(__dirname)
    .filter(function(file) {
      return (file.indexOf(".") !== -1) && (file !== "index.js");
    })
    .forEach(function(file) {
      var model = sequelize.import(path.join(__dirname, file));
      db[model.name] = model;
      // create table if not exist
      db[model.name].sync();
    });

  Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
      db[modelName].associate(db);
    }
  });


  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
}

module.exports = createdb;

