var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "database";
var config    = require(__dirname + '/../../config/config.json')[env];
var sequelize = new Sequelize(config.database, config.username, config.password, config);

module.exports = {
  up: function() {

  }
};