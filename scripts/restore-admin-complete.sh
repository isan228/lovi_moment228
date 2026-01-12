#!/bin/bash
# Полное восстановление админ-панели на сервере
# Выполните на сервере: bash scripts/restore-admin-complete.sh

cd /var/www/lovi_moment228 || exit 1

echo "🔧 Полное восстановление админ-панели..."
echo ""

# 1. Обновляем код
echo "📥 Обновление кода из git..."
git pull origin main

# 2. Создаем папку если не существует
mkdir -p public/admin

# 3. Восстанавливаем файлы из git напрямую
echo "📁 Восстановление файлов из git..."

# Восстанавливаем login.html
if git show HEAD:public/admin/login.html > public/admin/login.html 2>/dev/null; then
    echo "✅ login.html восстановлен"
else
    echo "❌ Ошибка восстановления login.html"
fi

# Восстанавливаем index.html
if git show HEAD:public/admin/index.html > public/admin/index.html 2>/dev/null; then
    echo "✅ index.html восстановлен"
else
    echo "❌ Ошибка восстановления index.html"
fi

# Восстанавливаем admin.js
if git show HEAD:public/admin/admin.js > public/admin/admin.js 2>/dev/null; then
    echo "✅ admin.js восстановлен"
else
    echo "❌ Ошибка восстановления admin.js"
fi

# 4. Проверяем наличие всех файлов
echo ""
echo "📋 Проверка файлов:"
if [ -f "public/admin/login.html" ]; then
    echo "✅ login.html существует"
else
    echo "❌ login.html НЕ найден"
fi

if [ -f "public/admin/index.html" ]; then
    echo "✅ index.html существует"
else
    echo "❌ index.html НЕ найден"
fi

if [ -f "public/admin/admin.js" ]; then
    echo "✅ admin.js существует ($(wc -c < public/admin/admin.js) байт)"
else
    echo "❌ admin.js НЕ найден"
fi

# 5. Устанавливаем права
chmod -R 755 public/admin/
echo "✅ Права установлены"

# 6. Перезапускаем сервер
echo ""
echo "🔄 Перезапуск сервера..."
pm2 restart lovi-moment

echo ""
echo "✅ Готово! Проверьте:"
echo "   https://lovimoment-travel.com/admin/login"
echo ""
echo "📋 Если проблемы остались, проверьте логи:"
echo "   pm2 logs lovi-moment"

