const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Review } = require('../../models');
const { requireAuth } = require('../../middleware/auth');

// Настройка Multer для загрузки изображений отзывов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../static/images/reviews');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    const allowedMimeTypes = /^image\/(jpg|jpeg|png|gif|webp)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname));
    const mimetype = allowedMimeTypes.test(file.mimetype);
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены! (JPG, PNG, GIF, WEBP)'));
    }
  }
});

// Получить все отзывы
router.get('/', requireAuth, async (req, res) => {
  try {
    const reviews = await Review.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(reviews);
  } catch (error) {
    console.error('Ошибка при получении отзывов:', error);
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
  }
});

// Получить один отзыв
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }
    res.json(review);
  } catch (error) {
    console.error('Ошибка при получении отзыва:', error);
    res.status(500).json({ error: 'Ошибка при получении отзыва' });
  }
});

// Максимальное количество отзывов
const MAX_REVIEWS = 40;

// Создать отзыв
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { nickname, content, instagramLink, isActive, order } = req.body;
    
    if (!nickname || !content) {
      return res.status(400).json({ error: 'Никнейм и содержимое обязательны' });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/static/images/reviews/${req.file.filename}`;
    }

    // Проверяем количество отзывов
    const totalReviews = await Review.count();
    
    // Если достигнут лимит, удаляем самые старые отзывы
    if (totalReviews >= MAX_REVIEWS) {
      const reviewsToDelete = await Review.findAll({
        order: [['createdAt', 'ASC']],
        limit: totalReviews - MAX_REVIEWS + 1
      });
      
      for (const review of reviewsToDelete) {
        // Удаляем изображение, если оно существует
        if (review.imagePath) {
          const imageFilePath = path.join(__dirname, '../../', review.imagePath);
          if (fs.existsSync(imageFilePath)) {
            try {
              fs.unlinkSync(imageFilePath);
            } catch (err) {
              console.error('Ошибка при удалении изображения отзыва:', err);
            }
          }
        }
        await review.destroy();
      }
    }

    const review = await Review.create({
      nickname,
      content,
      instagramLink: instagramLink || null,
      imagePath: imagePath,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0
    });
    res.status(201).json(review);
  } catch (error) {
    console.error('Ошибка при создании отзыва:', error);
    res.status(500).json({ error: 'Ошибка при создании отзыва' });
  }
});

// Обновить отзыв
router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { nickname, content, instagramLink, isActive, order } = req.body;
    const review = await Review.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    if (nickname !== undefined) review.nickname = nickname;
    if (content !== undefined) review.content = content;
    if (instagramLink !== undefined) review.instagramLink = instagramLink || null;
    if (isActive !== undefined) review.isActive = isActive;
    if (order !== undefined) review.order = order;
    
    // Если загружено новое изображение, обновляем путь и удаляем старое
    if (req.file) {
      // Удаляем старое изображение, если оно существует
      if (review.imagePath) {
        const oldImagePath = path.join(__dirname, '../../', review.imagePath);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (err) {
            console.error('Ошибка при удалении старого изображения:', err);
          }
        }
      }
      review.imagePath = `/static/images/reviews/${req.file.filename}`;
    }
    
    await review.save();

    res.json(review);
  } catch (error) {
    console.error('Ошибка при обновлении отзыва:', error);
    res.status(500).json({ error: 'Ошибка при обновлении отзыва' });
  }
});

// Удалить отзыв
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    // Удаляем изображение, если оно существует
    if (review.imagePath) {
      const imagePath = path.join(__dirname, '../../', review.imagePath);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error('Ошибка при удалении изображения отзыва:', err);
        }
      }
    }

    await review.destroy();
    res.json({ success: true, message: 'Отзыв удален' });
  } catch (error) {
    console.error('Ошибка при удалении отзыва:', error);
    res.status(500).json({ error: 'Ошибка при удалении отзыва' });
  }
});

module.exports = router;

