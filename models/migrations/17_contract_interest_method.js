const Sequelize = require("sequelize");

module.exports = {
  up: (query) => {
    return query.addColumn("contract", "interest_method", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (query) => {
    return query.dropColumn("contract", "interest_method");
  },
};
