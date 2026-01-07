const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { TourType } = require('../../models');
const { requireAuth } = require('../../middleware/auth');

// Настройка Multer для загрузки изображений видов туров
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../static/images/tour-types');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tour-type-' + uniqueSuffix + path.extname(file.originalname));
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
      cb(new Error('Только изображения!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Получить все типы туров
router.get('/', requireAuth, async (req, res) => {
  try {
    const tourTypes = await TourType.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(tourTypes);
  } catch (error) {
    console.error('Ошибка при получении типов туров:', error);
    res.status(500).json({ error: 'Ошибка при получении типов туров' });
  }
});

// Получить один тип тура
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const tourType = await TourType.findByPk(req.params.id);
    if (!tourType) {
      return res.status(404).json({ error: 'Тип тура не найден' });
    }
    res.json(tourType);
  } catch (error) {
    console.error('Ошибка при получении типа тура:', error);
    res.status(500).json({ error: 'Ошибка при получении типа тура' });
  }
});

// Создать тип тура
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, dates } = req.body;
    
    if (!name) {
      // Если файл был загружен, удаляем его при ошибке
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Название обязательно' });
    }

    // Парсим даты из JSON строки или используем пустой массив
    let datesArray = [];
    if (dates) {
      try {
        datesArray = typeof dates === 'string' ? JSON.parse(dates) : dates;
      } catch (e) {
        datesArray = [];
      }
    }

    const imagePath = req.file ? `/static/images/tour-types/${req.file.filename}` : null;
    const tourType = await TourType.create({ name, dates: datesArray, imagePath });
    res.status(201).json(tourType);
  } catch (error) {
    // Если файл был загружен, удаляем его при ошибке
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Ошибка при удалении файла:', unlinkError);
      }
    }
    console.error('Ошибка при создании типа тура:', error);
    res.status(500).json({ error: 'Ошибка при создании типа тура' });
  }
});

// Обновить тип тура
router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, dates } = req.body;
    const tourType = await TourType.findByPk(req.params.id);
    
    if (!tourType) {
      // Если файл был загружен, удаляем его при ошибке
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Тип тура не найден' });
    }

    // Если загружено новое изображение, удаляем старое
    if (req.file) {
      if (tourType.imagePath) {
        const oldImagePath = path.join(__dirname, '../../static/images/tour-types', path.basename(tourType.imagePath));
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (unlinkError) {
            console.error('Ошибка при удалении старого изображения:', unlinkError);
          }
        }
      }
      tourType.imagePath = `/static/images/tour-types/${req.file.filename}`;
    }

    // Парсим даты из JSON строки или используем существующие
    if (dates !== undefined) {
      try {
        tourType.dates = typeof dates === 'string' ? JSON.parse(dates) : dates;
      } catch (e) {
        tourType.dates = [];
      }
    }

    tourType.name = name || tourType.name;
    await tourType.save();

    res.json(tourType);
  } catch (error) {
    // Если файл был загружен, удаляем его при ошибке
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Ошибка при удалении файла:', unlinkError);
      }
    }
    console.error('Ошибка при обновлении типа тура:', error);
    res.status(500).json({ error: 'Ошибка при обновлении типа тура' });
  }
});

// Удалить тип тура
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const tourType = await TourType.findByPk(req.params.id);
    
    if (!tourType) {
      return res.status(404).json({ error: 'Тип тура не найден' });
    }

    // Удаляем изображение, если оно есть
    if (tourType.imagePath) {
      const imagePath = path.join(__dirname, '../../static/images/tour-types', path.basename(tourType.imagePath));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (unlinkError) {
          console.error('Ошибка при удалении изображения:', unlinkError);
        }
      }
    }

    await tourType.destroy();
    res.json({ success: true, message: 'Тип тура удален' });
  } catch (error) {
    console.error('Ошибка при удалении типа тура:', error);
    res.status(500).json({ error: 'Ошибка при удалении типа тура' });
  }
});

module.exports = router;

