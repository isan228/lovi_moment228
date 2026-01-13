const express = require('express');
const router = express.Router();
const { Tour, TourType, TourImage, Country } = require('../../models');
const { requireAuth } = require('../../middleware/auth');

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
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      title, description, location, country, countryId, duration, daysCount, program, 
      price, priceWednesday, priceFriday, slug, headerImage, subtitle, 
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

    const tour = await Tour.create({
      title,
      description,
      location,
      country,
      countryId: countryId || null,
      duration,
      daysCount: daysCount || 1,
      program: programArray,
      price,
      priceWednesday,
      priceFriday,
      slug: slug || null,
      headerImage: headerImage || null,
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
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { 
      title, description, location, country, countryId, duration, daysCount, program, 
      price, priceWednesday, priceFriday, slug, headerImage, subtitle, 
      datesByMonth, importantInfo, faq, tourTypeId, isActive 
    } = req.body;
    const tour = await Tour.findByPk(req.params.id);
    
    if (!tour) {
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

    tour.title = title !== undefined ? title : tour.title;
    tour.description = description !== undefined ? description : tour.description;
    tour.location = location !== undefined ? location : tour.location;
    tour.country = country !== undefined ? country : tour.country;
    tour.countryId = countryId !== undefined ? countryId : tour.countryId;
    tour.duration = duration !== undefined ? duration : tour.duration;
    tour.daysCount = daysCount !== undefined ? daysCount : tour.daysCount;
    tour.price = price !== undefined ? price : tour.price;
    tour.priceWednesday = priceWednesday !== undefined ? priceWednesday : tour.priceWednesday;
    tour.priceFriday = priceFriday !== undefined ? priceFriday : tour.priceFriday;
    tour.slug = slug !== undefined ? slug : tour.slug;
    tour.headerImage = headerImage !== undefined ? headerImage : tour.headerImage;
    tour.subtitle = subtitle !== undefined ? subtitle : tour.subtitle;
    tour.tourTypeId = tourTypeId !== undefined ? tourTypeId : tour.tourTypeId;
    tour.isActive = isActive !== undefined ? isActive : tour.isActive;
    
    await tour.save();

    const tourWithRelations = await Tour.findByPk(tour.id, {
      include: [
        { model: TourType, as: 'tourType' },
        { model: TourImage, as: 'images', order: [['order', 'ASC']] },
        { model: Country, as: 'country' }
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

