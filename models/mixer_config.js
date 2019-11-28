var moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  mixerConfig = sequelize.define('mixer_config', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    calculation_mode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'mixer_config',
    freezeTableName: true
  });

  mixerConfig.associate = function (db) {
    db.mixer_config.hasMany(db.habitant, {
//      as: 'habitants', 
      foreignKey: 'configuration'});
    db.mixer_config.hasMany(db.flat, {
//      as: 'flats', 
      foreignKey: 'configuration'});

  }  

  return mixerConfig;
};
