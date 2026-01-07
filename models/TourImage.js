const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TourImage = sequelize.define('TourImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tourId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tours',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isMain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'tour_images',
  timestamps: true
});

module.exports = TourImage;









