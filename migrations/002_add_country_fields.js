const { sequelize } = require('../models');

async function up() {
  try {
    // Проверяем существование таблицы countries
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'countries'
      );
    `);
    
    if (!results[0].exists) {
      console.log('Таблица countries не существует, создаем её...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS countries (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          banner VARCHAR(255),
          link VARCHAR(255),
          "order" INTEGER DEFAULT 0,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Таблица countries создана');
    } else {
      console.log('Таблица countries существует, добавляем поля...');
      
      // Добавляем поле link, если его нет
      const [linkExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'countries' 
          AND column_name = 'link'
        );
      `);
      
      if (!linkExists[0].exists) {
        await sequelize.query(`
          ALTER TABLE countries 
          ADD COLUMN link VARCHAR(255);
        `);
        console.log('✅ Поле link добавлено');
      } else {
        console.log('Поле link уже существует');
      }
      
      // Добавляем поле order, если его нет
      const [orderExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'countries' 
          AND column_name = 'order'
        );
      `);
      
      if (!orderExists[0].exists) {
        await sequelize.query(`
          ALTER TABLE countries 
          ADD COLUMN "order" INTEGER DEFAULT 0;
        `);
        console.log('✅ Поле order добавлено');
      } else {
        console.log('Поле order уже существует');
      }
    }
    
    console.log('✅ Миграция выполнена успешно');
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error);
    throw error;
  }
}

async function down() {
  try {
    // Удаляем поля при откате миграции
    await sequelize.query(`
      ALTER TABLE countries 
      DROP COLUMN IF EXISTS link,
      DROP COLUMN IF EXISTS "order";
    `);
    console.log('✅ Поля удалены');
  } catch (error) {
    console.error('❌ Ошибка при откате миграции:', error);
    throw error;
  }
}

if (require.main === module) {
  up()
    .then(() => {
      console.log('Миграция завершена');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Ошибка миграции:', error);
      process.exit(1);
    });
}

module.exports = { up, down };

