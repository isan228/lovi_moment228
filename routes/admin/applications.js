const express = require('express');
const router = express.Router();
const { TourApplication, Tour } = require('../../models');
const { requireAuth } = require('../../middleware/auth');

// Получить все заявки
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const { count, rows } = await TourApplication.findAndCountAll({
      where,
      include: [
        { model: Tour, as: 'tour', attributes: ['id', 'title', 'slug'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      applications: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Ошибка при получении заявок:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// Получить одну заявку
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const application = await TourApplication.findByPk(req.params.id, {
      include: [
        { model: Tour, as: 'tour', attributes: ['id', 'title', 'slug'] }
      ]
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Ошибка при получении заявки:', error);
    res.status(500).json({ error: 'Ошибка при получении заявки' });
  }
});

// Обновить статус заявки
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const application = await TourApplication.findByPk(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    
    if (status) {
      application.status = status;
    }
    if (notes !== undefined) {
      application.notes = notes;
    }
    
    await application.save();
    
    res.json(application);
  } catch (error) {
    console.error('Ошибка при обновлении заявки:', error);
    res.status(500).json({ error: 'Ошибка при обновлении заявки' });
  }
});

// Удалить заявку
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const application = await TourApplication.findByPk(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    
    await application.destroy();
    
    res.json({ message: 'Заявка удалена' });
  } catch (error) {
    console.error('Ошибка при удалении заявки:', error);
    res.status(500).json({ error: 'Ошибка при удалении заявки' });
  }
});

// Получить статистику заявок
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const total = await TourApplication.count();
    const newCount = await TourApplication.count({ where: { status: 'new' } });
    const contactedCount = await TourApplication.count({ where: { status: 'contacted' } });
    const confirmedCount = await TourApplication.count({ where: { status: 'confirmed' } });
    const cancelledCount = await TourApplication.count({ where: { status: 'cancelled' } });
    
    // Статистика по дням (последние 30 дней)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCount = await TourApplication.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    res.json({
      total,
      new: newCount,
      contacted: contactedCount,
      confirmed: confirmedCount,
      cancelled: cancelledCount,
      recent: recentCount
    });
  } catch (error) {
    console.error('Ошибка при получении статистики заявок:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

module.exports = router;

