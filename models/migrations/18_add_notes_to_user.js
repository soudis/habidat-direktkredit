/* jshint esversion: 8 */
const Sequelize = require("sequelize");

module.exports = {
  up: (query) => {
    return query
      .addColumn("user", "notes", {
        type: Sequelize.STRING,
        allowNull: true,
      })
      .then(() =>
        query.addColumn("user", "notes_public", {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        })
      );
  },
  down: async (query) => {
    return query
      .dropColumn("user", "notes")
      .then(() => query.dropColumn("user", "notes_public"));
  },
};
