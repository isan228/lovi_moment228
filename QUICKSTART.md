# Быстрый старт

## Шаг 1: Установка зависимостей

```bash
npm install
```

## Шаг 2: Настройка переменных окружения

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

# Email настройки
EMAIL_USER=lovimoment312@gmail.com
EMAIL_PASSWORD=vvkmrflmtycpnldh
RECIPIENT_EMAIL=nuremirtopoev08@gmail.com

# Порт сервера
PORT=3000

# Секретный ключ для сессий (ОБЯЗАТЕЛЬНО измените!)
SESSION_SECRET=lovi-moment-secret-key-change-in-production

# Автоматическая синхронизация БД (опционально)
AUTO_SYNC_DB=false
```

## Шаг 3: Генерация статических файлов

Преобразуйте Django шаблоны в статические HTML файлы:

```bash
npm run build
```

Это создаст папку `public/` со всеми HTML файлами и скопирует статические ресурсы.

## Шаг 4: Запуск сервера

### Режим разработки (с автоперезагрузкой):
```bash
npm run dev
```

### Продакшн режим:
```bash
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`

## Что было сделано:

✅ Создан Express сервер для раздачи статических файлов  
✅ Создан скрипт для преобразования Django шаблонов в статические HTML  
✅ Настроен API endpoint `/submit-application` для обработки форм  
✅ Все Django теги (`{% static %}`, `{% url %}`) заменяются на правильные пути  
✅ Статические файлы (CSS, JS, изображения) копируются в `public/static/`  

## Структура после генерации:

```
lovi_moment/
├── main/templates/     # Исходные Django шаблоны
├── static/             # Исходные статические файлы
├── public/             # Сгенерированные статические HTML
│   ├── index.html
│   ├── tour/
│   │   └── index.html
│   ├── static/         # Копия статических файлов
│   └── ...
├── server.js           # Express сервер
└── build-static.js     # Скрипт генерации
```

