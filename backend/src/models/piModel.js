const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');
const User = require('./userModel');

const Pi = sequelize.define('Pi', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  host: {
    type: DataTypes.STRING,
    allowNull: false
  },
  port: {
    type: DataTypes.INTEGER,
    defaultValue: 22
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authType: {
    type: DataTypes.ENUM('password', 'privateKey'),
    defaultValue: 'password'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  privateKey: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'unknown'),
    defaultValue: 'unknown'
  },
  lastConnection: {
    type: DataTypes.DATE
  }
}, {
  hooks: {
    beforeValidate: (pi) => {
      // Ensure either password or privateKey is provided based on authType
      if (pi.authType === 'password' && !pi.password) {
        throw new Error('Password is required for password authentication');
      }
      if (pi.authType === 'privateKey' && !pi.privateKey) {
        throw new Error('Private key is required for key authentication');
      }
    }
  }
});

// Define relationships
Pi.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Pi, { foreignKey: 'userId' });

module.exports = Pi;