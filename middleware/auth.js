// Middleware для проверки авторизации
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Если это API запрос (POST, PUT, DELETE или путь содержит /auth, /tours, /countries и т.д.), возвращаем JSON
  const isApiRequest = req.method !== 'GET' || 
    req.path.startsWith('/api/admin/auth') || 
    req.path.startsWith('/api/admin/countries') ||
    req.path.startsWith('/api/admin/tour-types') ||
    req.path.startsWith('/api/admin/tours') ||
    req.path.startsWith('/api/admin/tour-images') ||
    req.path.startsWith('/api/admin/gallery') ||
    req.path.startsWith('/api/admin/settings') ||
    req.path.startsWith('/api/admin/reviews') ||
    req.path.startsWith('/api/admin/blogs') ||
    req.path.startsWith('/admin/auth') || 
    req.path.startsWith('/admin/countries') ||
    req.path.startsWith('/admin/tour-types') ||
    req.path.startsWith('/admin/tours') ||
    req.path.startsWith('/admin/tour-images') ||
    req.path.startsWith('/admin/gallery') ||
    req.path.startsWith('/admin/settings') ||
    req.path.startsWith('/admin/reviews') ||
    req.path.startsWith('/admin/blogs');
  
  if (isApiRequest) {
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









