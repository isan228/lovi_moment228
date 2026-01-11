# Инструкция по деплою на сервер

## Подготовка сервера

### 1. Установка необходимого ПО

```bash
# Обновление системы (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# Установка Node.js (версия 18 или выше)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка PM2 (для управления процессом)
sudo npm install -g pm2

# Установка Git (если не установлен)
sudo apt install -y git
```

### 2. Настройка PostgreSQL

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# В консоли PostgreSQL выполните:
CREATE DATABASE lovi_moment;
CREATE USER lovi_user WITH PASSWORD 'your_secure_password';
ALTER ROLE lovi_user SET client_encoding TO 'utf8';
ALTER ROLE lovi_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE lovi_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE lovi_moment TO lovi_user;
\q
```

## Деплой приложения

### 1. Клонирование репозитория

```bash
# Перейдите в директорию для приложений
cd /var/www  # или другую директорию по вашему выбору

# Клонируйте репозиторий
git clone https://github.com/isan228/lovi_moment228.git
cd lovi_moment228
```

### 2. Установка зависимостей

```bash
npm install --production
```

### 3. Настройка переменных окружения

```bash
# Создайте файл .env
cp .env.example .env
nano .env  # или используйте другой редактор
```

**Важно:** Заполните все необходимые переменные:
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` - настройки БД
- `EMAIL_USER`, `EMAIL_PASSWORD`, `RECIPIENT_EMAIL` - настройки email
- `SESSION_SECRET` - **обязательно** измените на случайную строку!
- `PORT` - порт для приложения (по умолчанию 3000)

### 4. Генерация статических файлов

```bash
npm run build
```

### 5. Настройка базы данных

```bash
# Синхронизация структуры БД
npm run sync-db

# Создание первого администратора
npm run init-admin
```

**Примечание:** После выполнения `init-admin` будет создан администратор:
- Логин: `admin`
- Пароль: `admin123`
- ⚠️ **ВАЖНО:** Измените пароль после первого входа!

### 6. Запуск с PM2

```bash
# Запуск приложения
pm2 start server.js --name lovi-moment

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет PM2
```

### 7. Полезные команды PM2

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs lovi-moment

# Перезапуск
pm2 restart lovi-moment

# Остановка
pm2 stop lovi-moment

# Удаление из PM2
pm2 delete lovi-moment
```

## Настройка Nginx (опционально, для продакшена)

### 1. Установка Nginx

```bash
sudo apt install -y nginx
```

### 2. Создание конфигурации

```bash
sudo nano /etc/nginx/sites-available/lovi-moment
```

Добавьте следующую конфигурацию:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Замените на ваш домен

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Для статических файлов (опционально, для лучшей производительности)
    location /static/ {
        alias /var/www/lovi_moment228/public/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Активация конфигурации

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/lovi-moment /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

### 4. Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление (уже настроено в cron)
```

## Обновление приложения

```bash
# Перейдите в директорию проекта
cd /var/www/lovi_moment228

# Получите последние изменения
git pull origin main

# Установите новые зависимости (если есть)
npm install --production

# Пересоберите статические файлы
npm run build

# Перезапустите приложение
pm2 restart lovi-moment
```

## Мониторинг и логи

```bash
# Логи приложения
pm2 logs lovi-moment

# Мониторинг в реальном времени
pm2 monit

# Логи Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Резервное копирование

Рекомендуется настроить автоматическое резервное копирование базы данных:

```bash
# Создайте скрипт для бэкапа
nano /home/user/backup-lovi-moment.sh
```

Содержимое скрипта:

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="lovi_moment"
DB_USER="lovi_user"

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/lovi_moment_$DATE.sql

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "lovi_moment_*.sql" -mtime +7 -delete
```

Сделайте скрипт исполняемым и добавьте в cron:

```bash
chmod +x /home/user/backup-lovi-moment.sh
crontab -e
# Добавьте строку (бэкап каждый день в 2:00)
0 2 * * * /home/user/backup-lovi-moment.sh
```

## Устранение неполадок

### Приложение не запускается

1. Проверьте логи: `pm2 logs lovi-moment`
2. Проверьте, что порт не занят: `sudo netstat -tulpn | grep 3000`
3. Проверьте переменные окружения в `.env`
4. Проверьте подключение к БД: `npm run sync-db`

### Ошибки подключения к БД

1. Проверьте, что PostgreSQL запущен: `sudo systemctl status postgresql`
2. Проверьте настройки в `.env`
3. Проверьте права доступа пользователя БД

### Статические файлы не загружаются

1. Убедитесь, что выполнили `npm run build`
2. Проверьте права доступа к папке `public/`
3. Проверьте конфигурацию Nginx (если используется)

