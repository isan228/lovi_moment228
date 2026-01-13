const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TourApplication = sequelize.define('TourApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tourId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tours',
      key: 'id'
    }
  },
  tourTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Название тура на момент подачи заявки'
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'confirmed', 'cancelled'),
    defaultValue: 'new',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  consent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'tour_applications',
  timestamps: true
});

module.exports = TourApplication;

