const fs = require('fs');
const path = require('path');

// Скрипт для восстановления админ-панели
// Использование: node scripts/restore-admin.js

const BASE_DIR = __dirname + '/..';
const ADMIN_SOURCE = path.join(BASE_DIR, 'public', 'admin');
const ADMIN_DEST = path.join(BASE_DIR, 'public', 'admin');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`❌ Исходная папка не найдена: ${src}`);
    return false;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Скопирован: ${entry.name}`);
    }
  }
  return true;
}

function main() {
  console.log('🔄 Восстановление админ-панели...\n');

  // Проверяем, существует ли исходная папка
  if (!fs.existsSync(ADMIN_SOURCE)) {
    console.error(`❌ Папка админ-панели не найдена: ${ADMIN_SOURCE}`);
    console.log('💡 Убедитесь, что файлы админ-панели находятся в public/admin/');
    process.exit(1);
  }

  // Копируем файлы
  const success = copyRecursive(ADMIN_SOURCE, ADMIN_DEST);

  if (success) {
    console.log('\n✅ Админ-панель успешно восстановлена!');
    console.log(`📁 Файлы находятся в: ${ADMIN_DEST}`);
  } else {
    console.error('\n❌ Ошибка при восстановлении админ-панели');
    process.exit(1);
  }
}

main();

