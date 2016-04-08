var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "database";
var config    = require(__dirname + '/../../config/config.json')[env];
var sequelize = new Sequelize(config.database, config.username, config.password, config);

module.exports = {
  up: function() {

    sequelize.query('ALTER TABLE user ADD relationship varchar(255)');
    sequelize.query('CREATE TABLE `file` ( `id` INT(11) NOT NULL AUTO_INCREMENT , `filename` VARCHAR(255) NOT NULL , `description` TEXT NOT NULL , `mime` VARCAR(255) NOT NULL , `path` VARCHAR(255) NOT NULL , `ref_id` INT(11) NOT NULL , `ref_table` VARCHAR(255) NOT NULL , PRIMARY KEY (`id`))');
    sequelize.query('ALTER TABLE `file` ADD `createdAt` DATETIME NOT NULL AFTER `ref_table`, ADD `updatedAt` DATETIME NOT NULL AFTER `createdAt`');
    
  }
};