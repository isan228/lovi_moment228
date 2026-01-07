# Админ-панель Lovi Moment

## Установка и настройка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных PostgreSQL

Создайте файл `.env` на основе `.env.example`:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

Затем откройте `.env` и настройте переменные:

```env
# Настройки базы данных PostgreSQL
DB_NAME=lovi_moment
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Секретный ключ для сессий (ОБЯЗАТЕЛЬНО измените!)
SESSION_SECRET=lovi-moment-secret-key-change-in-production

# Email настройки
EMAIL_USER=lovimoment312@gmail.com
EMAIL_PASSWORD=vvkmrflmtycpnldh
RECIPIENT_EMAIL=nuremirtopoev08@gmail.com

# Порт сервера
PORT=3000

# Автоматическая синхронизация БД (опционально)
AUTO_SYNC_DB=false
SYNC_ALTER=false
```

### 3. Создание базы данных

Создайте базу данных в PostgreSQL:

```sql
CREATE DATABASE lovi_moment;
```

### 4. Синхронизация базы данных

Создайте таблицы в базе данных (автоматически):

```bash
npm run sync-db
```

**Варианты синхронизации:**
- `npm run sync-db` - обычная синхронизация (создает только отсутствующие таблицы)
- `npm run sync-db:alter` - синхронизация с изменением структуры (безопаснее)
- `npm run sync-db:force` - принудительная синхронизация (⚠️ удаляет все данные!)

**Автоматическая синхронизация при запуске:**

Добавьте в `.env`:
```env
AUTO_SYNC_DB=true
SYNC_ALTER=true  # опционально, для безопасного изменения структуры
```

### 5. Создание первого администратора

```bash
npm run init-admin
```

Будет создан администратор:
- **Логин:** `admin`
- **Пароль:** `admin123`

⚠️ **ВАЖНО:** Измените пароль после первого входа!

## Запуск

```bash
npm start
```

Админ-панель будет доступна по адресу: `http://localhost:3000/admin`

## Функционал админ-панели

### 1. Виды туров
- Добавление новых видов туров
- Редактирование существующих
- Удаление видов туров

### 2. Туры
- Добавление новых туров
- Редактирование туров
- Управление фотографиями туров
- Установка главного фото
- Удаление туров

### 3. Галерея
- Загрузка фотографий в галерею
- Добавление описания и метаданных
- Удаление фотографий

## API Endpoints

### Аутентификация
- `POST /api/admin/auth/login` - Вход
- `POST /api/admin/auth/logout` - Выход
- `GET /api/admin/auth/check` - Проверка авторизации

### Виды туров
- `GET /api/admin/tour-types` - Получить все виды
- `GET /api/admin/tour-types/:id` - Получить один вид
- `POST /api/admin/tour-types` - Создать вид
- `PUT /api/admin/tour-types/:id` - Обновить вид
- `DELETE /api/admin/tour-types/:id` - Удалить вид

### Туры
- `GET /api/admin/tours` - Получить все туры
- `GET /api/admin/tours/:id` - Получить один тур
- `POST /api/admin/tours` - Создать тур
- `PUT /api/admin/tours/:id` - Обновить тур
- `DELETE /api/admin/tours/:id` - Удалить тур

### Фотографии туров
- `GET /api/admin/tour-images/tour/:tourId` - Получить фото тура
- `POST /api/admin/tour-images/tour/:tourId` - Загрузить фото
- `PUT /api/admin/tour-images/:id` - Обновить фото
- `DELETE /api/admin/tour-images/:id` - Удалить фото

### Галерея
- `GET /api/admin/gallery` - Получить все фото
- `GET /api/admin/gallery/:id` - Получить одно фото
- `POST /api/admin/gallery` - Загрузить фото
- `PUT /api/admin/gallery/:id` - Обновить фото
- `DELETE /api/admin/gallery/:id` - Удалить фото

## Структура базы данных

### users
- id (SERIAL PRIMARY KEY)
- username (VARCHAR UNIQUE)
- password (VARCHAR - захеширован)
- isAdmin (BOOLEAN)

### tour_types
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- description (TEXT)

### tours
- id (SERIAL PRIMARY KEY)
- title (VARCHAR)
- description (TEXT)
- location (VARCHAR)
- country (VARCHAR)
- duration (VARCHAR)
- price (DECIMAL)
- tourTypeId (INTEGER - FK)
- isActive (BOOLEAN)

### tour_images
- id (SERIAL PRIMARY KEY)
- tourId (INTEGER - FK)
- imagePath (VARCHAR)
- isMain (BOOLEAN)
- order (INTEGER)

### gallery_images
- id (SERIAL PRIMARY KEY)
- imagePath (VARCHAR)
- title (VARCHAR)
- description (TEXT)
- country (VARCHAR)
- order (INTEGER)

## Безопасность

1. Все пароли хешируются с помощью bcrypt
2. Используются сессии для аутентификации
3. Все API endpoints защищены middleware `requireAuth`
4. Загрузка файлов ограничена типами изображений и размером 10MB

## Загрузка файлов

Фотографии сохраняются в:
- Туры: `public/static/images/tours/`
- Галерея: `public/static/images/gallery/`

Файлы автоматически получают уникальные имена для предотвращения конфликтов.

