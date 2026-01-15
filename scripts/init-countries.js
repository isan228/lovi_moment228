const { Country } = require('../models');
const sequelize = require('../config/database');

async function initCountries() {
  try {
    console.log('Инициализация стран...');
    
    // Проверяем, есть ли уже страны
    const existingCountries = await Country.findAll();
    if (existingCountries.length > 0) {
      console.log(`Уже есть ${existingCountries.length} стран в базе данных`);
      return;
    }
    
    // Создаем дефолтные страны
    const defaultCountries = [
      {
        name: 'Кыргызстан',
        banner: '/static/images/kg.png',
        link: '/tour/',
        order: 0,
        isActive: true
      },
      {
        name: 'Узбекистан',
        banner: '/static/images/uz.png',
        link: '/uz/',
        order: 1,
        isActive: true
      },
      {
        name: 'Казахстан',
        banner: '/static/images/kz.png',
        link: '/kz/',
        order: 2,
        isActive: true
      }
    ];
    
    for (const countryData of defaultCountries) {
      const [country, created] = await Country.findOrCreate({
        where: { name: countryData.name },
        defaults: countryData
      });
      
      if (created) {
        console.log(`✅ Создана страна: ${country.name}`);
      } else {
        // Обновляем существующую страну
        await country.update(countryData);
        console.log(`🔄 Обновлена страна: ${country.name}`);
      }
    }
    
    console.log('✅ Инициализация стран завершена');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при инициализации стран:', error);
    process.exit(1);
  }
}

// Запускаем инициализацию
initCountries();

