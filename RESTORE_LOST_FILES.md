# Восстановление потерянных файлов на сервере

После выполнения `npm run build` были потеряны загруженные файлы. Вот как их восстановить:

## Что было потеряно

- Фотографии туров (`public/static/images/tours/`)
- Фотографии галереи (`public/static/images/gallery/`)
- Фотографии отзывов (`public/static/images/reviews/`)
- Фотографии блогов (`public/static/images/blogs/`)
- Баннеры стран (`public/static/images/countries/`)
- Изображения видов туров (`public/static/images/tour-types/`)

## Варианты восстановления

### Вариант 1: Из резервной копии (если есть)

```bash
cd /var/www/lovi_moment228

# Если есть резервная копия
cp -r /path/to/backup/public/static/images/tours public/static/images/
cp -r /path/to/backup/public/static/images/gallery public/static/images/
cp -r /path/to/backup/public/static/images/reviews public/static/images/
cp -r /path/to/backup/public/static/images/blogs public/static/images/
cp -r /path/to/backup/public/static/images/countries public/static/images/
cp -r /path/to/backup/public/static/images/tour-types public/static/images/
```

### Вариант 2: Загрузка заново через админ-панель

1. Войдите в админ-панель: `https://lovimoment-travel.com/admin/login`
2. Загрузите файлы заново:
   - Туры → загрузите фотографии для каждого тура
   - Галерея → загрузите фотографии
   - Отзывы → загрузите фотографии отзывов
   - Блоги → загрузите изображения блогов
   - Страны → загрузите баннеры
   - Виды туров → загрузите изображения

### Вариант 3: Проверка исходных файлов

Проверьте, есть ли файлы в исходной папке `static/`:

```bash
cd /var/www/lovi_moment228

# Проверьте исходные статические файлы
ls -la static/images/

# Если там есть файлы, скопируйте их
mkdir -p public/static/images
cp -r static/images/* public/static/images/ 2>/dev/null || echo "Файлы не найдены"
```

## Предотвращение проблемы в будущем

✅ **Обновленный скрипт `build-static.js` теперь автоматически сохраняет все загруженные файлы!**

После обновления кода на сервере:

```bash
cd /var/www/lovi_moment228
git pull origin main
```

Теперь при выполнении `npm run build` все загруженные файлы будут автоматически сохраняться и восстанавливаться.

## Проверка после восстановления

```bash
# Проверьте наличие папок
ls -la public/static/images/

# Должны быть папки:
# - tours/
# - gallery/
# - reviews/
# - blogs/
# - countries/
# - tour-types/
```

## Важно

⚠️ **В будущем всегда делайте резервную копию перед `npm run build`:**

```bash
# Создайте резервную копию
cp -r public public_backup_$(date +%Y%m%d_%H%M%S)

# Или используйте git для сохранения изменений
git add public/static/images/
git commit -m "Backup: сохранение загруженных файлов"
```

