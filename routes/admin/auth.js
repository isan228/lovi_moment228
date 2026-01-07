const express = require('express');
const router = express.Router();
const path = require('path');
const { User } = require('../../models');
const { requireGuest } = require('../../middleware/auth');

// Страница логина
router.get('/login', requireGuest, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin/login.html'));
});

// Обработка логина
router.post('/login', requireGuest, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Создаем сессию
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ success: true, message: 'Вход выполнен успешно' });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Выход
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при выходе' });
    }
    res.json({ success: true, message: 'Выход выполнен успешно' });
  });
});

// Проверка авторизации
router.get('/check', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;

