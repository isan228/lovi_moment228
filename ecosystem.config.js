// PM2 конфигурация для Lovi Moment
module.exports = {
  apps: [{
    name: 'lovi-moment',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'public'],
    // Автоматический перезапуск при изменении файлов (только для разработки)
    // watch: ['server.js', 'routes', 'models', 'config'],
    // Перезапуск при изменении файлов с задержкой
    // watch_delay: 1000,
    // Минимальное время между перезапусками (в мс)
    min_uptime: '10s',
    // Максимальное количество перезапусков за период
    max_restarts: 10,
    // Время ожидания перед принудительным завершением (в мс)
    kill_timeout: 5000
  }]
};


