// Вспомогательная функция для fetch с credentials
function apiFetch(url, options = {}) {
    // Если body - FormData, не добавляем Content-Type (браузер установит его сам с boundary)
    const isFormData = options.body instanceof FormData;
    const headers = isFormData 
        ? { ...options.headers } // Для FormData не добавляем Content-Type
        : {
            'Content-Type': 'application/json',
            ...options.headers
        };
    
    return fetch(url, {
        ...options,
        credentials: 'include', // Всегда отправляем cookies
        headers: headers
    });
}

// Проверка авторизации
async function checkAuth() {
    try {
        const response = await apiFetch('/api/admin/auth/check', {
            method: 'GET'
        });
        
        if (!response.ok) {
            console.error('Ошибка проверки авторизации:', response.status);
            window.location.href = '/admin/login';
            return false;
        }
        
        const data = await response.json();
        console.log('Проверка авторизации:', data);
        
        if (!data.authenticated) {
            console.log('Пользователь не авторизован');
            window.location.href = '/admin/login';
            return false;
        }
        
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            usernameEl.textContent = data.username || 'Администратор';
        }
        return true;
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        window.location.href = '/admin/login';
        return false;
    }
}

// Выход
async function logout() {
    try {
        await apiFetch('/api/admin/auth/logout', { 
            method: 'POST'
        });
        window.location.href = '/admin/login';
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        window.location.href = '/admin/login';
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

// ========== СТРАНЫ ==========
async function loadCountries() {
    try {
        const response = await apiFetch('/api/admin/countries');
        const countries = await response.json();
        
        const list = document.getElementById('countriesList');
        if (countries.length === 0) {
            list.innerHTML = '<p>Нет стран</p>';
            return;
        }
        
        list.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Баннер</th>
                        <th>Активна</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${countries.map(country => `
                        <tr>
                            <td>${country.id}</td>
                            <td>${country.name}</td>
                            <td>${country.banner ? `<img src="${country.banner}" alt="${country.name}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 8px;">` : '<span style="color: #999;">Нет баннера</span>'}</td>
                            <td>${country.isActive ? 'Да' : 'Нет'}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editCountry(${country.id})">Редактировать</button>
                                <button class="btn btn-danger" onclick="deleteCountry(${country.id})">Удалить</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Ошибка при загрузке стран:', error);
        document.getElementById('countriesList').innerHTML = '<p style="color: red;">Ошибка загрузки</p>';
    }
}

function showCountryForm(countryId = null) {
    const form = `
        <div class="card">
            <h3>${countryId ? 'Редактировать' : 'Добавить'} страну</h3>
            <form id="countryForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Название *</label>
                    <input type="text" id="countryName" required>
                </div>
                <div class="form-group">
                    <label>Фото баннер</label>
                    <input type="file" id="countryBanner" accept="image/*">
                    <small style="color: #666; display: block; margin-top: 5px;">Формат: JPG, PNG, GIF, WEBP (макс. 5MB)</small>
                    <div id="countryBannerPreview" style="margin-top: 10px;"></div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="countryIsActive" checked> Активна
                    </label>
                </div>
                <button type="submit" class="btn btn-success">Сохранить</button>
                <button type="button" class="btn btn-primary" onclick="loadCountries()">Отмена</button>
            </form>
        </div>
    `;
    
    document.getElementById('countriesList').innerHTML = form;
    
    // Превью изображения при выборе файла
    document.getElementById('countryBanner').addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('countryBannerPreview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 300px; max-height: 200px; border-radius: 8px; margin-top: 10px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    });
    
    if (countryId) {
        fetch(`/api/admin/countries/${countryId}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById('countryName').value = data.name;
                document.getElementById('countryIsActive').checked = data.isActive;
                
                if (data.banner) {
                    const preview = document.getElementById('countryBannerPreview');
                    preview.innerHTML = `
                        <div style="margin-top: 10px;">
                            <p style="color: #666; margin-bottom: 5px;">Текущий баннер:</p>
                            <img src="${data.banner}" alt="Current" style="max-width: 300px; max-height: 200px; border-radius: 8px;">
                        </div>
                    `;
                }
            });
    }
    
    document.getElementById('countryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('countryName').value);
        formData.append('isActive', document.getElementById('countryIsActive').checked);
        
        const bannerFile = document.getElementById('countryBanner').files[0];
        if (bannerFile) {
            formData.append('banner', bannerFile);
        }
        
        try {
            if (countryId) {
                await fetch(`/api/admin/countries/${countryId}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                await apiFetch('/api/admin/countries', {
                    method: 'POST',
                    body: formData
                });
            }
            loadCountries();
        } catch (error) {
            alert('Ошибка при сохранении');
        }
    });
}

async function deleteCountry(id) {
    if (!confirm('Удалить страну?')) return;
    try {
        await fetch(`/api/admin/countries/${id}`, { method: 'DELETE' });
        loadCountries();
    } catch (error) {
        alert('Ошибка при удалении');
    }
}

function editCountry(id) {
    showCountryForm(id);
}

async function loadCountriesForSelect() {
    const response = await apiFetch('/api/admin/countries');
    const countries = await response.json();
    return countries.filter(c => c.isActive).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

// ========== ВИДЫ ТУРОВ ==========
async function loadTourTypes() {
    try {
        const response = await apiFetch('/api/admin/tour-types');
        const tourTypes = await response.json();
        
        const list = document.getElementById('tourTypesList');
        if (tourTypes.length === 0) {
            list.innerHTML = '<p>Нет видов туров</p>';
            return;
        }
        
        list.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Фото</th>
                        <th>Название</th>
                        <th>Даты</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${tourTypes.map(tt => {
                        const dates = tt.dates && Array.isArray(tt.dates) ? tt.dates : [];
                        // Отображаем числа месяца (1-31)
                        const datesDisplay = dates.length > 0 
                            ? dates.map(d => {
                                // Если дата в формате YYYY-MM-DD, извлекаем число месяца
                                if (typeof d === 'string' && d.includes('-')) {
                                    return parseInt(d.split('-')[2]);
                                }
                                return typeof d === 'number' ? d : parseInt(d);
                            }).sort((a, b) => a - b).join(', ')
                            : 'Нет дат';
                        return `
                        <tr>
                            <td>${tt.id}</td>
                            <td>
                                ${tt.imagePath ? `<img src="${tt.imagePath}" alt="${tt.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">` : '<span style="color: #999;">Нет фото</span>'}
                            </td>
                            <td>${tt.name}</td>
                            <td>${datesDisplay}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editTourType(${tt.id})">Редактировать</button>
                                <button class="btn btn-danger" onclick="deleteTourType(${tt.id})">Удалить</button>
                            </td>
                        </tr>
                    `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Ошибка при загрузке видов туров:', error);
        document.getElementById('tourTypesList').innerHTML = '<p style="color: red;">Ошибка загрузки</p>';
    }
}

function showTourTypeForm(tourTypeId = null) {
    // Генерируем числа от 1 до 31 (дни месяца)
    const dayNumbers = [];
    for (let day = 1; day <= 31; day++) {
        dayNumbers.push(day);
    }
    
    const form = `
        <div class="card">
            <h3>${tourTypeId ? 'Редактировать' : 'Добавить'} вид тура</h3>
            <form id="tourTypeForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Название *</label>
                    <input type="text" id="tourTypeName" required>
                </div>
                <div class="form-group">
                    <label>Даты месяца (выберите числа месяца, когда доступен тур)</label>
                    <div id="tourTypeDatesContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 8px; max-height: 300px; overflow-y: auto; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px;">
                        ${dayNumbers.map(day => `
                            <label style="display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; transition: all 0.2s;">
                                <input type="checkbox" value="${day}" class="tourTypeDateCheckbox" style="margin-right: 5px;">
                                <span>${day}</span>
                            </label>
                        `).join('')}
                    </div>
                    <small style="color: #666; display: block; margin-top: 5px;">Выберите числа месяца (1-31). Эти даты будут повторяться каждый месяц.</small>
                </div>
                <div class="form-group">
                    <label>Фото</label>
                    <input type="file" id="tourTypeImage" accept="image/*">
                    <small style="color: #666; display: block; margin-top: 5px;">Формат: JPG, PNG, GIF, WEBP (макс. 5MB)</small>
                    <div id="tourTypeImagePreview" style="margin-top: 10px;"></div>
                </div>
                <button type="submit" class="btn btn-success">Сохранить</button>
                <button type="button" class="btn btn-primary" onclick="loadTourTypes()">Отмена</button>
            </form>
        </div>
    `;
    
    document.getElementById('tourTypesList').innerHTML = form;
    
    // Добавляем стили для выбранных чекбоксов
    const style = document.createElement('style');
    style.textContent = `
        .tourTypeDateCheckbox:checked + span {
            font-weight: bold;
            color: #52D1DC;
        }
        label:has(.tourTypeDateCheckbox:checked) {
            background: #e6f7f9 !important;
            border-color: #52D1DC !important;
        }
    `;
    document.head.appendChild(style);
    
    // Превью изображения при выборе файла
    document.getElementById('tourTypeImage').addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('tourTypeImagePreview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-top: 10px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    });
    
    if (tourTypeId) {
        fetch(`/api/admin/tour-types/${tourTypeId}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById('tourTypeName').value = data.name;
                
                // Устанавливаем выбранные даты (числа месяца)
                const dates = data.dates && Array.isArray(data.dates) ? data.dates : [];
                dates.forEach(date => {
                    // Если дата в формате YYYY-MM-DD, извлекаем число месяца
                    let dayNumber;
                    if (typeof date === 'string' && date.includes('-')) {
                        dayNumber = parseInt(date.split('-')[2]);
                    } else if (typeof date === 'number') {
                        dayNumber = date;
                    } else {
                        dayNumber = parseInt(date);
                    }
                    
                    const checkbox = document.querySelector(`.tourTypeDateCheckbox[value="${dayNumber}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
                
                if (data.imagePath) {
                    const preview = document.getElementById('tourTypeImagePreview');
                    preview.innerHTML = `
                        <div style="margin-top: 10px;">
                            <p style="color: #666; margin-bottom: 5px;">Текущее фото:</p>
                            <img src="${data.imagePath}" alt="Current" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                        </div>
                    `;
                }
            });
    }
    
    document.getElementById('tourTypeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('tourTypeName').value);
        
        // Собираем выбранные числа месяца (1-31)
        const selectedDays = Array.from(document.querySelectorAll('.tourTypeDateCheckbox:checked'))
            .map(checkbox => parseInt(checkbox.value));
        formData.append('dates', JSON.stringify(selectedDays));
        
        const imageFile = document.getElementById('tourTypeImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        try {
            if (tourTypeId) {
                await fetch(`/api/admin/tour-types/${tourTypeId}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                await apiFetch('/api/admin/tour-types', {
                    method: 'POST',
                    body: formData
                });
            }
            loadTourTypes();
        } catch (error) {
            alert('Ошибка при сохранении');
        }
    });
}

async function deleteTourType(id) {
    if (!confirm('Удалить вид тура?')) return;
    try {
        await fetch(`/api/admin/tour-types/${id}`, { method: 'DELETE' });
        loadTourTypes();
    } catch (error) {
        alert('Ошибка при удалении');
    }
}

function editTourType(id) {
    showTourTypeForm(id);
}

// ========== ТУРЫ ==========
async function loadTours() {
    try {
        const response = await apiFetch('/api/admin/tours');
        const tours = await response.json();
        
        const list = document.getElementById('toursList');
        if (tours.length === 0) {
            list.innerHTML = '<p>Нет туров</p>';
            return;
        }
        
        list.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Страна</th>
                        <th>Активен</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${tours.map(tour => `
                        <tr>
                            <td>${tour.id}</td>
                            <td>${tour.title}</td>
                            <td>${tour.country || '-'}</td>
                            <td>${tour.isActive ? 'Да' : 'Нет'}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editTour(${tour.id})">Редактировать</button>
                                <button class="btn btn-primary" onclick="manageTourImages(${tour.id})">Фото</button>
                                <button class="btn btn-danger" onclick="deleteTour(${tour.id})">Удалить</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Ошибка при загрузке туров:', error);
        document.getElementById('toursList').innerHTML = '<p style="color: red;">Ошибка загрузки</p>';
    }
}

async function loadTourTypesForSelect() {
    const response = await apiFetch('/api/admin/tour-types');
    const tourTypes = await response.json();
    return tourTypes.map(tt => `<option value="${tt.id}">${tt.name}</option>`).join('');
}

function showTourForm(tourId = null) {
    Promise.all([loadTourTypesForSelect(), loadCountriesForSelect()]).then(([tourTypeOptions, countryOptions]) => {
        const form = `
            <div class="card">
                <h3>${tourId ? 'Редактировать' : 'Добавить'} тур</h3>
                <form id="tourForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Название *</label>
                            <input type="text" id="tourTitle" required>
                        </div>
                        <div class="form-group">
                            <label>Slug (URL)</label>
                            <input type="text" id="tourSlug" placeholder="kel-su">
                            <small style="color: #666; display: block; margin-top: 5px;">Используется в URL страницы тура (например: /tour-about/kel-su)</small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Подзаголовок (для карточки)</label>
                            <input type="text" id="tourSubtitle" placeholder="Трехдневный тур">
                        </div>
                        <div class="form-group">
                            <label>Страна</label>
                            <select id="tourCountryId">
                                <option value="">Не выбрано</option>
                                ${countryOptions}
                            </select>
                            <input type="text" id="tourCountry" placeholder="Или введите название вручную" style="margin-top: 5px;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Фоновое изображение header</label>
                        <input type="file" id="tourHeaderImage" accept="image/*">
                        <small style="color: #666; display: block; margin-top: 5px;">Загрузите изображение для фона header</small>
                        <div id="tourHeaderImagePreview" style="margin-top: 10px;"></div>
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea id="tourDescription"></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Цена (общая)</label>
                            <input type="number" id="tourPrice" step="0.01">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Цены по дням недели</label>
                        <div id="tourPricesByDayContainer">
                            <!-- Динамические поля для дней недели -->
                        </div>
                        <button type="button" class="btn btn-primary" onclick="addPriceDay()" style="margin-top: 10px;">+ Добавить день</button>
                        <small style="color: #666; display: block; margin-top: 5px;">Укажите дни недели и цены для каждого дня</small>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Вид тура</label>
                            <select id="tourTypeId">
                                <option value="">Не выбрано</option>
                                ${tourTypeOptions}
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Количество дней тура *</label>
                            <input type="number" id="tourDaysCount" min="1" value="1" required>
                            <small style="color: #666; display: block; margin-top: 5px;">Укажите количество дней тура</small>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Программа тура по дням</label>
                        <div id="tourProgramContainer">
                            <!-- Программа будет добавлена динамически на основе количества дней -->
                        </div>
                        <small style="color: #666; display: block; margin-top: 5px;">Заполните программу для каждого дня тура</small>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="tourIsActive" checked> Активен
                        </label>
                    </div>
                    <button type="submit" class="btn btn-success">Сохранить</button>
                    <button type="button" class="btn btn-primary" onclick="loadTours()">Отмена</button>
                </form>
            </div>
        `;
        
        document.getElementById('toursList').innerHTML = form;
        
        // Функция для обновления полей программы при изменении количества дней
        function updateProgramFields(daysCount, existingProgram = []) {
            const container = document.getElementById('tourProgramContainer');
            container.innerHTML = '';
            
            for (let day = 1; day <= daysCount; day++) {
                const dayProgram = existingProgram.find(p => p.day === day) || { day: day, program: '' };
                const dayDiv = document.createElement('div');
                dayDiv.className = 'form-group';
                dayDiv.style.marginBottom = '15px';
                dayDiv.style.padding = '15px';
                dayDiv.style.border = '1px solid #ddd';
                dayDiv.style.borderRadius = '8px';
                dayDiv.style.backgroundColor = '#f9f9f9';
                dayDiv.innerHTML = `
                    <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block;">
                        День ${day}
                    </label>
                    <textarea 
                        id="tourProgramDay${day}" 
                        rows="4" 
                        style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; resize: vertical;"
                        placeholder="Опишите программу для ${day} дня тура..."
                    >${dayProgram.program || ''}</textarea>
                `;
                container.appendChild(dayDiv);
            }
        }
        
        // Обработчик изменения количества дней
        const daysCountInput = document.getElementById('tourDaysCount');
        daysCountInput.addEventListener('change', (e) => {
            const daysCount = parseInt(e.target.value) || 1;
            const existingProgram = [];
            // Собираем текущие значения программы (проверяем до 100 дней на всякий случай)
            for (let i = 1; i <= 100; i++) {
                const dayInput = document.getElementById(`tourProgramDay${i}`);
                if (dayInput) {
                    existingProgram.push({
                        day: i,
                        program: dayInput.value
                    });
                }
            }
            updateProgramFields(daysCount, existingProgram);
        });
        
        if (tourId) {
            fetch(`/api/admin/tours/${tourId}`)
                .then(res => res.json())
                .then(data => {
                    document.getElementById('tourTitle').value = data.title || '';
                    document.getElementById('tourSlug').value = data.slug || '';
                    document.getElementById('tourSubtitle').value = data.subtitle || '';
                    
                    // Показываем превью текущего изображения
                    if (data.headerImage) {
                        const preview = document.getElementById('tourHeaderImagePreview');
                        preview.innerHTML = '<img src="' + data.headerImage + '" style="max-width: 200px; max-height: 150px; border-radius: 4px;"><br><small>Текущее изображение</small>';
                    }
                    
                    document.getElementById('tourDescription').value = data.description || '';
                    document.getElementById('tourCountryId').value = data.countryId || '';
                    document.getElementById('tourCountry').value = data.country || 'Кыргызстан';
                    document.getElementById('tourPrice').value = data.price || '';
                    document.getElementById('tourTypeId').value = data.tourTypeId || '';
                    document.getElementById('tourIsActive').checked = data.isActive;
                    document.getElementById('tourDatesByMonth').value = data.datesByMonth ? JSON.stringify(data.datesByMonth, null, 2) : '';
                    document.getElementById('tourImportantInfo').value = data.importantInfo ? JSON.stringify(data.importantInfo, null, 2) : '';
                    document.getElementById('tourFaq').value = data.faq ? JSON.stringify(data.faq, null, 2) : '';
                    
                    // Загружаем цены по дням недели
                    const pricesByDay = data.pricesByDay && Array.isArray(data.pricesByDay) ? data.pricesByDay : [];
                    const pricesContainer = document.getElementById('tourPricesByDayContainer');
                    pricesContainer.innerHTML = '';
                    if (pricesByDay.length > 0) {
                        pricesByDay.forEach(item => {
                            addPriceDay(item.day || '', item.price || '');
                        });
                    }
                    
                    // Устанавливаем количество дней и программу
                    const daysCount = data.daysCount || 1;
                    document.getElementById('tourDaysCount').value = daysCount;
                    const program = data.program && Array.isArray(data.program) ? data.program : [];
                    updateProgramFields(daysCount, program);
                });
        } else {
            // При создании нового тура устанавливаем 1 день по умолчанию
            updateProgramFields(1);
        }
        
        document.getElementById('tourForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Собираем программу по дням
            const daysCount = parseInt(document.getElementById('tourDaysCount').value) || 1;
            const program = [];
            for (let day = 1; day <= daysCount; day++) {
                const dayInput = document.getElementById(`tourProgramDay${day}`);
                if (dayInput && dayInput.value.trim()) {
                    program.push({
                        day: day,
                        program: dayInput.value.trim()
                    });
                }
            }
            
            // Собираем цены по дням недели
            const pricesByDay = [];
            const pricesContainer = document.getElementById('tourPricesByDayContainer');
            const priceRows = pricesContainer.querySelectorAll('div');
            priceRows.forEach(row => {
                const dayInput = row.querySelector('input[type="text"]');
                const priceInput = row.querySelector('input[type="number"]');
                if (dayInput && dayInput.value.trim() && priceInput && priceInput.value) {
                    pricesByDay.push({
                        day: dayInput.value.trim(),
                        price: parseFloat(priceInput.value)
                    });
                }
            });
            
            // Парсим JSON поля
            let datesByMonth = [];
            try {
                const datesByMonthText = document.getElementById('tourDatesByMonth').value.trim();
                if (datesByMonthText) {
                    datesByMonth = JSON.parse(datesByMonthText);
                }
            } catch (e) {
                alert('Ошибка в формате дат по месяцам. Проверьте JSON.');
                return;
            }

            let importantInfo = {};
            try {
                const importantInfoText = document.getElementById('tourImportantInfo').value.trim();
                if (importantInfoText) {
                    importantInfo = JSON.parse(importantInfoText);
                }
            } catch (e) {
                alert('Ошибка в формате важной информации. Проверьте JSON.');
                return;
            }

            let faq = [];
            try {
                const faqText = document.getElementById('tourFaq').value.trim();
                if (faqText) {
                    faq = JSON.parse(faqText);
                }
            } catch (e) {
                alert('Ошибка в формате FAQ. Проверьте JSON.');
                return;
            }

            // Создаем FormData для отправки файла
            const formData = new FormData();
            formData.append('title', document.getElementById('tourTitle').value);
            formData.append('slug', document.getElementById('tourSlug').value || '');
            formData.append('subtitle', document.getElementById('tourSubtitle').value || '');
            formData.append('description', document.getElementById('tourDescription').value);
            formData.append('country', document.getElementById('tourCountry').value || '');
            formData.append('countryId', document.getElementById('tourCountryId').value || '');
            formData.append('daysCount', daysCount);
            formData.append('program', JSON.stringify(program));
            formData.append('price', document.getElementById('tourPrice').value || '');
            formData.append('pricesByDay', JSON.stringify(pricesByDay));
            formData.append('datesByMonth', JSON.stringify(datesByMonth));
            formData.append('importantInfo', JSON.stringify(importantInfo));
            formData.append('faq', JSON.stringify(faq));
            formData.append('tourTypeId', document.getElementById('tourTypeId').value || '');
            formData.append('isActive', document.getElementById('tourIsActive').checked);
            
            // Добавляем файл если выбран
            const headerImageInput = document.getElementById('tourHeaderImage');
            if (headerImageInput.files.length > 0) {
                formData.append('headerImage', headerImageInput.files[0]);
            }
            
            try {
                if (tourId) {
                    await apiFetch(`/api/admin/tours/${tourId}`, {
                        method: 'PUT',
                        body: formData
                    });
                } else {
                    await apiFetch('/api/admin/tours', {
                        method: 'POST',
                        body: formData
                    });
                }
                loadTours();
            } catch (error) {
                console.error('Ошибка при сохранении:', error);
                alert('Ошибка при сохранении');
            }
        });
    });
}

async function deleteTour(id) {
    if (!confirm('Удалить тур? Все фотографии также будут удалены.')) return;
    try {
        await fetch(`/api/admin/tours/${id}`, { method: 'DELETE' });
        loadTours();
    } catch (error) {
        alert('Ошибка при удалении');
    }
}

function editTour(id) {
    showTourForm(id);
}

function manageTourImages(tourId) {
    // Загрузка изображений тура
    fetch(`/api/admin/tour-images/tour/${tourId}`)
        .then(res => res.json())
        .then(images => {
            const form = `
                <div class="card">
                    <h3>Управление фотографиями тура</h3>
                    <form id="tourImageForm" enctype="multipart/form-data">
                        <div class="form-group">
                            <label>Загрузить фото (можно выбрать несколько)</label>
                            <input type="file" id="tourImageFiles" accept="image/*" multiple required>
                            <small style="color: #666; display: block; margin-top: 5px;">Вы можете выбрать несколько файлов, удерживая Ctrl (Windows) или Cmd (Mac)</small>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="tourImageIsMain"> Первое фото - главное
                            </label>
                        </div>
                        <button type="submit" class="btn btn-success">Загрузить</button>
                        <button type="button" class="btn btn-primary" onclick="loadTours()">Назад</button>
                    </form>
                    <div class="image-list" id="tourImagesList">
                        ${images.map(img => `
                            <div class="image-item">
                                <img src="${img.imagePath}" alt="Tour image">
                                ${img.isMain ? '<span style="position: absolute; top: 5px; left: 5px; background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">Главное</span>' : ''}
                                <button class="delete-btn" onclick="deleteTourImage(${img.id})">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.getElementById('toursList').innerHTML = form;
            
            document.getElementById('tourImageForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const files = document.getElementById('tourImageFiles').files;
                
                if (files.length === 0) {
                    alert('Выберите хотя бы одно фото');
                    return;
                }
                
                const formData = new FormData();
                // Добавляем все файлы с именем 'images' для поддержки массива
                for (let i = 0; i < files.length; i++) {
                    formData.append('images', files[i]);
                }
                formData.append('isMain', document.getElementById('tourImageIsMain').checked);
                
                try {
                    const response = await fetch(`/api/admin/tour-images/tour/${tourId}`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        alert(`Загружено ${result.count} фото`);
                    }
                    manageTourImages(tourId);
                } catch (error) {
                    alert('Ошибка при загрузке фото');
                }
            });
        });
}

async function deleteTourImage(id) {
    if (!confirm('Удалить фото?')) return;
    try {
        await fetch(`/api/admin/tour-images/${id}`, { method: 'DELETE' });
        loadTours();
    } catch (error) {
        alert('Ошибка при удалении');
    }
}

// ========== ГАЛЕРЕЯ ==========
async function loadGallery() {
    try {
        const response = await apiFetch('/api/admin/gallery');
        const images = await response.json();
        
        const list = document.getElementById('galleryList');
        if (images.length === 0) {
            list.innerHTML = '<p>Нет фотографий в галерее</p>';
            return;
        }
        
        list.innerHTML = `
            <div class="image-list">
                ${images.map(img => `
                    <div class="image-item">
                        <img src="${img.imagePath}" alt="${img.title || 'Gallery image'}">
                        <button class="delete-btn" onclick="deleteGalleryImage(${img.id})">×</button>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Ошибка при загрузке галереи:', error);
        document.getElementById('galleryList').innerHTML = '<p style="color: red;">Ошибка загрузки</p>';
    }
}

function showGalleryForm() {
    const form = `
        <div class="card">
            <h3>Добавить фото в галерею</h3>
            <form id="galleryForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Фото (можно выбрать несколько) *</label>
                    <input type="file" id="galleryImageFiles" accept="image/*" multiple required>
                    <small style="color: #666; display: block; margin-top: 5px;">Вы можете выбрать несколько файлов, удерживая Ctrl (Windows) или Cmd (Mac)</small>
                </div>
                <button type="submit" class="btn btn-success">Загрузить</button>
                <button type="button" class="btn btn-primary" onclick="loadGallery()">Отмена</button>
            </form>
        </div>
    `;
    
    document.getElementById('galleryList').innerHTML = form;
    
    document.getElementById('galleryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const files = document.getElementById('galleryImageFiles').files;
        
        if (files.length === 0) {
            alert('Выберите хотя бы одно фото');
            return;
        }
        
        const formData = new FormData();
        // Добавляем все файлы с именем 'images' для поддержки массива
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        
        try {
            const response = await apiFetch('/api/admin/gallery', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if (result.success) {
                alert(`Загружено ${result.count} фото`);
            }
            loadGallery();
        } catch (error) {
            alert('Ошибка при загрузке фото');
        }
    });
}

async function deleteGalleryImage(id) {
    if (!confirm('Удалить фото из галереи?')) return;
    try {
        await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
        loadGallery();
    } catch (error) {
        alert('Ошибка при удалении');
    }
}

// ========== ОТЗЫВЫ ==========
async function loadReviews() {
    try {
        const response = await apiFetch('/api/admin/reviews');
        const reviews = await response.json();
        
        const list = document.getElementById('reviewsList');
        if (reviews.length === 0) {
            list.innerHTML = '<p>Нет отзывов</p>';
            return;
        }
        
        list.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Фото</th>
                        <th>Никнейм</th>
                        <th>Содержимое</th>
                        <th>Instagram</th>
                        <th>Порядок</th>
                        <th>Активен</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${reviews.map(review => `
                        <tr>
                            <td>${review.id}</td>
                            <td>${review.imagePath ? `<img src="${review.imagePath}" alt="${review.nickname}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">` : '<span style="color: #999;">Нет фото</span>'}</td>
                            <td>${review.nickname}</td>
                            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${review.content}</td>
                            <td>${review.instagramLink ? `<a href="${review.instagramLink}" target="_blank">${review.instagramLink}</a>` : '-'}</td>
                            <td>${review.order}</td>
                            <td>${review.isActive ? 'Да' : 'Нет'}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editReview(${review.id})">Редактировать</button>
                                <button class="btn btn-danger" onclick="deleteReview(${review.id})">Удалить</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error);
        document.getElementById('reviewsList').innerHTML = '<p style="color: red;">Ошибка загрузки</p>';
    }
}

function showReviewForm(reviewId = null) {
    const form = `
        <div class="card">
            <h3>${reviewId ? 'Редактировать' : 'Добавить'} отзыв</h3>
            <form id="reviewForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Никнейм *</label>
                    <input type="text" id="reviewNickname" required>
                </div>
                <div class="form-group">
                    <label>Содержимое отзыва *</label>
                    <textarea id="reviewContent" rows="5" required></textarea>
                </div>
                <div class="form-group">
                    <label>Ссылка на Instagram</label>
                    <input type="url" id="reviewInstagramLink" placeholder="https://instagram.com/username">
                </div>
                <div class="form-group">
                    <label>Фото отзыва</label>
                    <input type="file" id="reviewImage" accept="image/*">
                    <small style="color: #666; display: block; margin-top: 5px;">Формат: JPG, PNG, GIF, WEBP</small>
                    <div id="reviewImagePreview" style="margin-top: 10px;"></div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Порядок отображения</label>
                        <input type="number" id="reviewOrder" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="reviewIsActive" checked> Активен
                        </label>
                    </div>
                </div>
                <button type="submit" class="btn btn-success">Сохранить</button>
                <button type="button" class="btn btn-primary" onclick="loadReviews()">Отмена</button>
            </form>
        </div>
    `;
    
    document.getElementById('reviewsList').innerHTML = form;
    
    // Превью изображения при выборе файла
    document.getElementById('reviewImage').addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('reviewImagePreview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 300px; max-height: 200px; border-radius: 8px; margin-top: 10px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    });
    
    if (reviewId) {
        fetch(`/api/admin/reviews/${reviewId}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById('reviewNickname').value = data.nickname;
                document.getElementById('reviewContent').value = data.content;
                document.getElementById('reviewInstagramLink').value = data.instagramLink || '';
                document.getElementById('reviewOrder').value = data.order || 0;
                document.getElementById('reviewIsActive').checked = data.isActive;
                
                if (data.imagePath) {
                    const preview = document.getElementById('reviewImagePreview');
                    preview.innerHTML = `
                        <div style="margin-top: 10px;">
                            <p style="color: #666; margin-bottom: 5px;">Текущее фото:</p>
                            <img src="${data.imagePath}" alt="Current" style="max-width: 300px; max-height: 200px; border-radius: 8px;">
                        </div>
                    `;
                }
            });
    }
    
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('nickname', document.getElementById('reviewNickname').value);
        formData.append('content', document.getElementById('reviewContent').value);
        formData.append('instagramLink', document.getElementById('reviewInstagramLink').value || '');
        formData.append('order', parseInt(document.getElementById('reviewOrder').value) || 0);
        formData.append('isActive', document.getElementById('reviewIsActive').checked);
        
        const imageFile = document.getElementById('reviewImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        try {
            if (reviewId) {
                await fetch(`/api/admin/reviews/${reviewId}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                await apiFetch('/api/admin/reviews', {
                    method: 'POST',
                    body: formData
                });
            }
            loadReviews();
        } catch (error) {
            alert('Ошибка при сохранении');
        }
    });
}

function editReview(id) {
    showReviewForm(id);
}

async function deleteReview(id) {
    if (!confirm('Удалить отзыв?')) return;
    try {
        await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
        loadReviews();
    } catch (error) {
        alert('Ошибка при удалении');
    }
}

// ========== НАСТРОЙКИ ==========
async function loadSettings() {
    try {
        // Загружаем видео и статистику параллельно
        const [videoResponse, statsResponse] = await Promise.all([
            apiFetch('/api/admin/settings/main_video'),
            apiFetch('/api/admin/settings/stats/all')
        ]);
        
        const setting = await videoResponse.json();
        const stats = await statsResponse.json();
        
        console.log('Загруженные настройки видео:', setting);
        console.log('Значение видео:', setting.value);
        
        // Проверяем, что setting существует и имеет значение
        const videoValue = setting && setting.value ? setting.value : null;
        const hasCustomVideo = videoValue && videoValue !== '/static/images/mainback3.mp4';
        
        const content = document.getElementById('settingsContent');
        content.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <!-- Видео главной страницы -->
                <div class="card">
                    <h3>Видео главной страницы</h3>
                    <form id="videoForm" enctype="multipart/form-data">
                        <div class="form-group">
                            <label>Загрузить новое видео</label>
                            <input type="file" id="mainVideoFile" accept="video/*">
                            <small style="color: #666; display: block; margin-top: 5px;">Формат: MP4, WEBM, OGG</small>
                            <div id="videoPreview" style="margin-top: 10px;"></div>
                        </div>
                        ${hasCustomVideo ? `
                            <div class="form-group" style="margin-top: 15px;">
                                <label>Текущее видео:</label>
                                <p style="color: #666; margin-bottom: 5px; font-size: 12px;">Путь: ${videoValue}</p>
                                <video controls style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-top: 10px;">
                                    <source src="${videoValue}" type="video/mp4">
                                    Ваш браузер не поддерживает видео.
                                </video>
                                <button type="button" id="deleteVideoBtn" class="btn btn-danger" style="margin-top: 10px;">Удалить текущее видео</button>
                            </div>
                        ` : `
                            <div class="form-group" style="margin-top: 15px;">
                                <p style="color: #666;">Используется видео по умолчанию: /static/images/mainback3.mp4</p>
                                ${videoValue ? `<p style="color: #999; font-size: 12px;">Текущее значение в БД: ${videoValue}</p>` : ''}
                            </div>
                        `}
                        <button type="submit" class="btn btn-success">Сохранить новое видео</button>
                    </form>
                </div>
                
                <!-- Статистика -->
                <div class="card">
                    <h3>Статистика главной страницы</h3>
                    <form id="statsForm">
                        <div class="form-group">
                            <label>Организованных туров</label>
                            <input type="text" id="statsTours" value="${stats.tours || '140'}" placeholder="140">
                            <small style="color: #666; display: block; margin-top: 5px;">Текущее значение: ${stats.tours || '140'}</small>
                        </div>
                        <div class="form-group">
                            <label>Довольных туристов</label>
                            <input type="text" id="statsTourists" value="${stats.tourists || '16 500+'}" placeholder="16 500+">
                            <small style="color: #666; display: block; margin-top: 5px;">Текущее значение: ${stats.tourists || '16 500+'}</small>
                        </div>
                        <div class="form-group">
                            <label>Опыта (лет)</label>
                            <input type="text" id="statsExperience" value="${stats.experience || '5 лет'}" placeholder="5 лет">
                            <small style="color: #666; display: block; margin-top: 5px;">Текущее значение: ${stats.experience || '5 лет'}</small>
                        </div>
                        <button type="submit" class="btn btn-success">Сохранить статистику</button>
                    </form>
                </div>
            </div>
        `;
        
        // Превью видео при выборе файла
        const videoInput = document.getElementById('mainVideoFile');
        if (videoInput) {
            videoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const preview = document.getElementById('videoPreview');
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.innerHTML = `
                            <p style="color: #666; margin-bottom: 5px;">Предпросмотр:</p>
                            <video controls style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                                <source src="${e.target.result}" type="${file.type}">
                                Ваш браузер не поддерживает видео.
                            </video>
                        `;
                    };
                    reader.readAsDataURL(file);
                } else {
                    preview.innerHTML = '';
                }
            });
        }
        
        // Обработка отправки формы
        const form = document.getElementById('videoForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData();
                const videoFile = document.getElementById('mainVideoFile').files[0];
                
                if (!videoFile) {
                    alert('Выберите видео файл');
                    return;
                }
                
                formData.append('video', videoFile);
                
                console.log('Отправка видео файла:', videoFile.name, 'размер:', videoFile.size, 'тип:', videoFile.type);
                
                try {
                    const response = await apiFetch('/api/admin/settings/main_video', {
                        method: 'PUT',
                        body: formData
                        // НЕ добавляем Content-Type - браузер установит его автоматически с boundary для multipart/form-data
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('Видео успешно загружено:', result);
                        alert('Видео успешно обновлено! Старое видео удалено. Обновите страницу сайта (Ctrl+F5) чтобы увидеть изменения.');
                        loadSettings();
                    } else {
                        const error = await response.json();
                        console.error('Ошибка при загрузке видео:', error);
                        alert('Ошибка: ' + (error.error || 'Не удалось обновить видео'));
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке видео:', error);
                    alert('Ошибка при загрузке видео: ' + (error.message || 'Неизвестная ошибка'));
                }
            });
        }
        
        // Обработка удаления видео
        const deleteVideoBtn = document.getElementById('deleteVideoBtn');
        if (deleteVideoBtn) {
            deleteVideoBtn.addEventListener('click', async () => {
                if (!confirm('Вы уверены, что хотите удалить текущее видео? После удаления будет использоваться видео по умолчанию.')) {
                    return;
                }
                
                try {
                    const response = await apiFetch('/api/admin/settings/main_video', {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        alert('Видео успешно удалено! Будет использоваться видео по умолчанию.');
                        loadSettings();
                    } else {
                        const error = await response.json();
                        alert('Ошибка: ' + (error.error || 'Не удалось удалить видео'));
                    }
                } catch (error) {
                    alert('Ошибка при удалении видео');
                    console.error(error);
                }
            });
        }
        
        // Обработка формы статистики
        const statsForm = document.getElementById('statsForm');
        if (statsForm) {
            statsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const statsData = {
                    tours: document.getElementById('statsTours').value,
                    tourists: document.getElementById('statsTourists').value,
                    experience: document.getElementById('statsExperience').value
                };
                
                try {
                    const response = await apiFetch('/api/admin/settings/stats/update', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(statsData)
                    });
                    
                    if (response.ok) {
                        alert('Статистика успешно обновлена!');
                        loadSettings();
                    } else {
                        const error = await response.json();
                        alert('Ошибка: ' + (error.error || 'Не удалось обновить статистику'));
                    }
                } catch (error) {
                    alert('Ошибка при сохранении статистики');
                    console.error(error);
                }
            });
        }
    } catch (error) {
        console.error('Ошибка при загрузке настроек:', error);
        document.getElementById('settingsContent').innerHTML = '<p style="color: red;">Ошибка загрузки</p>';
    }
}

// ========== БЛОГИ ==========
async function loadBlogs() {
    try {
        const response = await apiFetch('/api/admin/blogs');
        const blogs = await response.json();
        
        const list = document.getElementById('blogsList');
        if (blogs.length === 0) {
            list.innerHTML = '<p>Нет блогов</p>';
            return;
        }
        
        list.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Заголовок</th>
                        <th>Изображение</th>
                        <th>Slug</th>
                        <th>Активен</th>
                        <th>Порядок</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${blogs.map(blog => `
                        <tr>
                            <td>${blog.id}</td>
                            <td>${blog.title}</td>
                            <td>${blog.imagePath ? `<img src="${blog.imagePath}" alt="${blog.title}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 8px;">` : '<span style="color: #999;">Нет изображения</span>'}</td>
                            <td>${blog.slug || '-'}</td>
                            <td>${blog.isActive ? 'Да' : 'Нет'}</td>
                            <td>${blog.order}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editBlog(${blog.id})">Редактировать</button>
                                <button class="btn btn-danger" onclick="deleteBlog(${blog.id})">Удалить</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Ошибка при загрузке блогов:', error);
        document.getElementById('blogsList').innerHTML = '<p style="color: red;">Ошибка загрузки</p>';
    }
}

function showBlogForm(blogId = null) {
    const form = `
        <div class="card">
            <h3>${blogId ? 'Редактировать' : 'Добавить'} блог</h3>
            <form id="blogForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Заголовок *</label>
                    <input type="text" id="blogTitle" required>
                </div>
                <div class="form-group">
                    <label>Содержимое *</label>
                    <textarea id="blogContent" rows="15" required style="font-family: monospace; font-size: 13px;"></textarea>
                    <small style="color: #666; display: block; margin-top: 5px;">HTML контент блога</small>
                </div>
                <div class="form-group">
                    <label>Изображение превью</label>
                    <input type="file" id="blogImage" accept="image/*">
                    <small style="color: #666; display: block; margin-top: 5px;">Формат: JPG, PNG, GIF, WEBP</small>
                    <div id="blogImagePreview" style="margin-top: 10px;"></div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Порядок отображения</label>
                        <input type="number" id="blogOrder" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="blogIsActive" checked> Активен
                        </label>
                    </div>
                </div>
                <button type="submit" class="btn btn-success">Сохранить</button>
                <button type="button" class="btn btn-primary" onclick="loadBlogs()">Отмена</button>
            </form>
        </div>
    `;
    
    document.getElementById('blogsList').innerHTML = form;
    
    // Превью изображения
    const imageInput = document.getElementById('blogImage');
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('blogImagePreview');
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" class="image-preview" alt="Превью">`;
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = '';
            }
        });
    }
    
    // Загрузка данных для редактирования
    if (blogId) {
        fetch(`/api/admin/blogs/${blogId}`)
            .then(res => res.json())
            .then(blog => {
                document.getElementById('blogTitle').value = blog.title || '';
                document.getElementById('blogContent').value = blog.content || '';
                document.getElementById('blogOrder').value = blog.order || 0;
                document.getElementById('blogIsActive').checked = blog.isActive !== false;
                
                if (blog.imagePath) {
                    document.getElementById('blogImagePreview').innerHTML = 
                        `<img src="${blog.imagePath}" class="image-preview" alt="Текущее изображение">`;
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке блога:', error);
                alert('Ошибка при загрузке данных блога');
            });
    }
    
    // Обработка отправки формы
    const formElement = document.getElementById('blogForm');
    formElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', document.getElementById('blogTitle').value);
        formData.append('content', document.getElementById('blogContent').value);
        formData.append('order', document.getElementById('blogOrder').value);
        formData.append('isActive', document.getElementById('blogIsActive').checked);
        
        const imageFile = document.getElementById('blogImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        try {
            const url = blogId ? `/api/admin/blogs/${blogId}` : '/api/admin/blogs';
            const method = blogId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                body: formData
            });
            
            if (response.ok) {
                alert('Блог успешно сохранен!');
                loadBlogs();
            } else {
                const error = await response.json();
                alert('Ошибка: ' + (error.error || 'Не удалось сохранить блог'));
            }
        } catch (error) {
            alert('Ошибка при сохранении');
        }
    });
}

function editBlog(id) {
    showBlogForm(id);
}

async function deleteBlog(id) {
    if (!confirm('Удалить блог?')) return;
    try {
        await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
        loadBlogs();
    } catch (error) {
        alert('Ошибка при удалении');
    }
}

// Инициализация
window.addEventListener('load', async () => {
    if (await checkAuth()) {
        loadCountries();
    }
});
