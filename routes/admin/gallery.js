const express = require('express');
const router = express.Router();
const { GalleryImage, Country } = require('../../models');
const { requireAuth } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Создаем папку в public/static/images/gallery (для публичного доступа)
    const uploadPath = path.join(__dirname, '../../public/static/images/gallery');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|heic|heif)$/i;
    const extname = allowedExtensions.test(file.originalname);
    
    // Проверяем расширение файла
    if (!extname) {
      return cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif, webp, heic, heif)'));
    }
    
    // Для HEIC/HEIF файлов разрешаем любые MIME типы (многие браузеры отправляют application/octet-stream)
    const isHeic = /\.(heic|heif)$/i.test(file.originalname);
    if (isHeic) {
      return cb(null, true);
    }
    
    // Для остальных форматов проверяем MIME тип
    const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp)$/i;
    const mimetype = allowedMimeTypes.test(file.mimetype) || file.mimetype.startsWith('image/');
    
    if (mimetype) {
      return cb(null, true);
    } else {
      // Если расширение правильное, но MIME тип не распознан, все равно разрешаем
      return cb(null, true);
    }
  }
});

// Получить все изображения галереи
router.get('/', requireAuth, async (req, res) => {
  try {
    const images = await GalleryImage.findAll({
      include: [
        { model: Country, as: 'countryData' }
      ],
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(images);
  } catch (error) {
    console.error('Ошибка при получении изображений галереи:', error);
    res.status(500).json({ error: 'Ошибка при получении изображений галереи' });
  }
});

// Получить одно изображение
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const image = await GalleryImage.findByPk(req.params.id, {
      include: [
        { model: Country, as: 'countryData' }
      ]
    });
    
    if (!image) {
      return res.status(404).json({ error: 'Изображение не найдено' });
    }
    
    res.json(image);
  } catch (error) {
    console.error('Ошибка при получении изображения:', error);
    res.status(500).json({ error: 'Ошибка при получении изображения' });
  }
});

// Загрузить одно или несколько изображений в галерею
router.post('/', requireAuth, upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      // Поддержка старого формата (одно изображение)
      if (req.file) {
        req.files = [req.file];
      } else {
        return res.status(400).json({ error: 'Файлы не загружены' });
      }
    }

    const uploadedImages = [];
    const MAX_GALLERY_IMAGES = 100; // Максимальное количество фото в галерее

    // Загружаем все файлы
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imagePath = `/static/images/gallery/${file.filename}`;

      const image = await GalleryImage.create({
        imagePath: imagePath,
        title: null,
        description: null,
        country: null,
        countryId: null,
        order: i
      });

      uploadedImages.push(image);
    }

    // Проверяем общее количество фото в галерее
    const totalImages = await GalleryImage.count();
    
    // Если фото больше лимита, удаляем самые старые
    if (totalImages > MAX_GALLERY_IMAGES) {
      const imagesToDelete = totalImages - MAX_GALLERY_IMAGES;
      
      // Находим самые старые фото (по дате создания)
      const oldestImages = await GalleryImage.findAll({
        order: [['createdAt', 'ASC']],
        limit: imagesToDelete
      });

      // Удаляем файлы и записи из базы данных
      for (const image of oldestImages) {
        try {
          // Удаляем физический файл
          // Проверяем оба пути (старый и новый)
          const filePathPublic = path.join(__dirname, '../../public/static/images/gallery', path.basename(image.imagePath));
          const filePathStatic = path.join(__dirname, '../../static/images/gallery', path.basename(image.imagePath));
          const filePath = fs.existsSync(filePathPublic) ? filePathPublic : filePathStatic;
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          
          // Удаляем запись из базы данных
          await image.destroy();
        } catch (deleteError) {
          console.error('Ошибка при удалении старого фото:', deleteError);
          // Продолжаем удаление остальных, даже если одно не удалилось
        }
      }
      
      console.log(`Удалено ${oldestImages.length} старых фото из галереи (лимит: ${MAX_GALLERY_IMAGES})`);
    }

    res.status(201).json({
      success: true,
      count: uploadedImages.length,
      images: uploadedImages,
      totalImages: await GalleryImage.count()
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

// Обновить изображение
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, country, countryId, order } = req.body;
    const image = await GalleryImage.findByPk(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Изображение не найдено' });
    }

    image.title = title !== undefined ? title : image.title;
    image.description = description !== undefined ? description : image.description;
    image.country = country !== undefined ? country : image.country;
    image.countryId = countryId !== undefined ? countryId : image.countryId;
    image.order = order !== undefined ? order : image.order;
    
    await image.save();

    res.json(image);
  } catch (error) {
    console.error('Ошибка при обновлении изображения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении изображения' });
  }
});

// Удалить изображение
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const image = await GalleryImage.findByPk(req.params.id);
    
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

module.exports = router;

