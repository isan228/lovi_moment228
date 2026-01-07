const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  instagramLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'reviews',
  timestamps: true
});

module.exports = Review;

