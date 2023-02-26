const Sequelize = require("sequelize");

module.exports = {
  up: (query) => {
    return query.addColumn("file", "salutation", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (query) => {
    return query.dropColumn("file", "salutation");
  },
};
