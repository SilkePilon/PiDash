const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('./logger');

const dbPath = path.resolve(process.env.DB_PATH || './pidash.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: msg => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: true
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    logger.info(`SQLite Connected: ${dbPath}`);
  } catch (error) {
    logger.error(`Error connecting to SQLite: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };