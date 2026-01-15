const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Country = sequelize.define('Country', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  banner: {
    type: DataTypes.STRING,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL страницы страны (например, /tour/, /kz/, /uz/)'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Порядок отображения на главной странице'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'countries',
  timestamps: true
});

module.exports = Country;

