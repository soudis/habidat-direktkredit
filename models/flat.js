var moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  flat = sequelize.define('flat', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    size: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    min_habitant: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    max_habitant: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    configuration: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
          model: 'mixer_config',
          key: 'id'
        }
    }
  }, {
    tableName: 'flat',
    freezeTableName: true,
  });

  flat.associate = function (db) {
    db.flat.hasMany(db.habitant, {
//      as: 'fixed_habitants', 
      foreignKey: 'fixed_to_flat'
    });
    db.flat.belongsTo(db.mixer_config, {
      onDelete: "CASCADE",
      foreignKey: 'configuration',
//      as: 'flats'
    });
  }

  return flat;
};
