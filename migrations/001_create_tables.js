const { sequelize } = require('../models');

async function up() {
  // Создаем таблицу пользователей
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      "isAdmin" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Создаем таблицу типов туров
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS tour_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Создаем таблицу туров
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS tours (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      location VARCHAR(255),
      country VARCHAR(255) DEFAULT 'Кыргызстан',
      duration VARCHAR(255),
      "daysCount" INTEGER DEFAULT 1,
      program JSONB DEFAULT '[]',
      price DECIMAL(10, 2),
      slug VARCHAR(255) UNIQUE,
      "headerImage" VARCHAR(255),
      subtitle VARCHAR(255),
      "pricesByDay" JSONB DEFAULT '[]',
      "datesByMonth" JSONB DEFAULT '[]',
      "importantInfo" JSONB DEFAULT '{}',
      faq JSONB DEFAULT '[]',
      "tourTypeId" INTEGER REFERENCES tour_types(id) ON DELETE SET NULL,
      "countryId" INTEGER REFERENCES countries(id) ON DELETE SET NULL,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Создаем таблицу изображений туров
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS tour_images (
      id SERIAL PRIMARY KEY,
      "tourId" INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
      "imagePath" VARCHAR(255) NOT NULL,
      "isMain" BOOLEAN DEFAULT false,
      "order" INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Создаем таблицу изображений галереи
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id SERIAL PRIMARY KEY,
      "imagePath" VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      description TEXT,
      country VARCHAR(255),
      "order" INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Создаем таблицу заявок на туры
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS tour_applications (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      "tourId" INTEGER REFERENCES tours(id) ON DELETE SET NULL,
      "tourTitle" VARCHAR(255),
      status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'cancelled')),
      notes TEXT,
      consent BOOLEAN DEFAULT false NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Таблицы созданы успешно');
}

async function down() {
  await sequelize.query('DROP TABLE IF EXISTS gallery_images CASCADE;');
  await sequelize.query('DROP TABLE IF EXISTS tour_images CASCADE;');
  await sequelize.query('DROP TABLE IF EXISTS tours CASCADE;');
  await sequelize.query('DROP TABLE IF EXISTS tour_types CASCADE;');
  await sequelize.query('DROP TABLE IF EXISTS users CASCADE;');
  console.log('✅ Таблицы удалены');
}

module.exports = { up, down };









