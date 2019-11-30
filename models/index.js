"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "database";
var config    = require(__dirname + '/../config/config.json');
var projects  = require(__dirname + '/../config/projects.json');
var migration = require('./migration');
var currentProject, sequelize;

var createdb = function(project) {
  if (!currentProject || project !== currentProject) {
    sequelize = new Sequelize('mysql://'+projects[project].db.username+':'+encodeURIComponent(projects[project].db.password)+'@'+config.database.host+'/'+projects[project].db.database, 
      {
        logging:false, 
        pool: {
          idle: 30000,
          min: 1, 
          max: 1
        },
        dialectOptions: {
          decimalNumbers: true
        }
      });
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
      db[model.name].sync()
        .then(() => {
          if (model.name === 'user' && process.env["HABIDAT_DK_ADMIN_PASSWORD"]) {
            model.count()
              .then((count) => {
                if (count == 0) {
                  var password = process.env["HABIDAT_DK_ADMIN_PASSWORD"];
                  var username = process.env["HABIDAT_DK_ADMIN_USERNAME"] || 'admin';

                  console.log("Create admin account...");
                  return model.create({
                    logon_id: username,
                    password: password,
                    administrator:true,
                    ldap: false                
                  })
                }
              })
              .catch((error) => {
                console.log("Error creating admin account: " + error);
              })
          }
        })
        .catch((error) => {
          console.log("Error syncing model " + model.name + ": " + error);
        })

    });

  Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
      db[modelName].associate(db);
    }
  });


  db.sequelize = sequelize;

  return db;
}

module.exports = createdb;

