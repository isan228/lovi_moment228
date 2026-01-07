const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tour = sequelize.define('Tour', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Кыргызстан'
  },
  countryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'countries',
      key: 'id'
    }
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  daysCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  program: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  tourTypeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tour_types',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'tours',
  timestamps: true
});

module.exports = Tour;

