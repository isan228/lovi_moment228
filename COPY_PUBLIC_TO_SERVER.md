# Копирование папки public на сервер

Если на сервере удалена вся папка `public`, а локально все файлы есть, скопируйте их на сервер.

## Вариант 1: Через SCP (рекомендуется)

### На Windows (PowerShell):

```powershell
# Перейдите в папку проекта
cd "C:\Users\melis\OneDrive\Рабочий стол\lovi_moment"

# Скопируйте всю папку public на сервер
scp -r public/* root@lovimoment-travel.com:/var/www/lovi_moment228/public/
```

### На Linux/Mac:

```bash
cd /path/to/lovi_moment
scp -r public/* root@lovimoment-travel.com:/var/www/lovi_moment228/public/
```

## Вариант 2: Через WinSCP (Windows, графический интерфейс)

1. Установите WinSCP: https://winscp.net/
2. Подключитесь к серверу
3. Перейдите в `/var/www/lovi_moment228/`
4. Скопируйте всю папку `public` из локальной машины на сервер

## Вариант 3: Создать архив и загрузить

### На локальной машине:

```bash
# Создайте архив
cd "C:\Users\melis\OneDrive\Рабочий стол\lovi_moment"
tar -czf public_backup.tar.gz public/

# Или через PowerShell (7-Zip)
Compress-Archive -Path public -DestinationPath public_backup.zip
```

### На сервере:

```bash
cd /var/www/lovi_moment228

# Загрузите архив через SCP или WinSCP, затем:
tar -xzf public_backup.tar.gz
# Или
unzip public_backup.zip

# Установите права
chmod -R 755 public/

# Перезапустите сервер
pm2 restart lovi-moment
```

## Вариант 4: Через Git (если файлы в репозитории)

```bash
# На сервере
cd /var/www/lovi_moment228
git pull origin main
git checkout HEAD -- public/
```

## После копирования на сервере:

```bash
cd /var/www/lovi_moment228

# Проверьте структуру
ls -la public/
ls -la public/admin/
ls -la public/static/

# Установите права
chmod -R 755 public/

# Перезапустите сервер
pm2 restart lovi-moment

# Проверьте логи
pm2 logs lovi-moment
```

## Проверка:

- Главная страница: `https://lovimoment-travel.com/`
- Админ-панель: `https://lovimoment-travel.com/admin/login`
- Статические файлы должны загружаться

