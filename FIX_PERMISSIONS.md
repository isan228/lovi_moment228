# Исправление прав доступа к статическим файлам

## Проблема

Если стили не загружаются, скорее всего проблема в правах доступа. Nginx и Node.js должны иметь возможность читать файлы в `public/static/`.

## Решение

Выполните на сервере:

```bash
cd /var/www/lovi_moment228

# Установите правильные права на папку public
sudo chmod -R 755 public/
sudo chown -R www-data:www-data public/static/

# Или если используется другой пользователь для Node.js:
sudo chown -R nodejs:nodejs public/static/

# Проверьте права
ls -la public/static/
ls -la public/static/css/
ls -la public/static/js/
```

## Проверка

После исправления прав проверьте:

```bash
# Проверьте, что файлы доступны для чтения
ls -la public/static/css/style.css
# Должно быть: -rw-r--r-- или -rw-rw-r--

# Проверьте, что директории доступны для чтения
ls -ld public/static/css/
# Должно быть: drwxr-xr-x или drwxrwxr-x
```

## Если проблема остается

1. Проверьте конфигурацию Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

2. Проверьте логи Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. Проверьте, что Node.js сервер раздает статические файлы:
```bash
# В server.js должна быть строка:
# app.use(express.static(path.join(__dirname, 'public')));
```

## Быстрое исправление (одна команда)

```bash
cd /var/www/lovi_moment228 && sudo chmod -R 755 public/ && sudo chown -R www-data:www-data public/static/
```

