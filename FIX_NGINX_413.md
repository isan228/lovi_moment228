# Исправление ошибки 413 (Request Entity Too Large)

## Проблема

При загрузке файлов через админку появляется ошибка:
```
413 Request Entity Too Large
```

Это происходит потому, что Nginx по умолчанию ограничивает размер загружаемых файлов до 1MB.

## Решение

Нужно добавить директиву `client_max_body_size` в конфигурацию Nginx.

### 1. Найдите файл конфигурации Nginx

Обычно это:
- `/etc/nginx/sites-available/lovi-moment` или
- `/etc/nginx/conf.d/lovi-moment.conf` или
- `/etc/nginx/nginx.conf`

### 2. Добавьте директиву в блок `server`

```nginx
server {
    listen 80;
    server_name lovimoment-travel.com;  # ваш домен
    
    # Увеличиваем лимит размера загружаемых файлов
    client_max_body_size 500M;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... остальные настройки
    }
}
```

### 3. Проверьте и перезагрузите Nginx

```bash
# Проверьте конфигурацию на ошибки
sudo nginx -t

# Если все ОК, перезагрузите Nginx
sudo systemctl reload nginx

# Или перезапустите
sudo systemctl restart nginx
```

### 4. Проверьте логи (если проблема остается)

```bash
sudo tail -f /var/log/nginx/error.log
```

## Альтернативное решение (если не можете изменить конфигурацию)

Можно добавить директиву в основной файл `nginx.conf`:

```bash
sudo nano /etc/nginx/nginx.conf
```

Добавьте в блок `http`:
```nginx
http {
    # ...
    client_max_body_size 500M;
    # ...
}
```

## Рекомендуемые значения

- **500M** - для загрузки видео и больших изображений
- **100M** - если загружаете только изображения
- **50M** - минимальное значение для большинства случаев

## Проверка после исправления

После перезагрузки Nginx попробуйте снова загрузить файл через админку. Ошибка 413 должна исчезнуть.

