const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GalleryImage = sequelize.define('GalleryImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  countryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'countries',
      key: 'id'
    }
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'gallery_images',
  timestamps: true
});

module.exports = GalleryImage;

