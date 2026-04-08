'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING(30),
      allowNull: true, // temporarily nullable so existing rows don't fail
      unique: true,
    });

    // Back-fill existing rows so the NOT NULL constraint can be applied
    await queryInterface.sequelize.query(`
      UPDATE users SET username = LOWER(REGEXP_REPLACE("firstName" || '_' || id::text, '[^a-zA-Z0-9_]', '', 'g'))
      WHERE username IS NULL;
    `);

    await queryInterface.changeColumn('users', 'username', {
      type: Sequelize.STRING(30),
      allowNull: false,
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'username');
  },
};
