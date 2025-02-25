/* jshint esversion: 8 */
const models = require("../models");
const validator = require("validator");

exports.getEmails = function (mode) {
  var usersString = "";
  return models.user.findFetchFull(models, {}).then((users) => {
    users.forEach(function (user) {
      if (
        user.email &&
        validator.isEmail(user.email) &&
        (
          mode == "all" ||
          (mode === "active" && user.isActive()) ||
          (mode === "cancelled" && user.isTerminated())
        )
      ) {
        usersString += user.email + ",";
      }
    });
    return usersString;
  });
};
