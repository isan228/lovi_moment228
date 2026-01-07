const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TourType = sequelize.define('TourType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dates: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'tour_types',
  timestamps: true
});

module.exports = TourType;

