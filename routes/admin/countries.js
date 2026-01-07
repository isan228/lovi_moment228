const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Country } = require('../../models');
const { requireAuth } = require('../../middleware/auth');

// Настройка Multer для загрузки баннеров стран
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../static/images/countries');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'country-banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Получить все страны
router.get('/', requireAuth, async (req, res) => {
  try {
    const countries = await Country.findAll({
      order: [['name', 'ASC']]
    });
    res.json(countries);
  } catch (error) {
    console.error('Ошибка при получении стран:', error);
    res.status(500).json({ error: 'Ошибка при получении стран' });
  }
});

// Получить одну страну
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const country = await Country.findByPk(req.params.id);
    if (!country) {
      return res.status(404).json({ error: 'Страна не найдена' });
    }
    res.json(country);
  } catch (error) {
    console.error('Ошибка при получении страны:', error);
    res.status(500).json({ error: 'Ошибка при получении страны' });
  }
});

// Создать страну
router.post('/', requireAuth, upload.single('banner'), async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    let bannerPath = null;
    if (req.file) {
      bannerPath = `/static/images/countries/${req.file.filename}`;
    }

    const country = await Country.create({
      name,
      banner: bannerPath,
      isActive: isActive !== undefined ? isActive : true
    });
    res.status(201).json(country);
  } catch (error) {
    console.error('Ошибка при создании страны:', error);
    res.status(500).json({ error: 'Ошибка при создании страны' });
  }
});

// Обновить страну
router.put('/:id', requireAuth, upload.single('banner'), async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const country = await Country.findByPk(req.params.id);
    
    if (!country) {
      return res.status(404).json({ error: 'Страна не найдена' });
    }

    country.name = name || country.name;
    country.isActive = isActive !== undefined ? isActive : country.isActive;
    
    // Если загружен новый баннер, обновляем путь и удаляем старый файл
    if (req.file) {
      // Удаляем старый баннер, если он существует
      if (country.banner) {
        const oldBannerPath = path.join(__dirname, '../../', country.banner);
        if (fs.existsSync(oldBannerPath)) {
          fs.unlinkSync(oldBannerPath);
        }
      }
      country.banner = `/static/images/countries/${req.file.filename}`;
    }
    
    await country.save();

    res.json(country);
  } catch (error) {
    console.error('Ошибка при обновлении страны:', error);
    res.status(500).json({ error: 'Ошибка при обновлении страны' });
  }
});

// Удалить страну
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const country = await Country.findByPk(req.params.id);
    
    if (!country) {
      return res.status(404).json({ error: 'Страна не найдена' });
    }

    // Удаляем баннер, если он существует
    if (country.banner) {
      const bannerPath = path.join(__dirname, '../../', country.banner);
      if (fs.existsSync(bannerPath)) {
        fs.unlinkSync(bannerPath);
      }
    }

    await country.destroy();
    res.json({ success: true, message: 'Страна удалена' });
  } catch (error) {
    console.error('Ошибка при удалении страны:', error);
    res.status(500).json({ error: 'Ошибка при удалении страны' });
  }
});

module.exports = router;

