/* jshint esversion: 8 */
const moment = require("moment");
const Op = require("sequelize").Op;
const bcrypt = require("bcrypt");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  var Admin = sequelize.define(
    "admin",
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      logon_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ldap: {
        type: DataTypes.BOOLEAN,
        alowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordHashed: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      loginCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      savedViews: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "[]",
      },
    },
    {
      tableName: "admin",
      freezeTableName: true,
    }
  );

  Admin.findByToken = function (token) {
    return Admin.findOne({ where: { passwordResetToken: token } }).then(
      (user) => {
        if (!user || moment().isAfter(moment(user.passwordResetExpires))) {
          throw "Der Link ist abgelaufen, bitte versuche es noch einmal";
        } else {
          return user;
        }
      }
    );
  };

  Admin.emailAddressTaken = function (email) {
    return Admin.count({ where: { email: email } }).then((count) => {
      return count !== 0;
    });
  };

  Admin.prototype.comparePassword = function comparePassword(
    candidatePassword,
    cb
  ) {
    return bcrypt.compareSync(candidatePassword, this.passwordHashed);
  };

  Admin.prototype.setPasswordResetToken = function () {
    this.passwordResetToken = crypto.randomBytes(16).toString("hex");
    this.passwordResetExpires = Date.now() + 3600000 * 3; // 3 hours
  };

  Admin.prototype.isAdmin = function () {
    return true;
  };

  return Admin;
};
