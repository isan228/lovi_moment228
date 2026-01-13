require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');
const sequelize = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка сессий
app.use(session({
  secret: process.env.SESSION_SECRET || 'lovi-moment-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Отключаем secure для работы через HTTP (если нет HTTPS)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    sameSite: 'lax' // Помогает с CORS и cookies
  }
}));

// Middleware для парсинга тела запроса
// Увеличиваем лимит для загрузки больших файлов (видео)
// НЕ применяем к multipart/form-data - их обрабатывает multer
const jsonParser = bodyParser.json({ limit: '200mb' });
const urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '200mb' });

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  // Если это multipart/form-data, пропускаем мимо body-parser
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  // Для остальных запросов применяем body-parser
  jsonParser(req, res, (err) => {
    if (err) {
      // Если JSON парсинг не удался, пробуем urlencoded
      return urlencodedParser(req, res, next);
    }
    next();
  });
});

// Настройка Nodemailer для отправки email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'lovimoment312@gmail.com',
    pass: process.env.EMAIL_PASSWORD || ''
  }
});

// Проверка подключения к email
transporter.verify((error, success) => {
  if (error) {
    console.log('Email сервер не настроен:', error.message);
  } else {
    console.log('Email сервер готов к отправке писем');
  }
});

// Маршруты для админ-панели
app.use('/api/admin', require('./routes/admin'));
app.use('/admin', require('./routes/admin')); // Также поддерживаем старый путь для HTML страниц

// Публичные API endpoints для главной страницы
// Эти endpoints работают даже если БД недоступна (возвращают значения по умолчанию)
app.get('/api/main-video', async (req, res) => {
  try {
    // Отключаем кеширование для этого endpoint
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const { Settings } = require('./models');
    const setting = await Settings.findOne({ where: { key: 'main_video' } });
    const videoPath = setting && setting.value ? setting.value : '/static/images/mainback3.mp4';
    res.json({ videoPath });
  } catch (error) {
    console.error('Ошибка при получении видео:', error);
    // Возвращаем видео по умолчанию, если БД недоступна
    res.json({ videoPath: '/static/images/mainback3.mp4' });
  }
});

// Получить активные виды туров (публичные)
app.get('/api/tour-types', async (req, res) => {
  try {
    const { TourType } = require('./models');
    const tourTypes = await TourType.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(tourTypes);
  } catch (error) {
    console.error('Ошибка при получении видов туров:', error);
    // Возвращаем пустой массив, если БД недоступна
    res.json([]);
  }
});

// Получить тур по slug (публичный)
app.get('/api/tours/:slug', async (req, res) => {
  try {
    const { Tour, TourType, TourImage, Country } = require('./models');
    const tour = await Tour.findOne({
      where: { slug: req.params.slug, isActive: true },
      include: [
        { model: TourType, as: 'tourType' },
        { model: TourImage, as: 'images', order: [['order', 'ASC']] },
        { model: Country, as: 'countryData' }
      ]
    });
    
    if (!tour) {
      return res.status(404).json({ error: 'Тур не найден' });
    }
    
    res.json(tour);
  } catch (error) {
    console.error('Ошибка при получении тура:', error);
    res.status(500).json({ error: 'Ошибка при получении тура' });
  }
});

// Получить все активные туры (публичный)
app.get('/api/tours', async (req, res) => {
  try {
    const { Tour, TourType, TourImage, Country } = require('./models');
    const tours = await Tour.findAll({
      where: { isActive: true },
      include: [
        { model: TourType, as: 'tourType' },
        { model: TourImage, as: 'images', order: [['order', 'ASC']] },
        { model: Country, as: 'countryData' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tours);
  } catch (error) {
    console.error('Ошибка при получении туров:', error);
    res.json([]);
  }
});

// Получить фотографии галереи (публичные)
app.get('/api/gallery', async (req, res) => {
  try {
    const { GalleryImage } = require('./models');
    const images = await GalleryImage.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
      limit: 50 // Ограничиваем количество для производительности
    });
    res.json(images);
  } catch (error) {
    console.error('Ошибка при получении галереи:', error);
    // Возвращаем пустой массив, если БД недоступна
    res.json([]);
  }
});

// Получить статистику
app.get('/api/stats', async (req, res) => {
  try {
    const { Settings } = require('./models');
    const toursSetting = await Settings.findOne({ where: { key: 'stats_tours' } });
    const touristsSetting = await Settings.findOne({ where: { key: 'stats_tourists' } });
    const experienceSetting = await Settings.findOne({ where: { key: 'stats_experience' } });
    
    res.json({
      tours: toursSetting ? toursSetting.value : '140',
      tourists: touristsSetting ? touristsSetting.value : '16 500+',
      experience: experienceSetting ? experienceSetting.value : '5 лет'
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    // Возвращаем значения по умолчанию, если БД недоступна
    res.json({
      tours: '140',
      tourists: '16 500+',
      experience: '5 лет'
    });
  }
});

// Обработка формы заявки на тур
app.post('/submit-application', async (req, res) => {
  try {
    const { name, phone, email, consent } = req.body;

    // Валидация
    if (!name || !phone || !consent) {
      return res.status(400).json({
        status: 'error',
        error: 'Имя, телефон и согласие обязательны для заполнения'
      });
    }

    // Формирование сообщения
    const mailOptions = {
      from: process.env.EMAIL_USER || 'lovimoment312@gmail.com',
      to: process.env.RECIPIENT_EMAIL || 'nuremirtopoev08@gmail.com',
      subject: 'Новая заявка на тур - Lovi Moment',
      html: `
        <h2>Новая заявка на тур</h2>
        <p><strong>Имя:</strong> ${name}</p>
        <p><strong>Телефон:</strong> ${phone}</p>
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
        <p><strong>Согласие на обработку данных:</strong> ${consent === 'on' || consent === true ? 'Да' : 'Нет'}</p>
        <p><strong>Дата:</strong> ${new Date().toLocaleString('ru-RU')}</p>
      `
    };

    // Отправка email
    await transporter.sendMail(mailOptions);

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Ошибка при отправке заявки:', error);
    res.status(500).json({
      status: 'error',
      error: 'Произошла ошибка при отправке заявки. Попробуйте позже.'
    });
  }
});

// Раздача статических файлов из public
// Исключаем /admin и /api из статики - они обрабатываются роутерами выше
// НО разрешаем статические файлы из /admin/ (admin.js и т.д.)
const staticMiddleware = express.static(path.join(__dirname, 'public'));
app.use((req, res, next) => {
  // Разрешаем статические файлы из /admin/ (admin.js, и т.д.)
  if (req.path.startsWith('/admin/') && !req.path.startsWith('/admin/api') && 
      (req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.png') || 
       req.path.endsWith('.jpg') || req.path.endsWith('.gif') || req.path.endsWith('.ico'))) {
    return staticMiddleware(req, res, next);
  }
  
  if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
    return next(); // Пропускаем статику для админки и API
  }
  // Для остальных путей используем статику
  staticMiddleware(req, res, next);
});

// Маршрут для динамических страниц туров /tour-about/:slug
// Отдаем один и тот же HTML файл, JavaScript загрузит данные по slug
app.get('/tour-about/:slug', (req, res) => {
  const tourAboutPath = path.join(__dirname, 'public', 'tour-about', 'index.html');
  const fs = require('fs');
  
  if (fs.existsSync(tourAboutPath)) {
    return res.sendFile(tourAboutPath);
  } else {
    // Если файл не найден, отправляем главную страницу
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Обработка всех остальных маршрутов (для статических HTML страниц)
// Express автоматически будет искать index.html в соответствующих папках
app.get('*', (req, res) => {
  // Если запрос идет к админ-панели, не обрабатываем здесь
  if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
    return res.status(404).send('Not found');
  }

  // Пытаемся найти соответствующий HTML файл
  const filePath = path.join(__dirname, 'public', req.path);
  const indexPath = path.join(filePath, 'index.html');
  const directFile = path.join(__dirname, 'public', req.path + '.html');

  // Проверяем существование файлов
  const fs = require('fs');
  
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  } else if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  } else if (fs.existsSync(directFile)) {
    return res.sendFile(directFile);
  } else {
    // Если файл не найден, отправляем главную страницу
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Проверка подключения к базе данных
sequelize.authenticate()
  .then(() => {
    console.log('Подключение к базе данных установлено успешно');
    
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Ошибка подключения к базе данных:', error.message);
    console.log('Сервер все равно запускается, но функционал БД будет недоступен');
    
    // Запуск сервера даже при ошибке БД (для статического сайта)
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
      console.log('Внимание: База данных недоступна');
    });
  });

module.exports = app;

