const express = require('express');
const router = express.Router();
const { requireAuth, requireGuest } = require('../../middleware/auth');
const path = require('path');

// Страница логина (до подключения других роутов)
router.get('/login', requireGuest, (req, res) => {
  const loginPath = path.join(__dirname, '../../public/admin/login.html');
  console.log('Admin login path:', loginPath);
  const fs = require('fs');
  if (!fs.existsSync(loginPath)) {
    console.error('Login file not found at:', loginPath);
    return res.status(404).send('Login page not found');
  }
  res.sendFile(loginPath);
});

// Главная страница админ-панели
router.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin/index.html'));
});

// Раздача статических файлов админ-панели (admin.js и другие)
router.get('/:filename', (req, res, next) => {
  const filename = req.params.filename;
  // Разрешаем только определенные файлы
  const allowedFiles = ['admin.js'];
  
  if (allowedFiles.includes(filename)) {
    const filePath = path.join(__dirname, '../../public/admin', filename);
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  
  // Если это не статический файл, передаем дальше
  next();
});

// Подключение роутов
router.use('/auth', require('./auth'));
router.use('/countries', require('./countries'));
router.use('/tour-types', require('./tourTypes'));
router.use('/tours', require('./tours'));
router.use('/tour-images', require('./tourImages'));
router.use('/gallery', require('./gallery'));
router.use('/settings', require('./settings'));
router.use('/reviews', require('./reviews'));
router.use('/blogs', require('./blogs'));

module.exports = router;

