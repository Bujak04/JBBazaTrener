// PDF Creators - Generowanie planów treningowych i diet

// Otwórz kreator planu treningowego
function openTrainingCreator() {
    const modal = createCreatorModal('training');
    document.body.insertAdjacentHTML('beforeend', modal);
    initializeTrainingCreator();
}

// Otwórz kreator planu dietetycznego
function openDietCreator() {
    const modal = createCreatorModal('diet');
    document.body.insertAdjacentHTML('beforeend', modal);
    initializeDietCreator();
}

// Tworzenie modala kreatora
function createCreatorModal(type) {
    const title = type === 'training' ? '💪 Kreator Planu Treningowego' : '🥗 Kreator Planu Dietetycznego';
    
    return `
        <div class="modal active" id="creatorModal" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 1400px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-btn" onclick="closeCreatorModal()">&times;</button>
                </div>
                <div class="modal-body" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <!-- Formularz -->
                    <div id="creatorForm" style="padding-right: 20px; border-right: 2px solid var(--border-color);">
                        <!-- Dynamicznie generowane -->
                    </div>
                    
                    <!-- Podgląd -->
                    <div id="creatorPreview" style="padding-left: 20px;">
                        <h3 style="margin: 0 0 20px 0;">Podgląd PDF</h3>
                        <div id="pdfPreview" style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-height: 600px;">
                            <!-- Podgląd na żywo -->
                        </div>
                    </div>
                </div>
                <div class="modal-actions" style="margin-top: 20px;">
                    <button class="btn-secondary" onclick="closeCreatorModal()">Anuluj</button>
                    <button class="btn-primary" onclick="generatePDF('${type}')">📥 Pobierz PDF</button>
                </div>
            </div>
        </div>
    `;
}

// Zamknij modal kreatora
function closeCreatorModal() {
    const modal = document.getElementById('creatorModal');
    if (modal) {
        modal.remove();
    }
}

// Inicjalizacja kreatora planu treningowego
function initializeTrainingCreator() {
    const formContainer = document.getElementById('creatorForm');
    
    const formHtml = `
        <div class="form-group">
            <label>Wybierz podopiecznego</label>
            <select id="trainingClient" class="form-control" onchange="updateTrainingPreview()">
                <option value="">-- Wybierz --</option>
                ${(window.allClients || []).map(client => 
                    `<option value="${client.id}">${client.firstName} ${client.lastName}</option>`
                ).join('')}
            </select>
        </div>
        
        <div class="form-group">
            <label>Tytuł planu *</label>
            <input type="text" id="trainingTitle" class="form-control" placeholder="np. Plan FBW - Budowa masy" oninput="updateTrainingPreview()">
        </div>
        
        <div class="form-group">
            <label>Cel treningu</label>
            <input type="text" id="trainingGoal" class="form-control" placeholder="np. Budowa masy mięśniowej" oninput="updateTrainingPreview()">
        </div>
        
        <div class="form-group">
            <label>Liczba dni treningowych</label>
            <input type="number" id="trainingDays" class="form-control" value="3" min="1" max="7" oninput="updateTrainingDays()">
        </div>
        
        <div id="trainingDaysContainer" style="margin-top: 30px;">
            <!-- Dynamicznie generowane dni -->
        </div>
        
        <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="addTrainingDay()">+ Dodaj dzień treningowy</button>
    `;
    
    formContainer.innerHTML = formHtml;
    updateTrainingDays();
}

// Aktualizacja liczby dni treningowych
function updateTrainingDays() {
    const daysCount = parseInt(document.getElementById('trainingDays').value) || 1;
    const container = document.getElementById('trainingDaysContainer');
    
    // Pobierz istniejące dane dni
    const existingDays = Array.from(container.querySelectorAll('.training-day')).map(dayEl => {
        const dayNum = dayEl.dataset.day;
        return {
            name: document.getElementById(`dayName${dayNum}`)?.value || '',
            warmup1: document.getElementById(`warmup1_${dayNum}`)?.value || '',
            warmup2: document.getElementById(`warmup2_${dayNum}`)?.value || '',
            warmup3: document.getElementById(`warmup3_${dayNum}`)?.value || '',
            exercises: Array.from(dayEl.querySelectorAll('.exercise-row')).map(row => ({
                name: row.querySelector('.exercise-name').value,
                sets: row.querySelector('.exercise-sets').value,
                reps: row.querySelector('.exercise-reps').value,
                tempo: row.querySelector('.exercise-tempo').value,
                rest: row.querySelector('.exercise-rest').value
            }))
        };
    });
    
    let html = '';
    for (let i = 1; i <= daysCount; i++) {
        const dayData = existingDays[i - 1] || { name: '', warmup1: '', warmup2: '', warmup3: '', exercises: [{name: '', sets: '', reps: '', tempo: '', rest: ''}] };
        
        html += `
            <div class="training-day" data-day="${i}" style="background: var(--bg-dark); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; color: var(--primary-green);">Dzień ${i}</h4>
                
                <div class="form-group">
                    <label>Nazwa dnia / Partia *</label>
                    <input type="text" id="dayName${i}" class="form-control" value="${dayData.name}" placeholder="np. PUSH - Klatka, barki, triceps" oninput="updateTrainingPreview()">
                </div>
                
                <h5 style="margin: 20px 0 10px 0;">Rozgrzewka</h5>
                
                <div class="form-group">
                    <label>1. Część ogólna</label>
                    <textarea id="warmup1_${i}" class="form-control" rows="2" placeholder="np. 5 min cardio (rowerek/bieżnia)" oninput="updateTrainingPreview()">${dayData.warmup1}</textarea>
                </div>
                
                <div class="form-group">
                    <label>2. Część dynamiczna</label>
                    <textarea id="warmup2_${i}" class="form-control" rows="2" placeholder="np. Wymachy ramion, rotacje barków" oninput="updateTrainingPreview()">${dayData.warmup2}</textarea>
                </div>
                
                <div class="form-group">
                    <label>3. Część specyficzna</label>
                    <textarea id="warmup3_${i}" class="form-control" rows="2" placeholder="np. 2 serie rozgrzewkowe ćwiczenia głównego" oninput="updateTrainingPreview()">${dayData.warmup3}</textarea>
                </div>
                
                <h5 style="margin: 20px 0 10px 0;">Ćwiczenia</h5>
                <div id="exercises${i}" class="exercises-container">
                    ${dayData.exercises.map((ex, idx) => createExerciseRow(i, idx, ex)).join('')}
                </div>
                
                <button class="btn-secondary" style="width: 100%; margin-top: 10px;" onclick="addExercise(${i})">+ Dodaj ćwiczenie</button>
            </div>
        `;
    }
    
    container.innerHTML = html;
    updateTrainingPreview();
}

// Tworzenie wiersza ćwiczenia
function createExerciseRow(dayNum, exNum, data = {}) {
    return `
        <div class="exercise-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: end;">
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 12px;">Ćwiczenie</label>
                <input type="text" class="form-control exercise-name" value="${data.name || ''}" placeholder="np. Wyciskanie sztangi" oninput="updateTrainingPreview()">
            </div>
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 12px;">Serie</label>
                <input type="text" class="form-control exercise-sets" value="${data.sets || ''}" placeholder="4" oninput="updateTrainingPreview()">
            </div>
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 12px;">Powtórz.</label>
                <input type="text" class="form-control exercise-reps" value="${data.reps || ''}" placeholder="8-12" oninput="updateTrainingPreview()">
            </div>
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 12px;">Tempo</label>
                <input type="text" class="form-control exercise-tempo" value="${data.tempo || ''}" placeholder="3010" oninput="updateTrainingPreview()">
            </div>
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 12px;">Przerwa</label>
                <input type="text" class="form-control exercise-rest" value="${data.rest || ''}" placeholder="90s" oninput="updateTrainingPreview()">
            </div>
            <button class="btn-danger" style="padding: 8px 12px;" onclick="this.parentElement.remove(); updateTrainingPreview();">✕</button>
        </div>
    `;
}

// Dodaj ćwiczenie
function addExercise(dayNum) {
    const container = document.getElementById(`exercises${dayNum}`);
    const exNum = container.querySelectorAll('.exercise-row').length;
    container.insertAdjacentHTML('beforeend', createExerciseRow(dayNum, exNum));
}

// Aktualizacja podglądu planu treningowego
function updateTrainingPreview() {
    const preview = document.getElementById('pdfPreview');
    
    const clientId = document.getElementById('trainingClient').value;
    const title = document.getElementById('trainingTitle').value || 'Plan treningowy';
    const goal = document.getElementById('trainingGoal').value || '';
    
    let clientName = 'Imię Nazwisko';
    if (clientId) {
        const client = window.allClients.find(c => c.id === clientId);
        if (client) clientName = `${client.firstName} ${client.lastName}`;
    }
    
    const days = Array.from(document.querySelectorAll('.training-day')).map(dayEl => {
        const dayNum = dayEl.dataset.day;
        return {
            number: dayNum,
            name: document.getElementById(`dayName${dayNum}`)?.value || `Dzień ${dayNum}`,
            warmup: {
                part1: document.getElementById(`warmup1_${dayNum}`)?.value || '',
                part2: document.getElementById(`warmup2_${dayNum}`)?.value || '',
                part3: document.getElementById(`warmup3_${dayNum}`)?.value || ''
            },
            exercises: Array.from(dayEl.querySelectorAll('.exercise-row')).map(row => ({
                name: row.querySelector('.exercise-name').value,
                sets: row.querySelector('.exercise-sets').value,
                reps: row.querySelector('.exercise-reps').value,
                tempo: row.querySelector('.exercise-tempo').value,
                rest: row.querySelector('.exercise-rest').value
            })).filter(ex => ex.name)
        };
    });
    
    // Renderuj podgląd (tylko pierwszy dzień dla uproszczenia)
    const firstDay = days[0] || {};
    
    preview.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #000;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-family: 'Gagalin', Arial, sans-serif; font-size: 32px; color: #0ed145; margin: 0 0 10px 0;">${title.toUpperCase()}</h1>
                <p style="font-size: 18px; margin: 5px 0;"><strong>${clientName}</strong></p>
                ${goal ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">Cel: ${goal}</p>` : ''}
                <p style="font-size: 12px; color: #999;">Data utworzenia: ${new Date().toLocaleDateString('pl-PL')}</p>
            </div>
            
            <!-- Day -->
            <div style="margin-bottom: 30px;">
                <h2 style="font-family: 'Archivo Black', Arial, sans-serif; font-size: 24px; color: #0ed145; margin: 0 0 15px 0; border-bottom: 3px solid #0ed145; padding-bottom: 10px;">
                    ${firstDay.name || 'Dzień 1'}
                </h2>
                
                <!-- Warmup -->
                ${(firstDay.warmup?.part1 || firstDay.warmup?.part2 || firstDay.warmup?.part3) ? `
                    <div style="margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 8px;">
                        <h3 style="font-family: 'Archivo Black', Arial, sans-serif; font-size: 16px; margin: 0 0 10px 0;">ROZGRZEWKA</h3>
                        ${firstDay.warmup.part1 ? `<p style="margin: 5px 0;"><strong>1. Część ogólna:</strong> ${firstDay.warmup.part1}</p>` : ''}
                        ${firstDay.warmup.part2 ? `<p style="margin: 5px 0;"><strong>2. Część dynamiczna:</strong> ${firstDay.warmup.part2}</p>` : ''}
                        ${firstDay.warmup.part3 ? `<p style="margin: 5px 0;"><strong>3. Część specyficzna:</strong> ${firstDay.warmup.part3}</p>` : ''}
                    </div>
                ` : ''}
                
                <!-- Exercises Table -->
                ${firstDay.exercises && firstDay.exercises.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-family: 'Libre Baskerville', serif; font-size: 12px;">
                        <thead>
                            <tr style="background: #0ed145; color: white;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Ćwiczenie</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Serie</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Powtórzenia</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Tempo</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Przerwa</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${firstDay.exercises.map((ex, idx) => `
                                <tr style="${idx % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                                    <td style="padding: 10px; border: 1px solid #ddd;">${ex.name}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${ex.sets}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${ex.reps}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${ex.tempo}</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${ex.rest}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p style="color: #999; font-style: italic;">Dodaj ćwiczenia...</p>'}
            </div>
            
            ${days.length > 1 ? `<p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">... oraz ${days.length - 1} kolejnych dni</p>` : ''}
            
            <!-- Footer -->
            <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #0ed145; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 5px 0;"><strong>Jakub Bujakiewicz - Trener Personalny</strong></p>
                <p style="margin: 5px 0;">www.jakubbujakiewicz.pl | kontakt@jakubbujakiewicz.pl</p>
            </div>
        </div>
    `;
}

// Inicjalizacja kreatora diety
function initializeDietCreator() {
    const formContainer = document.getElementById('creatorForm');
    
    const formHtml = `
        <div class="form-group">
            <label>Wybierz podopiecznego</label>
            <select id="dietClient" class="form-control" onchange="updateDietPreview()">
                <option value="">-- Wybierz --</option>
                ${(window.allClients || []).map(client => 
                    `<option value="${client.id}">${client.firstName} ${client.lastName}</option>`
                ).join('')}
            </select>
        </div>
        
        <div class="form-group">
            <label>Tytuł diety *</label>
            <input type="text" id="dietTitle" class="form-control" placeholder="np. Dieta 2000 kcal" oninput="updateDietPreview()">
        </div>
        
        <div class="form-group">
            <label>Cel diety</label>
            <input type="text" id="dietGoal" class="form-control" placeholder="np. Redukcja tkanki tłuszczowej" oninput="updateDietPreview()">
        </div>
        
        <div class="form-group">
            <label>Kalorie (kcal)</label>
            <input type="number" id="dietCalories" class="form-control" placeholder="2000" oninput="updateDietPreview()">
        </div>
        
        <h4 style="margin: 30px 0 15px 0;">Posiłki</h4>
        <div id="mealsContainer">
            <!-- Dynamicznie generowane posiłki -->
        </div>
        
        <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="addMeal()">+ Dodaj posiłek</button>
    `;
    
    formContainer.innerHTML = formHtml;
    
    // Dodaj domyślne posiłki
    addMeal('Śniadanie');
    addMeal('II Śniadanie');
    addMeal('Obiad');
    addMeal('Podwieczorek');
    addMeal('Kolacja');
    
    updateDietPreview();
}

// Dodaj posiłek
let mealCounter = 0;
function addMeal(defaultName = '') {
    const container = document.getElementById('mealsContainer');
    mealCounter++;
    
    const mealHtml = `
        <div class="meal-section" data-meal="${mealCounter}" style="background: var(--bg-dark); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h5 style="margin: 0; color: var(--primary-green);">Posiłek ${mealCounter}</h5>
                <button class="btn-danger" style="padding: 5px 10px;" onclick="this.closest('.meal-section').remove(); updateDietPreview();">Usuń</button>
            </div>
            
            <div class="form-group">
                <label>Nazwa posiłku</label>
                <input type="text" class="meal-name form-control" value="${defaultName}" placeholder="np. Śniadanie" oninput="updateDietPreview()">
            </div>
            
            <div class="form-group">
                <label>Godzina (opcjonalnie)</label>
                <input type="time" class="meal-time form-control" oninput="updateDietPreview()">
            </div>
            
            <h6 style="margin: 15px 0 10px 0;">Produkty</h6>
            <div class="products-container" id="products${mealCounter}">
                ${createProductRow(mealCounter, 0)}
            </div>
            
            <button class="btn-secondary" style="width: 100%; margin-top: 10px; font-size: 13px;" onclick="addProduct(${mealCounter})">+ Dodaj produkt</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', mealHtml);
    updateDietPreview();
}

// Tworzenie wiersza produktu
function createProductRow(mealNum, prodNum, data = {}) {
    return `
        <div class="product-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: end;">
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 11px;">Produkt</label>
                <input type="text" class="form-control product-name" value="${data.name || ''}" placeholder="np. Owsianka" oninput="updateDietPreview()">
            </div>
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 11px;">Ilość</label>
                <input type="text" class="form-control product-amount" value="${data.amount || ''}" placeholder="50g" oninput="updateDietPreview()">
            </div>
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 11px;">Kcal</label>
                <input type="number" class="form-control product-kcal" value="${data.kcal || ''}" placeholder="0" oninput="updateDietPreview()">
            </div>
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 11px;">B</label>
                <input type="number" class="form-control product-protein" value="${data.protein || ''}" placeholder="0" oninput="updateDietPreview()">
            </div>
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 11px;">W</label>
                <input type="number" class="form-control product-carbs" value="${data.carbs || ''}" placeholder="0" oninput="updateDietPreview()">
            </div>
            <div class="form-group" style="margin: 0;">
                <label style="font-size: 11px;">T</label>
                <input type="number" class="form-control product-fat" value="${data.fat || ''}" placeholder="0" oninput="updateDietPreview()">
            </div>
            <button class="btn-danger" style="padding: 6px 10px; font-size: 12px;" onclick="this.parentElement.remove(); updateDietPreview();">✕</button>
        </div>
    `;
}

// Dodaj produkt
function addProduct(mealNum) {
    const container = document.getElementById(`products${mealNum}`);
    const prodNum = container.querySelectorAll('.product-row').length;
    container.insertAdjacentHTML('beforeend', createProductRow(mealNum, prodNum));
}

// Aktualizacja podglądu diety
function updateDietPreview() {
    const preview = document.getElementById('pdfPreview');
    
    const clientId = document.getElementById('dietClient').value;
    const title = document.getElementById('dietTitle').value || 'Plan dietetyczny';
    const goal = document.getElementById('dietGoal').value || '';
    const calories = document.getElementById('dietCalories').value || '';
    
    let clientName = 'Imię Nazwisko';
    if (clientId) {
        const client = window.allClients.find(c => c.id === clientId);
        if (client) clientName = `${client.firstName} ${client.lastName}`;
    }
    
    const meals = Array.from(document.querySelectorAll('.meal-section')).map(mealEl => {
        const mealName = mealEl.querySelector('.meal-name').value;
        const mealTime = mealEl.querySelector('.meal-time').value;
        
        const products = Array.from(mealEl.querySelectorAll('.product-row')).map(row => ({
            name: row.querySelector('.product-name').value,
            amount: row.querySelector('.product-amount').value,
            kcal: parseFloat(row.querySelector('.product-kcal').value) || 0,
            protein: parseFloat(row.querySelector('.product-protein').value) || 0,
            carbs: parseFloat(row.querySelector('.product-carbs').value) || 0,
            fat: parseFloat(row.querySelector('.product-fat').value) || 0
        })).filter(p => p.name);
        
        // Sumowanie makrosów dla posiłku
        const totals = products.reduce((acc, p) => ({
            kcal: acc.kcal + p.kcal,
            protein: acc.protein + p.protein,
            carbs: acc.carbs + p.carbs,
            fat: acc.fat + p.fat
        }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
        
        return { mealName, mealTime, products, totals };
    }).filter(m => m.mealName);
    
    // Sumowanie całości
    const grandTotals = meals.reduce((acc, m) => ({
        kcal: acc.kcal + m.totals.kcal,
        protein: acc.protein + m.totals.protein,
        carbs: acc.carbs + m.totals.carbs,
        fat: acc.fat + m.totals.fat
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
    
    preview.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #000;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-family: 'Gagalin', Arial, sans-serif; font-size: 32px; color: #0ed145; margin: 0 0 10px 0;">${title.toUpperCase()}</h1>
                <p style="font-size: 18px; margin: 5px 0;"><strong>${clientName}</strong></p>
                ${goal ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">Cel: ${goal}</p>` : ''}
                ${calories ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">Kalorie: ${calories} kcal</p>` : ''}
                <p style="font-size: 12px; color: #999;">Data utworzenia: ${new Date().toLocaleDateString('pl-PL')}</p>
            </div>
            
            <!-- Meals -->
            ${meals.map(meal => `
                <div style="margin-bottom: 25px;">
                    <h2 style="font-family: 'Archivo Black', Arial, sans-serif; font-size: 20px; color: #0ed145; margin: 0 0 10px 0;">
                        ${meal.mealName}${meal.mealTime ? ` - ${meal.mealTime}` : ''}
                    </h2>
                    
                    ${meal.products.length > 0 ? `
                        <table style="width: 100%; border-collapse: collapse; font-family: 'Libre Baskerville', serif; font-size: 11px; margin-bottom: 10px;">
                            <thead>
                                <tr style="background: #0ed145; color: white;">
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Produkt</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Ilość</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Kcal</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">B</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">W</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">T</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${meal.products.map((prod, idx) => `
                                    <tr style="${idx % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                                        <td style="padding: 8px; border: 1px solid #ddd;">${prod.name}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${prod.amount}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${prod.kcal}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${prod.protein}g</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${prod.carbs}g</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${prod.fat}g</td>
                                    </tr>
                                `).join('')}
                                <tr style="background: #e8f5e9; font-weight: bold;">
                                    <td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right;">SUMA:</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${meal.totals.kcal.toFixed(0)}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${meal.totals.protein.toFixed(1)}g</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${meal.totals.carbs.toFixed(1)}g</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${meal.totals.fat.toFixed(1)}g</td>
                                </tr>
                            </tbody>
                        </table>
                    ` : '<p style="color: #999; font-style: italic;">Dodaj produkty...</p>'}
                </div>
            `).join('')}
            
            <!-- Grand Total -->
            ${meals.length > 0 ? `
                <div style="margin-top: 30px; padding: 20px; background: #0ed145; color: white; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; font-family: 'Archivo Black', Arial, sans-serif;">SUMA CAŁKOWITA</h3>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; font-family: 'Libre Baskerville', serif;">
                        <div>
                            <div style="font-size: 24px; font-weight: bold;">${grandTotals.kcal.toFixed(0)}</div>
                            <div style="font-size: 12px; opacity: 0.9;">kcal</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold;">${grandTotals.protein.toFixed(1)}g</div>
                            <div style="font-size: 12px; opacity: 0.9;">Białko</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold;">${grandTotals.carbs.toFixed(1)}g</div>
                            <div style="font-size: 12px; opacity: 0.9;">Węglowodany</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold;">${grandTotals.fat.toFixed(1)}g</div>
                            <div style="font-size: 12px; opacity: 0.9;">Tłuszcze</div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Footer -->
            <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #0ed145; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 5px 0;"><strong>Jakub Bujakiewicz - Trener Personalny</strong></p>
                <p style="margin: 5px 0;">www.jakubbujakiewicz.pl | kontakt@jakubbujakiewicz.pl</p>
            </div>
        </div>
    `;
}

// Generowanie PDF
async function generatePDF(type) {
    showLoading(true);
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        if (type === 'training') {
            await generateTrainingPDF(doc);
        } else {
            await generateDietPDF(doc);
        }
        
        showToast('PDF wygenerowany pomyślnie!', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Błąd generowania PDF', 'error');
    } finally {
        showLoading(false);
    }
}

// Generowanie PDF planu treningowego
async function generateTrainingPDF(doc) {
    const title = document.getElementById('trainingTitle').value || 'Plan treningowy';
    const clientId = document.getElementById('trainingClient').value;
    const goal = document.getElementById('trainingGoal').value;
    
    let clientName = 'Imię Nazwisko';
    if (clientId) {
        const client = window.allClients.find(c => c.id === clientId);
        if (client) clientName = `${client.firstName} ${client.lastName}`;
    }
    
    // Pobierz dane dni
    const days = Array.from(document.querySelectorAll('.training-day')).map(dayEl => {
        const dayNum = dayEl.dataset.day;
        return {
            number: dayNum,
            name: document.getElementById(`dayName${dayNum}`)?.value || `Dzień ${dayNum}`,
            warmup: {
                part1: document.getElementById(`warmup1_${dayNum}`)?.value || '',
                part2: document.getElementById(`warmup2_${dayNum}`)?.value || '',
                part3: document.getElementById(`warmup3_${dayNum}`)?.value || ''
            },
            exercises: Array.from(dayEl.querySelectorAll('.exercise-row')).map(row => ({
                name: row.querySelector('.exercise-name').value,
                sets: row.querySelector('.exercise-sets').value,
                reps: row.querySelector('.exercise-reps').value,
                tempo: row.querySelector('.exercise-tempo').value,
                rest: row.querySelector('.exercise-rest').value
            })).filter(ex => ex.name)
        };
    });
    
    // Każdy dzień na osobnej stronie
    for (let i = 0; i < days.length; i++) {
        if (i > 0) doc.addPage();
        
        const day = days[i];
        let yPos = 20;
        
        // Nagłówek
        doc.setFontSize(24);
        doc.setTextColor(14, 209, 69);
        doc.text(title.toUpperCase(), 105, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(clientName, 105, yPos, { align: 'center' });
        yPos += 6;
        
        if (goal) {
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Cel: ${goal}`, 105, yPos, { align: 'center' });
            yPos += 6;
        }
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Data utworzenia: ${new Date().toLocaleDateString('pl-PL')}`, 105, yPos, { align: 'center' });
        yPos += 15;
        
        // Dzień
        doc.setFontSize(18);
        doc.setTextColor(14, 209, 69);
        doc.text(day.name, 20, yPos);
        yPos += 2;
        doc.setDrawColor(14, 209, 69);
        doc.setLineWidth(1);
        doc.line(20, yPos, 190, yPos);
        yPos += 10;
        
        // Rozgrzewka
        if (day.warmup.part1 || day.warmup.part2 || day.warmup.part3) {
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(20, yPos - 3, 170, 25, 2, 2, 'F');
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('ROZGRZEWKA', 25, yPos + 3);
            yPos += 8;
            
            doc.setFontSize(9);
            if (day.warmup.part1) {
                doc.text(`1. Część ogólna: ${day.warmup.part1}`, 25, yPos);
                yPos += 5;
            }
            if (day.warmup.part2) {
                doc.text(`2. Część dynamiczna: ${day.warmup.part2}`, 25, yPos);
                yPos += 5;
            }
            if (day.warmup.part3) {
                doc.text(`3. Część specyficzna: ${day.warmup.part3}`, 25, yPos);
                yPos += 5;
            }
            yPos += 5;
        }
        
        // Tabela ćwiczeń
        if (day.exercises.length > 0) {
            const tableData = day.exercises.map(ex => [ex.name, ex.sets, ex.reps, ex.tempo, ex.rest]);
            
            doc.autoTable({
                startY: yPos,
                head: [['Ćwiczenie', 'Serie', 'Powtórzenia', 'Tempo', 'Przerwa']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [14, 209, 69], fontSize: 10 },
                bodyStyles: { fontSize: 9 },
                alternateRowStyles: { fillColor: [249, 249, 249] },
                margin: { left: 20, right: 20 }
            });
        }
        
        // Stopka
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Jakub Bujakiewicz - Trener Personalny', 105, pageHeight - 15, { align: 'center' });
        doc.text('www.jakubbujakiewicz.pl | kontakt@jakubbujakiewicz.pl', 105, pageHeight - 10, { align: 'center' });
    }
    
    doc.save(`${title} - ${clientName}.pdf`);
}

// Generowanie PDF diety
async function generateDietPDF(doc) {
    const title = document.getElementById('dietTitle').value || 'Plan dietetyczny';
    const clientId = document.getElementById('dietClient').value;
    const goal = document.getElementById('dietGoal').value;
    const calories = document.getElementById('dietCalories').value;
    
    let clientName = 'Imię Nazwisko';
    if (clientId) {
        const client = window.allClients.find(c => c.id === clientId);
        if (client) clientName = `${client.firstName} ${client.lastName}`;
    }
    
    const meals = Array.from(document.querySelectorAll('.meal-section')).map(mealEl => {
        const mealName = mealEl.querySelector('.meal-name').value;
        const mealTime = mealEl.querySelector('.meal-time').value;
        
        const products = Array.from(mealEl.querySelectorAll('.product-row')).map(row => ({
            name: row.querySelector('.product-name').value,
            amount: row.querySelector('.product-amount').value,
            kcal: parseFloat(row.querySelector('.product-kcal').value) || 0,
            protein: parseFloat(row.querySelector('.product-protein').value) || 0,
            carbs: parseFloat(row.querySelector('.product-carbs').value) || 0,
            fat: parseFloat(row.querySelector('.product-fat').value) || 0
        })).filter(p => p.name);
        
        const totals = products.reduce((acc, p) => ({
            kcal: acc.kcal + p.kcal,
            protein: acc.protein + p.protein,
            carbs: acc.carbs + p.carbs,
            fat: acc.fat + p.fat
        }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
        
        return { mealName, mealTime, products, totals };
    }).filter(m => m.mealName);
    
    const grandTotals = meals.reduce((acc, m) => ({
        kcal: acc.kcal + m.totals.kcal,
        protein: acc.protein + m.totals.protein,
        carbs: acc.carbs + m.totals.carbs,
        fat: acc.fat + m.totals.fat
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
    
    let yPos = 20;
    
    // Nagłówek
    doc.setFontSize(24);
    doc.setTextColor(14, 209, 69);
    doc.text(title.toUpperCase(), 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(clientName, 105, yPos, { align: 'center' });
    yPos += 6;
    
    if (goal) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Cel: ${goal}`, 105, yPos, { align: 'center' });
        yPos += 6;
    }
    
    if (calories) {
        doc.text(`Kalorie: ${calories} kcal`, 105, yPos, { align: 'center' });
        yPos += 6;
    }
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Data utworzenia: ${new Date().toLocaleDateString('pl-PL')}`, 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Posiłki
    for (const meal of meals) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(14, 209, 69);
        doc.text(`${meal.mealName}${meal.mealTime ? ` - ${meal.mealTime}` : ''}`, 20, yPos);
        yPos += 8;
        
        if (meal.products.length > 0) {
            const tableData = meal.products.map(p => [
                p.name,
                p.amount,
                p.kcal.toString(),
                `${p.protein}g`,
                `${p.carbs}g`,
                `${p.fat}g`
            ]);
            
            tableData.push([
                { content: 'SUMA:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [232, 245, 233] } },
                { content: meal.totals.kcal.toFixed(0), styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } },
                { content: `${meal.totals.protein.toFixed(1)}g`, styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } },
                { content: `${meal.totals.carbs.toFixed(1)}g`, styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } },
                { content: `${meal.totals.fat.toFixed(1)}g`, styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } }
            ]);
            
            doc.autoTable({
                startY: yPos,
                head: [['Produkt', 'Ilość', 'Kcal', 'B', 'W', 'T']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [14, 209, 69], fontSize: 9 },
                bodyStyles: { fontSize: 8 },
                alternateRowStyles: { fillColor: [249, 249, 249] },
                margin: { left: 20, right: 20 }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
        }
    }
    
    // Suma całkowita
    if (meals.length > 0) {
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFillColor(14, 209, 69);
        doc.roundedRect(20, yPos, 170, 35, 3, 3, 'F');
        
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text('SUMA CAŁKOWITA', 105, yPos + 8, { align: 'center' });
        
        doc.setFontSize(10);
        const startX = 35;
        const spacing = 42.5;
        
        doc.text(`${grandTotals.kcal.toFixed(0)} kcal`, startX, yPos + 20, { align: 'center' });
        doc.text(`${grandTotals.protein.toFixed(1)}g Białko`, startX + spacing, yPos + 20, { align: 'center' });
        doc.text(`${grandTotals.carbs.toFixed(1)}g Węgle`, startX + spacing * 2, yPos + 20, { align: 'center' });
        doc.text(`${grandTotals.fat.toFixed(1)}g Tłuszcze`, startX + spacing * 3, yPos + 20, { align: 'center' });
    }
    
    // Stopka
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Jakub Bujakiewicz - Trener Personalny', 105, pageHeight - 15, { align: 'center' });
    doc.text('www.jakubbujakiewicz.pl | kontakt@jakubbujakiewicz.pl', 105, pageHeight - 10, { align: 'center' });
    
    doc.save(`${title} - ${clientName}.pdf`);
}

// Export funkcji
window.openTrainingCreator = openTrainingCreator;
window.openDietCreator = openDietCreator;
window.closeCreatorModal = closeCreatorModal;
window.updateTrainingPreview = updateTrainingPreview;
window.updateDietPreview = updateDietPreview;
window.generatePDF = generatePDF;
window.updateTrainingDays = updateTrainingDays;
window.addExercise = addExercise;
window.addMeal = addMeal;
window.addProduct = addProduct;
