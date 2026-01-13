const express = require('express');
const router = express.Router();
const { Tour, TourType, TourImage, Country } = require('../../models');
const { requireAuth } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка multer для загрузки header изображений
const headerImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/static/images/tours');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tour-header-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadHeaderImage = multer({
  storage: headerImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|heic|heif)$/i;
    const extname = allowedExtensions.test(file.originalname);
    
    if (!extname) {
      return cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif, webp, heic, heif)'));
    }
    
    const isHeic = /\.(heic|heif)$/i.test(file.originalname);
    if (isHeic) {
      return cb(null, true);
    }
    
    const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp)$/i;
    const mimetype = allowedMimeTypes.test(file.mimetype) || file.mimetype.startsWith('image/');
    
    if (mimetype) {
      return cb(null, true);
    } else {
      return cb(null, true); // Разрешаем если расширение правильное
    }
  }
});

// Получить все туры
router.get('/', requireAuth, async (req, res) => {
  try {
    const tours = await Tour.findAll({
      include: [
        { model: TourType, as: 'tourType' },
        { model: TourImage, as: 'images' },
        { model: Country, as: 'countryData' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tours);
  } catch (error) {
    console.error('Ошибка при получении туров:', error);
    res.status(500).json({ error: 'Ошибка при получении туров' });
  }
});

// Получить один тур
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
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

// Создать тур
router.post('/', requireAuth, uploadHeaderImage.single('headerImage'), async (req, res) => {
  try {
    const { 
      title, description, location, country, countryId, duration, daysCount, program, 
      price, pricesByDay, slug, subtitle, 
      datesByMonth, importantInfo, faq, tourTypeId, isActive 
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    // Парсим JSON поля если это строки
    let programArray = [];
    if (program) {
      if (typeof program === 'string') {
        try {
          programArray = JSON.parse(program);
        } catch (e) {
          programArray = Array.isArray(program) ? program : [];
        }
      } else if (Array.isArray(program)) {
        programArray = program;
      }
    }

    let datesByMonthArray = [];
    if (datesByMonth) {
      if (typeof datesByMonth === 'string') {
        try {
          datesByMonthArray = JSON.parse(datesByMonth);
        } catch (e) {
          datesByMonthArray = Array.isArray(datesByMonth) ? datesByMonth : [];
        }
      } else if (Array.isArray(datesByMonth)) {
        datesByMonthArray = datesByMonth;
      }
    }

    let importantInfoObj = {};
    if (importantInfo) {
      if (typeof importantInfo === 'string') {
        try {
          importantInfoObj = JSON.parse(importantInfo);
        } catch (e) {
          importantInfoObj = typeof importantInfo === 'object' ? importantInfo : {};
        }
      } else if (typeof importantInfo === 'object') {
        importantInfoObj = importantInfo;
      }
    }

    let faqArray = [];
    if (faq) {
      if (typeof faq === 'string') {
        try {
          faqArray = JSON.parse(faq);
        } catch (e) {
          faqArray = Array.isArray(faq) ? faq : [];
        }
      } else if (Array.isArray(faq)) {
        faqArray = faq;
      }
    }

    let pricesByDayArray = [];
    if (pricesByDay) {
      if (typeof pricesByDay === 'string') {
        try {
          pricesByDayArray = JSON.parse(pricesByDay);
        } catch (e) {
          pricesByDayArray = Array.isArray(pricesByDay) ? pricesByDay : [];
        }
      } else if (Array.isArray(pricesByDay)) {
        pricesByDayArray = pricesByDay;
      }
    }

    // Обрабатываем загруженное изображение header
    let headerImagePath = null;
    if (req.file) {
      headerImagePath = `/static/images/tours/${req.file.filename}`;
    }

    // Обрабатываем price: если пустая строка или не число, то null
    let priceValue = null;
    if (price !== undefined && price !== null && price !== '') {
      const parsedPrice = parseFloat(price);
      if (!isNaN(parsedPrice)) {
        priceValue = parsedPrice;
      }
    }

    const tour = await Tour.create({
      title,
      description,
      location,
      country,
      countryId: countryId || null,
      duration,
      daysCount: daysCount || 1,
      program: programArray,
      price: priceValue,
      pricesByDay: pricesByDayArray,
      slug: slug || null,
      headerImage: headerImagePath,
      subtitle: subtitle || null,
      datesByMonth: datesByMonthArray,
      importantInfo: importantInfoObj,
      faq: faqArray,
      tourTypeId: tourTypeId || null,
      isActive: isActive !== undefined ? isActive : true
    });

    const tourWithRelations = await Tour.findByPk(tour.id, {
      include: [
        { model: TourType, as: 'tourType' },
        { model: TourImage, as: 'images' },
        { model: Country, as: 'countryData' }
      ]
    });

    res.status(201).json(tourWithRelations);
  } catch (error) {
    console.error('Ошибка при создании тура:', error);
    res.status(500).json({ error: 'Ошибка при создании тура' });
  }
});

// Обновить тур
router.put('/:id', requireAuth, uploadHeaderImage.single('headerImage'), async (req, res) => {
  try {
    const { 
      title, description, location, country, countryId, duration, daysCount, program, 
      price, pricesByDay, slug, subtitle, 
      datesByMonth, importantInfo, faq, tourTypeId, isActive 
    } = req.body;
    const tour = await Tour.findByPk(req.params.id);
    
    if (!tour) {
      // Удаляем загруженный файл если тур не найден
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Тур не найден' });
    }

    // Парсим JSON поля если это строки
    if (program !== undefined) {
      let programArray = [];
      if (program) {
        if (typeof program === 'string') {
          try {
            programArray = JSON.parse(program);
          } catch (e) {
            programArray = Array.isArray(program) ? program : [];
          }
        } else if (Array.isArray(program)) {
          programArray = program;
        }
      }
      tour.program = programArray;
    }

    if (datesByMonth !== undefined) {
      let datesByMonthArray = [];
      if (datesByMonth) {
        if (typeof datesByMonth === 'string') {
          try {
            datesByMonthArray = JSON.parse(datesByMonth);
          } catch (e) {
            datesByMonthArray = Array.isArray(datesByMonth) ? datesByMonth : [];
          }
        } else if (Array.isArray(datesByMonth)) {
          datesByMonthArray = datesByMonth;
        }
      }
      tour.datesByMonth = datesByMonthArray;
    }

    if (importantInfo !== undefined) {
      let importantInfoObj = {};
      if (importantInfo) {
        if (typeof importantInfo === 'string') {
          try {
            importantInfoObj = JSON.parse(importantInfo);
          } catch (e) {
            importantInfoObj = typeof importantInfo === 'object' ? importantInfo : {};
          }
        } else if (typeof importantInfo === 'object') {
          importantInfoObj = importantInfo;
        }
      }
      tour.importantInfo = importantInfoObj;
    }

    if (faq !== undefined) {
      let faqArray = [];
      if (faq) {
        if (typeof faq === 'string') {
          try {
            faqArray = JSON.parse(faq);
          } catch (e) {
            faqArray = Array.isArray(faq) ? faq : [];
          }
        } else if (Array.isArray(faq)) {
          faqArray = faq;
        }
      }
      tour.faq = faqArray;
    }

    if (pricesByDay !== undefined) {
      let pricesByDayArray = [];
      if (pricesByDay) {
        if (typeof pricesByDay === 'string') {
          try {
            pricesByDayArray = JSON.parse(pricesByDay);
          } catch (e) {
            pricesByDayArray = Array.isArray(pricesByDay) ? pricesByDay : [];
          }
        } else if (Array.isArray(pricesByDay)) {
          pricesByDayArray = pricesByDay;
        }
      }
      tour.pricesByDay = pricesByDayArray;
    }

    // Обрабатываем загруженное изображение header
    if (req.file) {
      // Удаляем старое изображение если оно существует
      if (tour.headerImage) {
        const oldImagePath = path.join(__dirname, '../../public', tour.headerImage);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (err) {
            console.error('Ошибка при удалении старого изображения:', err);
          }
        }
      }
      tour.headerImage = `/static/images/tours/${req.file.filename}`;
    }

    if (price !== undefined) {
      // Обрабатываем price: если пустая строка или не число, то null
      if (price === null || price === '') {
        tour.price = null;
      } else {
        const parsedPrice = parseFloat(price);
        tour.price = !isNaN(parsedPrice) ? parsedPrice : null;
      }
    }
    
    tour.title = title !== undefined ? title : tour.title;
    tour.description = description !== undefined ? description : tour.description;
    tour.location = location !== undefined ? location : tour.location;
    tour.country = country !== undefined ? country : tour.country;
    tour.countryId = countryId !== undefined ? countryId : tour.countryId;
    tour.duration = duration !== undefined ? duration : tour.duration;
    tour.daysCount = daysCount !== undefined ? daysCount : tour.daysCount;
    // tour.price уже обработан выше (строки 336-344)
    tour.slug = slug !== undefined ? slug : tour.slug;
    tour.subtitle = subtitle !== undefined ? subtitle : tour.subtitle;
    tour.tourTypeId = tourTypeId !== undefined ? tourTypeId : tour.tourTypeId;
    tour.isActive = isActive !== undefined ? isActive : tour.isActive;
    
    await tour.save();

    const tourWithRelations = await Tour.findByPk(tour.id, {
      include: [
        { model: TourType, as: 'tourType' },
        { model: TourImage, as: 'images', order: [['order', 'ASC']] },
        { model: Country, as: 'countryData' }
      ]
    });

    res.json(tourWithRelations);
  } catch (error) {
    console.error('Ошибка при обновлении тура:', error);
    res.status(500).json({ error: 'Ошибка при обновлении тура' });
  }
});

// Удалить тур
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id);
    
    if (!tour) {
      return res.status(404).json({ error: 'Тур не найден' });
    }

    await tour.destroy();
    res.json({ success: true, message: 'Тур удален' });
  } catch (error) {
    console.error('Ошибка при удалении тура:', error);
    res.status(500).json({ error: 'Ошибка при удалении тура' });
  }
});

module.exports = router;

