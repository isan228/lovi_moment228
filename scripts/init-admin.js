const { User, syncDatabase } = require('../models');
const sequelize = require('../config/database');

async function initAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');
    
    // Синхронизируем базу данных перед созданием админа
    console.log('🔄 Синхронизация базы данных...');
    await syncDatabase();

    // Проверяем, есть ли уже админ
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      console.log('⚠️  Администратор уже существует');
      return;
    }

    // Создаем первого админа
    const admin = await User.create({
      username: 'admin',
      password: 'admin123', // Пароль будет захеширован автоматически
      isAdmin: true
    });

    console.log('✅ Администратор создан успешно!');
    console.log('👤 Логин: admin');
    console.log('🔑 Пароль: admin123');
    console.log('⚠️  ВАЖНО: Измените пароль после первого входа!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error);
    process.exit(1);
  }
}

initAdmin();

