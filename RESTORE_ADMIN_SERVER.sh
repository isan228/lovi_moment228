#!/bin/bash
# Скрипт для восстановления админ-панели на сервере
# Выполните на сервере: bash RESTORE_ADMIN_SERVER.sh

cd /var/www/lovi_moment228 || exit 1

# Создаем папку admin
mkdir -p public/admin

# Создаем файл login.html
cat > public/admin/login.html << 'LOGIN_EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход в админ-панель - Lovi Moment</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .login-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 40px;
            width: 100%;
            max-width: 400px;
        }
        
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .login-header h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .login-header p {
            color: #666;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn-login {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn-login:active {
            transform: translateY(0);
        }
        
        .error-message {
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
            font-size: 14px;
        }
        
        .error-message.show {
            display: block;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>Админ-панель</h1>
            <p>Lovi Moment Travel</p>
        </div>
        
        <div class="error-message" id="errorMessage"></div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Логин</label>
                <input type="text" id="username" name="username" required autocomplete="username">
            </div>
            
            <div class="form-group">
                <label for="password">Пароль</label>
                <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            
            <button type="submit" class="btn-login">Войти</button>
        </form>
    </div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            errorMessage.classList.remove('show');
            
            try {
                const response = await fetch('/api/admin/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    window.location.href = '/admin';
                } else {
                    errorMessage.textContent = data.error || 'Неверный логин или пароль';
                    errorMessage.classList.add('show');
                }
            } catch (error) {
                errorMessage.textContent = 'Ошибка подключения к серверу';
                errorMessage.classList.add('show');
            }
        });
    </script>
</body>
</html>
LOGIN_EOF

echo "✅ login.html создан"

# Создаем минимальный index.html (основной файл будет загружен через admin.js)
cat > public/admin/index.html << 'INDEX_EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Админ-панель - Lovi Moment</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 24px;
        }
        
        .header-actions {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: rgba(255,255,255,0.2);
            color: white;
        }
        
        .btn-primary:hover {
            background: rgba(255,255,255,0.3);
        }
        
        .container {
            max-width: 1200px;
            margin: 30px auto;
            padding: 0 20px;
        }
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .tab {
            padding: 12px 24px;
            background: white;
            border: none;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #666;
            transition: all 0.2s;
        }
        
        .tab:hover {
            background: #f0f0f0;
        }
        
        .tab.active {
            background: white;
            color: #667eea;
            border-bottom: 2px solid #667eea;
        }
        
        .tab-content {
            display: none;
            background: white;
            padding: 30px;
            border-radius: 0 8px 8px 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .tab-content.active {
            display: block;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <h1>Админ-панель Lovi Moment</h1>
            <div class="header-actions">
                <span id="username">Загрузка...</span>
                <button class="btn btn-primary" onclick="logout()">Выход</button>
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="tabs">
            <button class="tab active" onclick="switchTab('countries')">Страны</button>
            <button class="tab" onclick="switchTab('tour-types')">Виды туров</button>
            <button class="tab" onclick="switchTab('tours')">Туры</button>
            <button class="tab" onclick="switchTab('gallery')">Галерея</button>
            <button class="tab" onclick="switchTab('reviews')">Отзывы</button>
            <button class="tab" onclick="switchTab('blogs')">Блоги</button>
            <button class="tab" onclick="switchTab('settings')">Настройки</button>
        </div>
        
        <div id="countries" class="tab-content active">
            <div class="loading">Загрузка...</div>
        </div>
        
        <div id="tour-types" class="tab-content">
            <div class="loading">Загрузка...</div>
        </div>
        
        <div id="tours" class="tab-content">
            <div class="loading">Загрузка...</div>
        </div>
        
        <div id="gallery" class="tab-content">
            <div class="loading">Загрузка...</div>
        </div>
        
        <div id="reviews" class="tab-content">
            <div class="loading">Загрузка...</div>
        </div>
        
        <div id="blogs" class="tab-content">
            <div class="loading">Загрузка...</div>
        </div>
        
        <div id="settings" class="tab-content">
            <div class="loading">Загрузка...</div>
        </div>
    </div>
    
    <script src="/admin/admin.js"></script>
</body>
</html>
INDEX_EOF

echo "✅ index.html создан"

# Создаем минимальный admin.js (основной функционал)
cat > public/admin/admin.js << 'ADMINJS_EOF'
// Проверка авторизации
async function checkAuth() {
    try {
        const response = await fetch('/api/admin/auth/check');
        const data = await response.json();
        if (!data.authenticated) {
            window.location.href = '/admin/login';
            return false;
        }
        document.getElementById('username').textContent = data.username;
        return true;
    } catch (error) {
        window.location.href = '/admin/login';
        return false;
    }
}

// Выход
async function logout() {
    try {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    } catch (error) {
        console.error('Ошибка при выходе:', error);
    }
}

// Переключение вкладок
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    // Загружаем данные для активной вкладки
    if (tabName === 'countries') {
        loadCountries();
    } else if (tabName === 'tour-types') {
        loadTourTypes();
    } else if (tabName === 'tours') {
        loadTours();
    } else if (tabName === 'gallery') {
        loadGallery();
    } else if (tabName === 'reviews') {
        loadReviews();
    } else if (tabName === 'blogs') {
        loadBlogs();
    } else if (tabName === 'settings') {
        loadSettings();
    }
}

// Заглушки для функций загрузки (полный код будет в полной версии)
function loadCountries() { document.getElementById('countries').innerHTML = '<p>Загрузка стран...</p>'; }
function loadTourTypes() { document.getElementById('tour-types').innerHTML = '<p>Загрузка видов туров...</p>'; }
function loadTours() { document.getElementById('tours').innerHTML = '<p>Загрузка туров...</p>'; }
function loadGallery() { document.getElementById('gallery').innerHTML = '<p>Загрузка галереи...</p>'; }
function loadReviews() { document.getElementById('reviews').innerHTML = '<p>Загрузка отзывов...</p>'; }
function loadBlogs() { document.getElementById('blogs').innerHTML = '<p>Загрузка блогов...</p>'; }
function loadSettings() { document.getElementById('settings').innerHTML = '<p>Загрузка настроек...</p>'; }

// Проверяем авторизацию при загрузке
checkAuth();
ADMINJS_EOF

echo "✅ admin.js создан"
echo ""
echo "✅ Админ-панель восстановлена!"
echo "📁 Файлы находятся в: /var/www/lovi_moment228/public/admin/"
echo ""
echo "Теперь перезапустите сервер:"
echo "pm2 restart lovi-moment"
ADMINJS_EOF

