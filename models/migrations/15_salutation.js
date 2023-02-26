const Sequelize = require("sequelize");

module.exports = {
  up: (query) => {
    return query.addColumn("user", "salutation", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (query) => {
    return query.dropColumn("user", "salutation");
  },
};
