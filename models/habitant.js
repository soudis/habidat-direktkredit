
module.exports = (sequelize, DataTypes) => {
  habitant = sequelize.define('habitant', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    income: {
        type: DataTypes.DECIMAL,
        allowNull: true
      },
    birth_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fixed_to_flat: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: { 
          model: 'flat',
          key: 'id'
        }
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
    tableName: 'habitant',
    freezeTableName: true
  });

  habitant.associate = function (db) {

    db.habitant.belongsTo(db.flat, {
            foreignKey: 'fixed_to_flat',
//            as: 'fixed_habitants'
          });
    
    db.habitant.belongsTo(db.mixer_config, {
          onDelete: "CASCADE",
          foreignKey: 'configuration',
  //        as: 'habitants'
        });
  }

  return habitant;
};
