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
    const uploadPath = path.join(__dirname, '../../public/static/images');
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
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB (увеличено для больших видео)
});

// Настройка Multer для загрузки изображений (фона)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/static/images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'main-background-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('image/');
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены! (JPG, PNG, GIF, WEBP)'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
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

// Получить настройку main_video (специальный маршрут перед общим)
router.get('/main_video', requireAuth, async (req, res) => {
  try {
    const setting = await Settings.findOne({
      where: { key: 'main_video' }
    });
    
    // Если настройка не найдена, возвращаем значение по умолчанию
    if (!setting) {
      return res.json({ key: 'main_video', value: '/static/images/mainback3.mp4' });
    }
    
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Ошибка при получении видео:', error);
    res.status(500).json({ error: 'Ошибка при получении видео' });
  }
});

// Получить настройку background_image (специальный маршрут перед общим)
router.get('/background_image', requireAuth, async (req, res) => {
  try {
    const setting = await Settings.findOne({
      where: { key: 'background_image' }
    });
    
    // Если настройка не найдена, возвращаем null (будет использоваться видео)
    if (!setting) {
      return res.json({ key: 'background_image', value: null });
    }
    
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Ошибка при получении фонового изображения:', error);
    res.status(500).json({ error: 'Ошибка при получении фонового изображения' });
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

// Обновить видео главной страницы (с загрузкой файла)
// ВАЖНО: должен быть ПЕРЕД router.put('/:key'), иначе будет перехвачен общим маршрутом
router.put('/main_video', requireAuth, (req, res, next) => {
  console.log('Запрос на загрузку видео. Content-Type:', req.headers['content-type']);
  console.log('req.body:', req.body);
  
  uploadVideo.single('video')(req, res, (err) => {
    if (err) {
      console.error('Ошибка multer при загрузке видео:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Файл слишком большой. Максимальный размер: 500MB' });
        }
        return res.status(400).json({ error: 'Ошибка загрузки файла: ' + err.message });
      }
      return res.status(400).json({ error: err.message || 'Ошибка при загрузке файла' });
    }
    console.log('Файл успешно загружен multer. req.file:', req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'null');
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      console.error('Файл не загружен. req.file:', req.file);
      console.error('req.body:', req.body);
      console.error('req.headers:', req.headers);
      return res.status(400).json({ error: 'Видео файл не загружен. Убедитесь, что вы выбрали файл и он имеет правильный формат (MP4, WEBM, OGG)' });
    }
    
    console.log('Обработка загруженного файла:', req.file.filename);

    const videoPath = `/static/images/${req.file.filename}`;
    const newFileName = req.file.filename;
    
    // Удаляем ВСЕ старые видео main-video-*, КРОМЕ только что загруженного
    const imagesDir = path.join(__dirname, '../../public/static/images');
    if (fs.existsSync(imagesDir)) {
      try {
        const files = fs.readdirSync(imagesDir);
        files.forEach(file => {
          // Удаляем все файлы, начинающиеся с main-video-, но НЕ новый файл
          if (file.startsWith('main-video-') && file !== newFileName) {
            const filePath = path.join(imagesDir, file);
            try {
              fs.unlinkSync(filePath);
              console.log('Удалено старое видео:', file);
        } catch (err) {
              console.error('Ошибка при удалении файла', file, ':', err);
            }
          }
        });
      } catch (err) {
        console.error('Ошибка при чтении директории:', err);
      }
    }
    
    // Также удаляем из старой директории static/images (если существует)
    const oldImagesDir = path.join(__dirname, '../../static/images');
    if (fs.existsSync(oldImagesDir)) {
      try {
        const files = fs.readdirSync(oldImagesDir);
        files.forEach(file => {
          // Удаляем все файлы, начинающиеся с main-video-, но НЕ новый файл
          if (file.startsWith('main-video-') && file !== newFileName) {
            const filePath = path.join(oldImagesDir, file);
            try {
              fs.unlinkSync(filePath);
              console.log('Удалено старое видео из старой директории:', file);
            } catch (err) {
              console.error('Ошибка при удалении файла', file, ':', err);
            }
          }
        });
      } catch (err) {
        console.error('Ошибка при чтении старой директории:', err);
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

// Обновить фоновое изображение главной страницы (с загрузкой файла)
// ВАЖНО: должен быть ПЕРЕД router.put('/:key'), иначе будет перехвачен общим маршрутом
router.put('/background_image', requireAuth, (req, res, next) => {
  console.log('Запрос на загрузку фонового изображения. Content-Type:', req.headers['content-type']);
  
  uploadImage.single('image')(req, res, (err) => {
    if (err) {
      console.error('Ошибка multer при загрузке изображения:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Файл слишком большой. Максимальный размер: 50MB' });
        }
        return res.status(400).json({ error: 'Ошибка загрузки файла: ' + err.message });
      }
      return res.status(400).json({ error: err.message || 'Ошибка при загрузке файла' });
    }
    console.log('Файл успешно загружен multer. req.file:', req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'null');
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      console.error('Файл не загружен. req.file:', req.file);
      return res.status(400).json({ error: 'Изображение не загружено. Убедитесь, что вы выбрали файл и он имеет правильный формат (JPG, PNG, GIF, WEBP)' });
    }
    
    console.log('Обработка загруженного файла:', req.file.filename);

    const imagePath = `/static/images/${req.file.filename}`;
    const newFileName = req.file.filename;
    
    // Удаляем ВСЕ старые изображения main-background-*, КРОМЕ только что загруженного
    const imagesDir = path.join(__dirname, '../../public/static/images');
    if (fs.existsSync(imagesDir)) {
      try {
        const files = fs.readdirSync(imagesDir);
        files.forEach(file => {
          // Удаляем все файлы, начинающиеся с main-background-, но НЕ новый файл
          if (file.startsWith('main-background-') && file !== newFileName) {
            const filePath = path.join(imagesDir, file);
            try {
              fs.unlinkSync(filePath);
              console.log('Удалено старое изображение:', file);
            } catch (err) {
              console.error('Ошибка при удалении файла', file, ':', err);
            }
          }
        });
      } catch (err) {
        console.error('Ошибка при чтении директории:', err);
      }
    }

    // Сохраняем путь к новому изображению
    const [setting, created] = await Settings.findOrCreate({
      where: { key: 'background_image' },
      defaults: { value: imagePath }
    });

    if (!created) {
      // Удаляем старое изображение, если оно существует
      if (setting.value && setting.value.startsWith('/static/images/main-background-')) {
        const oldImagePathPublic = path.join(__dirname, '../../public', setting.value);
        if (fs.existsSync(oldImagePathPublic)) {
          try {
            fs.unlinkSync(oldImagePathPublic);
            console.log('Удален старый файл изображения:', oldImagePathPublic);
          } catch (err) {
            console.error('Ошибка при удалении старого файла изображения:', err);
          }
        }
      }
      setting.value = imagePath;
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
    console.error('Ошибка при обновлении фонового изображения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении фонового изображения' });
  }
});

// Удалить фоновое изображение главной страницы
router.delete('/background_image', requireAuth, async (req, res) => {
  try {
    const setting = await Settings.findOne({ where: { key: 'background_image' } });
    
    if (!setting) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }

    // Удаляем файл изображения, если он существует
    if (setting.value && setting.value.startsWith('/static/images/main-background-')) {
      const imagePathPublic = path.join(__dirname, '../../public', setting.value);
      const imagePathStatic = path.join(__dirname, '../../', setting.value);
      
      if (fs.existsSync(imagePathPublic)) {
        try {
          fs.unlinkSync(imagePathPublic);
          console.log('Удален файл изображения:', imagePathPublic);
        } catch (err) {
          console.error('Ошибка при удалении файла изображения:', err);
        }
      } else if (fs.existsSync(imagePathStatic)) {
        try {
          fs.unlinkSync(imagePathStatic);
          console.log('Удален файл изображения:', imagePathStatic);
        } catch (err) {
          console.error('Ошибка при удалении файла изображения:', err);
        }
      }
      
      // Также удаляем все другие main-background-* файлы
      const imagesDir = path.join(__dirname, '../../public/static/images');
      if (fs.existsSync(imagesDir)) {
        try {
          const files = fs.readdirSync(imagesDir);
          files.forEach(file => {
            if (file.startsWith('main-background-')) {
              const filePath = path.join(imagesDir, file);
              try {
                fs.unlinkSync(filePath);
                console.log('Удалено старое изображение:', file);
              } catch (err) {
                console.error('Ошибка при удалении файла', file, ':', err);
              }
            }
          });
        } catch (err) {
          console.error('Ошибка при чтении директории:', err);
        }
      }
    }

    // Удаляем настройку из БД
    await setting.destroy();
    res.json({ success: true, message: 'Фоновое изображение удалено' });
  } catch (error) {
    console.error('Ошибка при удалении фонового изображения:', error);
    res.status(500).json({ error: 'Ошибка при удалении фонового изображения' });
  }
});

// Удалить видео главной страницы
router.delete('/main_video', requireAuth, async (req, res) => {
  try {
    const setting = await Settings.findOne({ where: { key: 'main_video' } });
    
    if (!setting) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }

    // Удаляем файл видео, если он существует
    if (setting.value && setting.value !== '/static/images/mainback3.mp4') {
      const videoPathPublic = path.join(__dirname, '../../public', setting.value);
      const videoPathStatic = path.join(__dirname, '../../', setting.value);
      
      if (fs.existsSync(videoPathPublic)) {
        try {
          fs.unlinkSync(videoPathPublic);
          console.log('Удален файл видео:', videoPathPublic);
        } catch (err) {
          console.error('Ошибка при удалении файла видео:', err);
        }
      } else if (fs.existsSync(videoPathStatic)) {
        try {
          fs.unlinkSync(videoPathStatic);
          console.log('Удален файл видео:', videoPathStatic);
        } catch (err) {
          console.error('Ошибка при удалении файла видео:', err);
        }
      }
      
      // Также удаляем все другие main-video-* файлы
      const imagesDir = path.join(__dirname, '../../public/static/images');
      if (fs.existsSync(imagesDir)) {
        try {
          const files = fs.readdirSync(imagesDir);
          files.forEach(file => {
            if (file.startsWith('main-video-')) {
              const filePath = path.join(imagesDir, file);
              try {
                fs.unlinkSync(filePath);
                console.log('Удалено старое видео:', file);
              } catch (err) {
                console.error('Ошибка при удалении файла', file, ':', err);
              }
            }
          });
        } catch (err) {
          console.error('Ошибка при чтении директории:', err);
        }
      }
    }

    // Удаляем настройку из БД
    await setting.destroy();
    res.json({ success: true, message: 'Видео удалено' });
  } catch (error) {
    console.error('Ошибка при удалении видео:', error);
    res.status(500).json({ error: 'Ошибка при удалении видео' });
  }
});

// Удалить настройку (общий маршрут)
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

