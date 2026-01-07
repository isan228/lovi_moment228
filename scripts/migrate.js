const { up, down } = require('../migrations/001_create_tables');

const command = process.argv[2];

if (command === 'down') {
  down().then(() => {
    console.log('✅ Миграция откачена');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Ошибка при откате миграции:', error);
    process.exit(1);
  });
} else {
  up().then(() => {
    console.log('✅ Миграция выполнена');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Ошибка при выполнении миграции:', error);
    process.exit(1);
  });
}









