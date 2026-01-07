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
    const { title, description, location, country, countryId, duration, daysCount, program, price, tourTypeId, isActive } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    // Парсим program если это строка
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
    const { title, description, location, country, countryId, duration, daysCount, program, price, tourTypeId, isActive } = req.body;
    const tour = await Tour.findByPk(req.params.id);
    
    if (!tour) {
      return res.status(404).json({ error: 'Тур не найден' });
    }

    // Парсим program если это строка
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

    tour.title = title || tour.title;
    tour.description = description !== undefined ? description : tour.description;
    tour.location = location !== undefined ? location : tour.location;
    tour.country = country !== undefined ? country : tour.country;
    tour.countryId = countryId !== undefined ? countryId : tour.countryId;
    tour.duration = duration !== undefined ? duration : tour.duration;
    tour.daysCount = daysCount !== undefined ? daysCount : tour.daysCount;
    tour.price = price !== undefined ? price : tour.price;
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

