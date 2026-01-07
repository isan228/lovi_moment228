const { syncDatabase } = require('../models');

const command = process.argv[2];

async function main() {
  try {
    // Проверяем подключение к БД
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено\n');

    if (command === 'force') {
      // Принудительная синхронизация (удаляет все таблицы и создает заново)
      console.log('⚠️  ВНИМАНИЕ: Это удалит все данные!');
      await syncDatabase({ force: true });
    } else if (command === 'alter') {
      // Синхронизация с изменением структуры (безопаснее)
      await syncDatabase({ alter: true });
    } else {
      // Обычная синхронизация (создает только отсутствующие таблицы)
      await syncDatabase();
    }

    console.log('\n✅ Синхронизация завершена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка при синхронизации:', error.message);
    process.exit(1);
  }
}

main();









