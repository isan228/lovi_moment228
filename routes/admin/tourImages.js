const express = require('express');
const router = express.Router();
const { Tour, TourImage } = require('../../models');
const { requireAuth } = require('../../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/static/images/tours');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tour-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Получить все изображения тура
router.get('/tour/:tourId', requireAuth, async (req, res) => {
  try {
    const images = await TourImage.findAll({
      where: { tourId: req.params.tourId },
      order: [['order', 'ASC']]
    });
    res.json(images);
  } catch (error) {
    console.error('Ошибка при получении изображений:', error);
    res.status(500).json({ error: 'Ошибка при получении изображений' });
  }
});

// Загрузить одно или несколько изображений для тура
router.post('/tour/:tourId', requireAuth, upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      // Поддержка старого формата (одно изображение)
      if (req.file) {
        req.files = [req.file];
      } else {
        return res.status(400).json({ error: 'Файлы не загружены' });
      }
    }

    const tour = await Tour.findByPk(req.params.tourId);
    if (!tour) {
      // Удаляем загруженные файлы, если тур не найден
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ error: 'Тур не найден' });
    }

    const { isMain, order } = req.body;
    const uploadedImages = [];

    // Если это главное изображение, снимаем флаг с других
    if (isMain === 'true' || isMain === true) {
      await TourImage.update(
        { isMain: false },
        { where: { tourId: req.params.tourId } }
      );
    }

    // Загружаем все файлы
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imagePath = `/static/images/tours/${file.filename}`;
      
      const image = await TourImage.create({
        tourId: req.params.tourId,
        imagePath: imagePath,
        isMain: (isMain === 'true' || isMain === true) && i === 0, // Первое изображение - главное, если указано
        order: (order || 0) + i
      });

      uploadedImages.push(image);
    }

    res.status(201).json({
      success: true,
      count: uploadedImages.length,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Ошибка при загрузке изображений:', error);
    // Удаляем все загруженные файлы при ошибке
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.error('Ошибка при удалении файла:', e);
          }
        }
      });
    }
    res.status(500).json({ error: 'Ошибка при загрузке изображений' });
  }
});

// Удалить изображение
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const image = await TourImage.findByPk(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Изображение не найдено' });
    }

    // Удаляем файл
    const filePath = path.join(__dirname, '../../public', image.imagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await image.destroy();
    res.json({ success: true, message: 'Изображение удалено' });
  } catch (error) {
    console.error('Ошибка при удалении изображения:', error);
    res.status(500).json({ error: 'Ошибка при удалении изображения' });
  }
});

// Обновить изображение (порядок, главное)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { isMain, order } = req.body;
    const image = await TourImage.findByPk(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Изображение не найдено' });
    }

    // Если делаем главным, снимаем флаг с других
    if (isMain === true || isMain === 'true') {
      await TourImage.update(
        { isMain: false },
        { where: { tourId: image.tourId, id: { [Op.ne]: image.id } } }
      );
    }

    image.isMain = isMain !== undefined ? (isMain === true || isMain === 'true') : image.isMain;
    image.order = order !== undefined ? order : image.order;
    await image.save();

    res.json(image);
  } catch (error) {
    console.error('Ошибка при обновлении изображения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении изображения' });
  }
});

module.exports = router;

