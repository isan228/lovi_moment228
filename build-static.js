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

  // Очищаем папку public, но сохраняем важные файлы
  const backupPath = path.join(BASE_DIR, '.build_backup');
  const filesToPreserve = ['admin']; // Папки и файлы, которые нужно сохранить
  
  if (fs.existsSync(OUTPUT_DIR)) {
    // Сохраняем важные файлы перед очисткой
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
    fs.mkdirSync(backupPath, { recursive: true });
    
    for (const item of filesToPreserve) {
      const itemPath = path.join(OUTPUT_DIR, item);
      if (fs.existsSync(itemPath)) {
        const backupItemPath = path.join(backupPath, item);
        copyRecursive(itemPath, backupItemPath);
        console.log(`✅ ${item} сохранен перед очисткой`);
      }
    }
    
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Восстанавливаем сохраненные файлы после очистки
  if (fs.existsSync(backupPath)) {
    for (const item of filesToPreserve) {
      const backupItemPath = path.join(backupPath, item);
      if (fs.existsSync(backupItemPath)) {
        const itemPath = path.join(OUTPUT_DIR, item);
        copyRecursive(backupItemPath, itemPath);
        console.log(`✅ ${item} восстановлен`);
      }
    }
    // Удаляем временную папку
    fs.rmSync(backupPath, { recursive: true, force: true });
  }

  // Копируем статические файлы
  console.log('Копирую статические файлы...');
  const staticOutput = path.join(OUTPUT_DIR, 'static');

  if (fs.existsSync(STATIC_DIR)) {
    copyRecursive(STATIC_DIR, staticOutput);
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

