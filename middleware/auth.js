// Middleware для проверки авторизации
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Если это API запрос, возвращаем JSON
  if (req.path.startsWith('/api/admin')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  // Иначе перенаправляем на страницу логина
  return res.redirect('/admin/login');
}

// Middleware для проверки, что пользователь уже авторизован (для страницы логина)
function requireGuest(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/admin');
  }
  return next();
}

module.exports = { requireAuth, requireGuest };









