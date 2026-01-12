# Инструкция по восстановлению сервера после удаления файлов

Если после `npm run build` сломались админ-панель и другие функции, выполните следующие шаги:

## 1. Восстановление админ-панели

### Вариант A: Из git (если файлы закоммичены)

```bash
cd /var/www/lovi_moment228
git pull origin main
git checkout HEAD -- public/admin/
```

### Вариант B: Ручное копирование

```bash
cd /var/www/lovi_moment228
mkdir -p public/admin
```

Затем скопируйте файлы `login.html`, `index.html` и `admin.js` из локальной папки `public/admin/` на сервер.

## 2. Проверка базовых настроек

Проверьте, что следующие файлы и папки существуют:

```bash
# Проверка структуры
ls -la public/
ls -la public/static/
ls -la public/admin/

# Проверка основных файлов
ls -la public/index.html
ls -la public/static/css/
ls -la public/static/js/
ls -la public/static/images/
```

## 3. Пересборка проекта (БЕЗ удаления админ-панели)

Если нужно пересобрать проект, сначала убедитесь, что у вас обновленная версия `build-static.js`, которая сохраняет админ-панель:

```bash
cd /var/www/lovi_moment228
git pull origin main
npm run build
```

## 4. Проверка работы сервера

```bash
# Проверка статуса
pm2 status

# Перезапуск
pm2 restart lovi-moment

# Просмотр логов
pm2 logs lovi-moment
```

## 5. Проверка доступа

- Главная страница: `https://lovimoment-travel.com/`
- Админ-панель: `https://lovimoment-travel.com/admin/login`
- API: `https://lovimoment-travel.com/api/stats`

## 6. Если что-то не работает

### Проверка базы данных:
```bash
npm run sync-db
```

### Проверка администратора:
```bash
npm run init-admin
```

### Проверка переменных окружения:
```bash
cat .env
# Убедитесь, что все переменные заполнены
```

## 7. Восстановление из резервной копии (если есть)

Если у вас есть резервная копия папки `public/`:

```bash
# Остановите сервер
pm2 stop lovi-moment

# Восстановите из бэкапа
cp -r /path/to/backup/public/* /var/www/lovi_moment228/public/

# Запустите сервер
pm2 start lovi-moment
```

## Предотвращение проблемы в будущем

1. **Всегда делайте бэкап перед `npm run build`:**
   ```bash
   cp -r public public_backup_$(date +%Y%m%d_%H%M%S)
   ```

2. **Используйте обновленную версию build-static.js**, которая автоматически сохраняет админ-панель

3. **Добавьте админ-панель в git:**
   ```bash
   git add public/admin/
   git commit -m "Add admin panel files"
   git push origin main
   ```

