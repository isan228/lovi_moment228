#!/bin/bash
# Быстрое восстановление админ-панели на сервере
# Выполните на сервере: bash RESTORE_ADMIN_NOW.sh

cd /var/www/lovi_moment228

echo "🔧 Восстановление админ-панели..."

# 1. Обновляем код
echo "📥 Обновление кода из git..."
git pull origin main

# 2. Создаем папку если не существует
mkdir -p public/admin

# 3. Восстанавливаем файлы из git
echo "📁 Восстановление файлов из git..."
git checkout HEAD -- public/admin/ 2>/dev/null

# 4. Проверяем наличие файлов
if [ -f "public/admin/login.html" ] && [ -f "public/admin/index.html" ] && [ -f "public/admin/admin.js" ]; then
    echo "✅ Все файлы админ-панели восстановлены!"
    ls -la public/admin/
else
    echo "⚠️  Файлы не найдены в git. Нужно скопировать вручную."
    echo "📋 Создайте файлы:"
    echo "   - public/admin/login.html"
    echo "   - public/admin/index.html"
    echo "   - public/admin/admin.js"
fi

# 5. Устанавливаем права
chmod -R 755 public/admin/

# 6. Перезапускаем сервер
echo "🔄 Перезапуск сервера..."
pm2 restart lovi-moment

echo ""
echo "✅ Готово! Проверьте:"
echo "   https://lovimoment-travel.com/admin/login"

