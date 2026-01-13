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
  // Новые поля для tour-about страницы
  slug: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  headerImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priceWednesday: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  priceFriday: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  datesByMonth: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  importantInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  faq: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
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

