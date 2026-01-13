# Инструкция по обновлению на сервере

После выполнения `git pull` на сервере **ОБЯЗАТЕЛЬНО** нужно запустить:

```bash
# 1. Установить новые зависимости (если есть)
npm install --production

# 2. Пересобрать статические файлы (CSS, JS, изображения)
npm run build

# 3. Перезапустить приложение
pm2 restart lovi-moment
```

## Почему это важно?

Статические файлы (CSS, JS) копируются из папки `static/` в `public/static/` только при выполнении `npm run build`. 

Если не запустить `npm run build`, то:
- ❌ Стили не будут скопированы в `public/static/css/`
- ❌ JavaScript файлы не будут скопированы в `public/static/js/`
- ❌ Страницы будут без стилей и скриптов

## Быстрая команда для обновления

```bash
cd /var/www/lovi_moment228  # или ваш путь к проекту
git pull origin main
npm install --production
npm run build
pm2 restart lovi-moment
```

## Проверка после обновления

```bash
# Проверьте, что статические файлы скопированы
ls -la public/static/css/
ls -la public/static/js/

# Проверьте логи
pm2 logs lovi-moment --lines 50
```

