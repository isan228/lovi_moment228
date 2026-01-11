const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Settings } = require('../../models');
const { requireAuth } = require('../../middleware/auth');

// Настройка Multer для загрузки видео
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../static/images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'main-video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('video/');
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только видео файлы разрешены! (MP4, WEBM, OGG)'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Получить все настройки
router.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await Settings.findAll({
      order: [['key', 'ASC']]
    });
    
    // Преобразуем в объект для удобства
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Ошибка при получении настроек:', error);
    res.status(500).json({ error: 'Ошибка при получении настроек' });
  }
});

// Получить одну настройку по ключу
router.get('/:key', requireAuth, async (req, res) => {
  try {
    const setting = await Settings.findOne({
      where: { key: req.params.key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }
    
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Ошибка при получении настройки:', error);
    res.status(500).json({ error: 'Ошибка при получении настройки' });
  }
});

// Создать или обновить настройку
router.post('/', requireAuth, async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Ключ обязателен' });
    }

    const [setting, created] = await Settings.findOrCreate({
      where: { key },
      defaults: { value: value || '' }
    });

    if (!created) {
      setting.value = value || '';
      await setting.save();
    }

    res.json(setting);
  } catch (error) {
    console.error('Ошибка при сохранении настройки:', error);
    res.status(500).json({ error: 'Ошибка при сохранении настройки' });
  }
});

// Обновить настройку
router.put('/:key', requireAuth, async (req, res) => {
  try {
    const { value } = req.body;
    const setting = await Settings.findOne({
      where: { key: req.params.key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }

    setting.value = value !== undefined ? value : setting.value;
    await setting.save();

    res.json(setting);
  } catch (error) {
    console.error('Ошибка при обновлении настройки:', error);
    res.status(500).json({ error: 'Ошибка при обновлении настройки' });
  }
});

// Обновить видео главной страницы (с загрузкой файла)
router.put('/main_video', requireAuth, uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Видео файл не загружен' });
    }

    const videoPath = `/static/images/${req.file.filename}`;
    
    // Удаляем старое видео, если оно существует
    const oldSetting = await Settings.findOne({ where: { key: 'main_video' } });
    if (oldSetting && oldSetting.value && oldSetting.value !== '/static/images/mainback3.mp4') {
      const oldVideoPath = path.join(__dirname, '../../', oldSetting.value);
      if (fs.existsSync(oldVideoPath)) {
        try {
          fs.unlinkSync(oldVideoPath);
        } catch (err) {
          console.error('Ошибка при удалении старого видео:', err);
        }
      }
    }

    // Сохраняем путь к новому видео
    const [setting, created] = await Settings.findOrCreate({
      where: { key: 'main_video' },
      defaults: { value: videoPath }
    });

    if (!created) {
      setting.value = videoPath;
      await setting.save();
    }

    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    // Удаляем загруженный файл при ошибке
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Ошибка при удалении файла:', unlinkError);
      }
    }
    console.error('Ошибка при обновлении видео:', error);
    res.status(500).json({ error: 'Ошибка при обновлении видео' });
  }
});

// Удалить настройку
router.delete('/:key', requireAuth, async (req, res) => {
  try {
    const setting = await Settings.findOne({
      where: { key: req.params.key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }

    await setting.destroy();
    res.json({ success: true, message: 'Настройка удалена' });
  } catch (error) {
    console.error('Ошибка при удалении настройки:', error);
    res.status(500).json({ error: 'Ошибка при удалении настройки' });
  }
});

// Получить всю статистику
router.get('/stats/all', requireAuth, async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

// Обновить статистику
router.put('/stats/update', requireAuth, async (req, res) => {
  try {
    const { tours, tourists, experience } = req.body;
    
    // Обновляем или создаем настройки статистики
    if (tours !== undefined) {
      await Settings.findOrCreate({
        where: { key: 'stats_tours' },
        defaults: { value: tours }
      }).then(([setting]) => {
        setting.value = tours;
        return setting.save();
      });
    }
    
    if (tourists !== undefined) {
      await Settings.findOrCreate({
        where: { key: 'stats_tourists' },
        defaults: { value: tourists }
      }).then(([setting]) => {
        setting.value = tourists;
        return setting.save();
      });
    }
    
    if (experience !== undefined) {
      await Settings.findOrCreate({
        where: { key: 'stats_experience' },
        defaults: { value: experience }
      }).then(([setting]) => {
        setting.value = experience;
        return setting.save();
      });
    }
    
    res.json({ success: true, message: 'Статистика обновлена' });
  } catch (error) {
    console.error('Ошибка при обновлении статистики:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статистики' });
  }
});

module.exports = router;

