const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');
const User = require('./userModel');
const Pi = require('./piModel');

const Flow = sequelize.define('Flow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  piId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Pi,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  nodes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  edges: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastExecuted: {
    type: DataTypes.DATE
  },
  executionStatus: {
    type: DataTypes.ENUM('idle', 'running', 'success', 'error'),
    defaultValue: 'idle'
  },
  executionResults: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

// Define relationships
Flow.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Flow, { foreignKey: 'userId' });

Flow.belongsTo(Pi, { foreignKey: 'piId' });
Pi.hasMany(Flow, { foreignKey: 'piId' });

module.exports = Flow;