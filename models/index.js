const sequelize = require('../config/database');
const User = require('./User');
const TourType = require('./TourType');
const Tour = require('./Tour');
const TourImage = require('./TourImage');
const GalleryImage = require('./GalleryImage');
const Country = require('./Country');
const Settings = require('./Settings');
const Review = require('./Review');
const Blog = require('./Blog');
const TourApplication = require('./TourApplication');

// Определяем связи между моделями
Tour.belongsTo(TourType, { foreignKey: 'tourTypeId', as: 'tourType' });
TourType.hasMany(Tour, { foreignKey: 'tourTypeId', as: 'tours' });

Tour.belongsTo(Country, { foreignKey: 'countryId', as: 'countryData' });
Country.hasMany(Tour, { foreignKey: 'countryId', as: 'tours' });

GalleryImage.belongsTo(Country, { foreignKey: 'countryId', as: 'countryData' });
Country.hasMany(GalleryImage, { foreignKey: 'countryId', as: 'galleryImages' });

Tour.hasMany(TourImage, { foreignKey: 'tourId', as: 'images', onDelete: 'CASCADE' });
TourImage.belongsTo(Tour, { foreignKey: 'tourId', as: 'tour' });

// Функция для синхронизации базы данных
async function syncDatabase(options = {}) {
  const { force = false, alter = false } = options;
  
  try {
    if (force) {
      console.log('⚠️  Принудительная синхронизация (удаление всех таблиц)...');
      await sequelize.sync({ force: true });
      console.log('✅ База данных синхронизирована (force)');
    } else if (alter) {
      console.log('🔄 Синхронизация с изменением структуры...');
      await sequelize.sync({ alter: true });
      console.log('✅ База данных синхронизирована (alter)');
    } else {
      console.log('🔄 Синхронизация базы данных...');
      await sequelize.sync();
      console.log('✅ База данных синхронизирована');
    }
    return true;
  } catch (error) {
    console.error('❌ Ошибка при синхронизации базы данных:', error);
    throw error;
  }
}

// Связь заявок с турами
TourApplication.belongsTo(Tour, { foreignKey: 'tourId', as: 'tour' });
Tour.hasMany(TourApplication, { foreignKey: 'tourId', as: 'applications' });

module.exports = {
  sequelize,
  User,
  TourType,
  Tour,
  TourImage,
  GalleryImage,
  Country,
  Settings,
  Review,
  Blog,
  TourApplication,
  syncDatabase
};

