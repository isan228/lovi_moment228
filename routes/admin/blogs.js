const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Blog } = require('../../models');
const { requireAuth } = require('../../middleware/auth');
const { Op } = require('sequelize');

// Функция для создания slug из заголовка
function createSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Настройка Multer для загрузки изображений блогов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../static/images/blogs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
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

// Получить все блоги
router.get('/', requireAuth, async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(blogs);
  } catch (error) {
    console.error('Ошибка при получении блогов:', error);
    res.status(500).json({ error: 'Ошибка при получении блогов' });
  }
});

// Получить один блог
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Блог не найден' });
    }
    res.json(blog);
  } catch (error) {
    console.error('Ошибка при получении блога:', error);
    res.status(500).json({ error: 'Ошибка при получении блога' });
  }
});

// Создать блог
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, content, isActive, order } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Заголовок и содержимое обязательны' });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/static/images/blogs/${req.file.filename}`;
    }

    // Создаем slug из заголовка
    let slug = createSlug(title);
    
    // Проверяем уникальность slug
    let slugExists = await Blog.findOne({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = createSlug(title) + '-' + counter;
      slugExists = await Blog.findOne({ where: { slug } });
      counter++;
    }

    const blog = await Blog.create({
      title,
      content,
      imagePath: imagePath,
      slug,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0
    });
    res.status(201).json(blog);
  } catch (error) {
    console.error('Ошибка при создании блога:', error);
    res.status(500).json({ error: 'Ошибка при создании блога' });
  }
});

// Обновить блог
router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Блог не найден' });
    }

    const { title, content, isActive, order } = req.body;

    // Обновляем slug, если изменился заголовок
    let slug = blog.slug;
    if (title && title !== blog.title) {
      slug = createSlug(title);
      // Проверяем уникальность slug
      const { Op } = require('sequelize');
      let slugExists = await Blog.findOne({ where: { slug, id: { [Op.ne]: blog.id } } });
      let counter = 1;
      while (slugExists) {
        slug = createSlug(title) + '-' + counter;
        slugExists = await Blog.findOne({ where: { slug, id: { [Op.ne]: blog.id } } });
        counter++;
      }
    }

    // Удаляем старое изображение, если загружено новое
    if (req.file && blog.imagePath) {
      const oldImagePath = path.join(__dirname, '../../', blog.imagePath);
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (err) {
          console.error('Ошибка при удалении старого изображения:', err);
        }
      }
    }

    const updateData = {
      title: title || blog.title,
      content: content || blog.content,
      slug,
      isActive: isActive !== undefined ? isActive : blog.isActive,
      order: order !== undefined ? order : blog.order
    };

    if (req.file) {
      updateData.imagePath = `/static/images/blogs/${req.file.filename}`;
    }

    await blog.update(updateData);
    res.json(blog);
  } catch (error) {
    console.error('Ошибка при обновлении блога:', error);
    res.status(500).json({ error: 'Ошибка при обновлении блога' });
  }
});

// Удалить блог
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Блог не найден' });
    }

    // Удаляем изображение, если оно существует
    if (blog.imagePath) {
      const imageFilePath = path.join(__dirname, '../../', blog.imagePath);
      if (fs.existsSync(imageFilePath)) {
        try {
          fs.unlinkSync(imageFilePath);
        } catch (err) {
          console.error('Ошибка при удалении изображения блога:', err);
        }
      }
    }

    await blog.destroy();
    res.json({ message: 'Блог удален' });
  } catch (error) {
    console.error('Ошибка при удалении блога:', error);
    res.status(500).json({ error: 'Ошибка при удалении блога' });
  }
});

module.exports = router;

