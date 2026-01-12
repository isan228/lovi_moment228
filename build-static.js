const fs = require('fs');
const path = require('path');

// Маппинг URL имен на пути для статических файлов
const URL_MAPPING = {
  'home': 'index.html',
  'tour': 'tour/index.html',
  'tour_about': 'tour-about/index.html',
  'about_us': 'about/index.html',
  'reviews': 'reviews/index.html',
  'gallery': 'gallery/index.html',
  'blog': 'blog/index.html',
  'blog_about': 'blog-about/index.html',
  'partners': 'partners/index.html',
  'corp_tour': 'corp-tour/index.html',
  'indi_tour': 'indi-tour/index.html',
  'sign_tour': 'sign-tour/index.html',
  'kz': 'kz/index.html',
  'uz': 'uz/index.html',
  'gallery_kz': 'gallery-kz/index.html',
  'gallery_uz': 'gallery-uz/index.html',
  'tour_about_1': 'tour/about/1/index.html',
  'tour_about_2': 'tour/about/2/index.html',
  'tour_about_3': 'tour/about/3/index.html',
  'tour_about_4': 'tour/about/4/index.html',
  'tour_about_5': 'tour/about/5/index.html',
  'tour_about_6': 'tour/about/6/index.html',
  'tour_about_7': 'tour/about/7/index.html',
  'tour_about_8': 'tour/about/8/index.html',
  'tour_about_9': 'tour/about/9/index.html',
  'tour_about_10': 'tour/about/10/index.html',
  'tour_about_11': 'tour/about/11/index.html',
  'tour_about_12': 'tour/about/12/index.html',
  'blog_about1': 'blog_about1/index.html',
  'blog_about2': 'blog_about2/index.html',
  'blog_about3': 'blog_about3/index.html',
  'blog_about4': 'blog_about4/index.html',
  'blog_about5': 'blog_about5/index.html',
  'blog_about6': 'blog_about6/index.html',
  'blog_about7': 'blog_about7/index.html',
  'blog_about8': 'blog_about8/index.html',
  'tour_about_UZ1': 'tour_about_UZ1/index.html',
  'tour_about_UZ2': 'tour_about_UZ2/index.html'
};

// Маппинг шаблонов на URL имена
const TEMPLATE_TO_URL = {
  'home.html': 'home',
  'tour.html': 'tour',
  'tour_about.html': 'tour_about',
  'aboutUs.html': 'about_us',
  'reviews.html': 'reviews',
  'gallery.html': 'gallery',
  'blog.html': 'blog',
  'blog_about.html': 'blog_about',
  'partners.html': 'partners',
  'corp_tour.html': 'corp_tour',
  'indi_tour.html': 'indi_tour',
  'sign_tour.html': 'sign_tour',
  'kz.html': 'kz',
  'uz.html': 'uz',
  'galleryKZ.html': 'gallery_kz',
  'galleryUZ.html': 'gallery_uz',
  'tour_about1.html': 'tour_about_1',
  'tour_about2.html': 'tour_about_2',
  'tour_about3.html': 'tour_about_3',
  'tour_about4.html': 'tour_about_4',
  'tour_about5.html': 'tour_about_5',
  'tour_about6.html': 'tour_about_6',
  'tour_about7.html': 'tour_about_7',
  'tour_about8.html': 'tour_about_8',
  'tour_about9.html': 'tour_about_9',
  'tour_about10.html': 'tour_about_10',
  'tour_about11.html': 'tour_about_11',
  'tour_about12.html': 'tour_about_12',
  'blog_about1.html': 'blog_about1',
  'blog_about2.html': 'blog_about2',
  'blog_about3.html': 'blog_about3',
  'blog_about4.html': 'blog_about4',
  'blog_about5.html': 'blog_about5',
  'blog_about6.html': 'blog_about6',
  'blog_about7.html': 'blog_about7',
  'blog_about8.html': 'blog_about8',
  'tour_aboutUZ1.html': 'tour_about_UZ1',
  'tour_aboutUZ2.html': 'tour_about_UZ2'
};

// Функция для вычисления относительного пути к статическому файлу
function calculateStaticPath(currentPathStr, staticFile) {
  // Подсчитываем глубину (количество уровней вложенности)
  let depth = 0;
  if (currentPathStr !== 'index.html') {
    const dirPath = currentPathStr.replace('/index.html', '').replace('index.html', '');
    depth = dirPath ? dirPath.split('/').filter(p => p).length : 0;
  }

  if (depth === 0) {
    return `/static/${staticFile}`;
  } else {
    return '../'.repeat(depth) + `static/${staticFile}`;
  }
}

// Функция для замены {% static 'path' %} тегов
function replaceStaticTags(content, outputPathStr) {
  // Заменяем {% static 'path' %}
  content = content.replace(/\{\%\s*static\s+['"]([^'"]+)['"]\s*\%\}/g, (match, staticPath) => {
    // Нормализуем регистр пути (CSS -> css, но сохраняем оригинал)
    const normalizedPath = staticPath.replace(/^CSS\//i, 'css/').replace(/^JS\//i, 'js/');
    return calculateStaticPath(outputPathStr, normalizedPath);
  });

  // Заменяем /static/ пути на относительные (более точное регулярное выражение)
  // Обрабатываем пути в атрибутах src, href, style и т.д.
  content = content.replace(/["']\/static\/([^"'\s<>]+)["']/g, (match, staticFile) => {
    // Нормализуем регистр
    const normalizedFile = staticFile.replace(/^CSS\//i, 'css/').replace(/^JS\//i, 'js/');
    const newPath = calculateStaticPath(outputPathStr, normalizedFile);
    // Сохраняем кавычки
    return match[0] === '"' ? `"${newPath}"` : `'${newPath}'`;
  });
  
  // Также обрабатываем пути в style атрибутах
  content = content.replace(/url\(['"]?\/static\/([^"'\s<>)]+)['"]?\)/gi, (match, staticFile) => {
    const normalizedFile = staticFile.replace(/^CSS\//i, 'css/').replace(/^JS\//i, 'js/');
    const newPath = calculateStaticPath(outputPathStr, normalizedFile);
    return `url('${newPath}')`;
  });

  return content;
}

// Функция для замены {% url 'name' %} тегов
function replaceUrlTags(content, outputPathStr) {
  // Заменяем {% url 'name' %}
  content = content.replace(/\{\%\s*url\s+['"]([^'"]+)['"]\s*\%\}/g, (match, urlName) => {
    // Специальная обработка для API endpoint
    if (urlName === 'submit_application') {
      return '/submit-application';
    }
    
    if (URL_MAPPING[urlName]) {
      const targetPath = URL_MAPPING[urlName];
      const targetDir = targetPath.replace('/index.html', '').replace('index.html', '');

      // Вычисляем относительный путь
      let depth = 0;
      if (outputPathStr !== 'index.html') {
        const currentDir = outputPathStr.replace('/index.html', '').replace('index.html', '');
        depth = currentDir ? currentDir.split('/').filter(p => p).length : 0;
      }

      if (depth === 0) {
        return targetDir ? `/${targetDir}/` : '/';
      } else {
        const upLevels = '../'.repeat(depth);
        return upLevels + (targetDir ? `${targetDir}/` : '');
      }
    }
    return '#';
  });

  return content;
}

// Функция для очистки Django тегов
function cleanDjangoTags(content) {
  // Удаляем {% load static %}
  content = content.replace(/\{\%\s*load\s+static\s*\%\}/g, '');
  
  // Удаляем {% csrf_token %}
  content = content.replace(/\{\%\s*csrf_token\s*\%\}/g, '');

  return content;
}

// Функция для обработки одного шаблона
function processTemplate(templatePath, outputPath, baseDir) {
  const outputPathStr = path.relative(baseDir, outputPath).replace(/\\/g, '/');
  
  console.log(`Обрабатываю: ${path.basename(templatePath)} -> ${outputPathStr}`);

  // Читаем шаблон
  let content = fs.readFileSync(templatePath, 'utf-8');

  // Заменяем теги
  content = replaceStaticTags(content, outputPathStr);
  content = replaceUrlTags(content, outputPathStr);
  content = cleanDjangoTags(content);

  // Создаем директорию если нужно
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Сохраняем обработанный HTML
  fs.writeFileSync(outputPath, content, 'utf-8');
}

// Функция для рекурсивного копирования
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    // Нормализуем регистр: CSS -> css, JS -> js, но сохраняем оригинал тоже
    const normalizedName = entry.name.toLowerCase();
    const destPath = path.join(dest, normalizedName);
    const originalDestPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Копируем с нормализованным именем
      copyRecursive(srcPath, destPath);
      // Если имя отличается, создаем также копию с оригинальным именем
      if (entry.name !== normalizedName) {
        copyRecursive(srcPath, originalDestPath);
      }
    } else {
      // Копируем файл с нормализованным именем
      fs.copyFileSync(srcPath, destPath);
      // Если имя отличается, создаем также копию с оригинальным именем
      if (entry.name !== normalizedName) {
        fs.copyFileSync(srcPath, originalDestPath);
      }
      // Также создаем копию с разными расширениями для видео (mp4/MP4)
      if (entry.name.toLowerCase().endsWith('.mp4')) {
        const upperExt = entry.name.replace(/\.mp4$/i, '.MP4');
        const lowerExt = entry.name.replace(/\.MP4$/i, '.mp4');
        if (upperExt !== entry.name) {
          fs.copyFileSync(srcPath, path.join(dest, upperExt));
        }
        if (lowerExt !== entry.name && lowerExt !== upperExt) {
          fs.copyFileSync(srcPath, path.join(dest, lowerExt));
        }
      }
    }
  }
}

// Главная функция
function main() {
  const BASE_DIR = __dirname;
  const TEMPLATES_DIR = path.join(BASE_DIR, 'main', 'templates');
  const STATIC_DIR = path.join(BASE_DIR, 'static');
  const OUTPUT_DIR = path.join(BASE_DIR, 'public');

  // НОВЫЙ ПОДХОД: Не удаляем всю папку public, а удаляем только файлы, сгенерированные из шаблонов
  // Это сохраняет все загруженные файлы и админ-панель
  
  // Список папок/файлов, которые генерируются из шаблонов (их можно безопасно удалить)
  const generatedPaths = Object.values(URL_MAPPING).map(path => {
    // Преобразуем 'tour/about/1/index.html' в 'tour/about/1'
    return path.replace('/index.html', '').replace('index.html', '');
  }).filter(p => p); // Убираем пустые строки
  
  // Уникальные папки верхнего уровня
  const topLevelDirs = [...new Set(generatedPaths.map(p => p.split('/')[0]))];
  
  console.log('🗑️  Удаляю только сгенерированные файлы...');
  
  if (fs.existsSync(OUTPUT_DIR)) {
    // Удаляем только папки, которые генерируются из шаблонов
    for (const dir of topLevelDirs) {
      const dirPath = path.join(OUTPUT_DIR, dir);
      if (fs.existsSync(dirPath) && dir !== 'admin' && dir !== 'static') {
        // Удаляем только если это не админ-панель и не статика
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
          console.log(`🗑️  Удалена папка: ${dir}`);
        } catch (err) {
          console.log(`⚠️  Не удалось удалить ${dir}: ${err.message}`);
        }
      }
    }
    
    // Удаляем index.html в корне (генерируется из home.html)
    const rootIndex = path.join(OUTPUT_DIR, 'index.html');
    if (fs.existsSync(rootIndex)) {
      fs.unlinkSync(rootIndex);
      console.log('🗑️  Удален index.html');
    }
    
    // Удаляем blog-detail.html если есть
    const blogDetail = path.join(OUTPUT_DIR, 'blog-detail.html');
    if (fs.existsSync(blogDetail)) {
      fs.unlinkSync(blogDetail);
      console.log('🗑️  Удален blog-detail.html');
    }
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // ВАЖНО: НЕ удаляем папки admin и static - они содержат важные файлы!
  console.log('✅ Сохранены: admin/, static/ и все загруженные файлы');

  // Копируем статические файлы (но не перезаписываем загруженные изображения)
  console.log('Копирую статические файлы...');
  const staticOutput = path.join(OUTPUT_DIR, 'static');

  if (fs.existsSync(STATIC_DIR)) {
    // Функция для копирования с сохранением существующих файлов в images/
    function copyStaticPreservingUploads(src, dest) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          // Если это папка images, копируем только файлы, которых нет в destination
          if (entry.name === 'images' && fs.existsSync(destPath)) {
            // Копируем только отсутствующие файлы/папки
            const destEntries = fs.readdirSync(destPath, { withFileTypes: true });
            const destNames = new Set(destEntries.map(e => e.name));
            
            const srcEntries = fs.readdirSync(srcPath, { withFileTypes: true });
            for (const srcEntry of srcEntries) {
              if (!destNames.has(srcEntry.name)) {
                // Копируем только если такой файл/папка отсутствует
                copyRecursive(path.join(srcPath, srcEntry.name), path.join(destPath, srcEntry.name));
              }
            }
          } else {
            // Для других папок копируем как обычно
            copyStaticPreservingUploads(srcPath, destPath);
          }
        } else {
          // Копируем файл только если его нет
          if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
    }
    
    copyStaticPreservingUploads(STATIC_DIR, staticOutput);
    console.log('✅ Статические файлы скопированы (загруженные файлы сохранены)');
  }

  // Обрабатываем шаблоны
  console.log('Обрабатываю шаблоны...');
  const templateFiles = fs.readdirSync(TEMPLATES_DIR);
  
  for (const templateFile of templateFiles) {
    if (!templateFile.endsWith('.html')) continue;
    
    const templateName = templateFile;
    
    if (TEMPLATE_TO_URL[templateName]) {
      const urlName = TEMPLATE_TO_URL[templateName];
      if (URL_MAPPING[urlName]) {
        const outputPath = path.join(OUTPUT_DIR, URL_MAPPING[urlName]);
        const templatePath = path.join(TEMPLATES_DIR, templateFile);
        processTemplate(templatePath, outputPath, OUTPUT_DIR);
      }
    } else {
      console.log(`Предупреждение: ${templateName} не найден в TEMPLATE_TO_URL`);
    }
  }

  console.log(`\n✅ Статические файлы сгенерированы в папке: ${OUTPUT_DIR}`);
  console.log('Теперь вы можете запустить сервер командой: npm start');
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { main };

