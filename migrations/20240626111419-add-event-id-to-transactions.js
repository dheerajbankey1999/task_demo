'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return  queryInterface.addColumn(
      "transactions", 
      "event_id", 
      Sequelize.INTEGER,
    );
  },
  down: async (queryInterface, Sequelize) => {
  return queryInterface.removeColumn("transactions", "event_id");
  }
};
