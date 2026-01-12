#!/bin/bash
# Скрипт для копирования папки public на сервер
# Использование на ЛОКАЛЬНОЙ машине (Linux/Mac):
#   bash scripts/copy-public-to-server.sh user@server:/var/www/lovi_moment228
#
# Или вручную через SCP:
#   scp -r public/* user@server:/var/www/lovi_moment228/public/

SERVER_PATH=$1

if [ -z "$SERVER_PATH" ]; then
    echo "❌ Укажите путь к серверу"
    echo "Использование: bash scripts/copy-public-to-server.sh user@server:/var/www/lovi_moment228"
    echo ""
    echo "Пример:"
    echo "  bash scripts/copy-public-to-server.sh root@lovimoment-travel.com:/var/www/lovi_moment228"
    exit 1
fi

echo "📦 Копирование папки public на сервер..."
echo "Сервер: $SERVER_PATH"
echo ""

# Копируем всю папку public
scp -r public/* ${SERVER_PATH}/public/

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Папка public успешно скопирована на сервер!"
    echo ""
    echo "Теперь на сервере выполните:"
    echo "  cd /var/www/lovi_moment228"
    echo "  chmod -R 755 public/"
    echo "  pm2 restart lovi-moment"
else
    echo ""
    echo "❌ Ошибка при копировании"
    exit 1
fi

