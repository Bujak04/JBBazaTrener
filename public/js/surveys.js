// surveys.js - Zarządzanie ankietami dla usług

// ============================================
// ANKIETA DIETA
// ============================================

function openDietSurvey(clientId, serviceIndex) {
    const modal = document.getElementById('dietSurveyModal');
    const form = document.getElementById('dietSurveyForm');
    
    // Ustaw ID klienta i indeks usługi
    document.getElementById('dietSurveyClientId').value = clientId;
    document.getElementById('dietSurveyServiceIndex').value = serviceIndex;
    
    // Załaduj istniejące dane ankiety jeśli istnieją
    loadDietSurveyData(clientId, serviceIndex);
    
    modal.style.display = 'flex';
}

function closeDietSurvey() {
    const modal = document.getElementById('dietSurveyModal');
    const form = document.getElementById('dietSurveyForm');
    form.reset();
    modal.style.display = 'none';
}

async function loadDietSurveyData(clientId, serviceIndex) {
    try {
        const clientDoc = await window.db.collection('clients').doc(clientId).get();
        
        if (!clientDoc.exists) return;
        
        const clientData = clientDoc.data();
        const service = clientData.services?.[serviceIndex];
        
        if (service && service.survey) {
            // Wypełnij formularz istniejącymi danymi
            const survey = service.survey;
            Object.keys(survey).forEach(key => {
                const input = document.getElementById(`diet_${key}`);
                if (input) {
                    input.value = survey[key] || '';
                }
            });
        } else {
            // Autouzupełnij podstawowe dane klienta
            document.getElementById('diet_fullName').value = clientData.name || '';
            document.getElementById('diet_phone').value = clientData.phone || '';
            document.getElementById('diet_email').value = clientData.email || '';
        }
    } catch (error) {
        console.error('Error loading diet survey:', error);
    }
}

async function saveDietSurvey(event) {
    event.preventDefault();
    
    const clientId = document.getElementById('dietSurveyClientId').value;
    const serviceIndex = parseInt(document.getElementById('dietSurveyServiceIndex').value);
    
    // Zbierz dane z formularza
    const surveyData = {
        fullName: document.getElementById('diet_fullName').value,
        gender: document.getElementById('diet_gender').value,
        age: document.getElementById('diet_age').value,
        phone: document.getElementById('diet_phone').value,
        email: document.getElementById('diet_email').value,
        goals: document.getElementById('diet_goals').value,
        activityLevel: document.getElementById('diet_activityLevel').value,
        preferences: document.getElementById('diet_preferences').value,
        usesSupplements: document.getElementById('diet_usesSupplements').value,
        supplements: document.getElementById('diet_supplements').value,
        meals: document.getElementById('diet_meals').value,
        waterIntake: document.getElementById('diet_waterIntake').value,
        tastes: document.getElementById('diet_tastes').value,
        allergies: document.getElementById('diet_allergies').value,
        conditions: document.getElementById('diet_conditions').value,
        medications: document.getElementById('diet_medications').value,
        otherInfo: document.getElementById('diet_otherInfo').value,
        completedAt: new Date().toISOString()
    };
    
    showLoading(true);
    
    try {
        const clientRef = window.db.collection('clients').doc(clientId);
        const clientDoc = await clientRef.get();
        
        if (!clientDoc.exists) {
            showToast('Nie znaleziono klienta', 'error');
            return;
        }
        
        const clientData = clientDoc.data();
        const services = [...(clientData.services || [])];
        
        if (!services[serviceIndex]) {
            showToast('Nie znaleziono usługi', 'error');
            return;
        }
        
        // Dodaj ankietę do usługi
        services[serviceIndex].survey = surveyData;
        
        await clientRef.update({
            services: services,
            updatedAt: new Date()
        });
        
        showToast('Ankieta dietetyczna zapisana!', 'success');
        closeDietSurvey();
        
        // Odśwież widok klienta jeśli jest otwarty
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error saving diet survey:', error);
        showToast('Błąd zapisywania ankiety: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// ANKIETA PLAN TRENINGOWY
// ============================================

function openTrainingSurvey(clientId, serviceIndex) {
    const modal = document.getElementById('trainingSurveyModal');
    const form = document.getElementById('trainingSurveyForm');
    
    // Ustaw ID klienta i indeks usługi
    document.getElementById('trainingSurveyClientId').value = clientId;
    document.getElementById('trainingSurveyServiceIndex').value = serviceIndex;
    
    // Załaduj istniejące dane ankiety jeśli istnieją
    loadTrainingSurveyData(clientId, serviceIndex);
    
    modal.style.display = 'flex';
}

function closeTrainingSurvey() {
    const modal = document.getElementById('trainingSurveyModal');
    const form = document.getElementById('trainingSurveyForm');
    form.reset();
    modal.style.display = 'none';
}

async function loadTrainingSurveyData(clientId, serviceIndex) {
    try {
        const clientDoc = await window.db.collection('clients').doc(clientId).get();
        
        if (!clientDoc.exists) return;
        
        const clientData = clientDoc.data();
        const service = clientData.services?.[serviceIndex];
        
        if (service && service.survey) {
            // Wypełnij formularz istniejącymi danymi
            const survey = service.survey;
            Object.keys(survey).forEach(key => {
                const input = document.getElementById(`training_${key}`);
                if (input) {
                    input.value = survey[key] || '';
                }
            });
        } else {
            // Autouzupełnij podstawowe dane klienta
            document.getElementById('training_fullName').value = clientData.name || '';
            document.getElementById('training_phone').value = clientData.phone || '';
            document.getElementById('training_email').value = clientData.email || '';
        }
    } catch (error) {
        console.error('Error loading training survey:', error);
    }
}

async function saveTrainingSurvey(event) {
    event.preventDefault();
    
    const clientId = document.getElementById('trainingSurveyClientId').value;
    const serviceIndex = parseInt(document.getElementById('trainingSurveyServiceIndex').value);
    
    // Zbierz dane z formularza
    const surveyData = {
        fullName: document.getElementById('training_fullName').value,
        gender: document.getElementById('training_gender').value,
        age: document.getElementById('training_age').value,
        phone: document.getElementById('training_phone').value,
        email: document.getElementById('training_email').value,
        goals: document.getElementById('training_goals').value,
        level: document.getElementById('training_level').value,
        levelScale: document.getElementById('training_levelScale').value,
        experience: document.getElementById('training_experience').value,
        hadPlan: document.getElementById('training_hadPlan').value,
        equipment: document.getElementById('training_equipment').value,
        machines: document.getElementById('training_machines').value,
        preference: document.getElementById('training_preference').value,
        daysPerWeek: document.getElementById('training_daysPerWeek').value,
        duration: document.getElementById('training_duration').value,
        type: document.getElementById('training_type').value,
        injuries: document.getElementById('training_injuries').value,
        medications: document.getElementById('training_medications').value,
        restrictions: document.getElementById('training_restrictions').value,
        expectations: document.getElementById('training_expectations').value,
        otherInfo: document.getElementById('training_otherInfo').value,
        completedAt: new Date().toISOString()
    };
    
    showLoading(true);
    
    try {
        const clientRef = window.db.collection('clients').doc(clientId);
        const clientDoc = await clientRef.get();
        
        if (!clientDoc.exists) {
            showToast('Nie znaleziono klienta', 'error');
            return;
        }
        
        const clientData = clientDoc.data();
        const services = [...(clientData.services || [])];
        
        if (!services[serviceIndex]) {
            showToast('Nie znaleziono usługi', 'error');
            return;
        }
        
        // Dodaj ankietę do usługi
        services[serviceIndex].survey = surveyData;
        
        await clientRef.update({
            services: services,
            updatedAt: new Date()
        });
        
        showToast('Ankieta treningowa zapisana!', 'success');
        closeTrainingSurvey();
        
        // Odśwież widok klienta jeśli jest otwarty
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error saving training survey:', error);
        showToast('Błąd zapisywania ankiety: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// INICJALIZACJA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Formularze ankiet
    const dietForm = document.getElementById('dietSurveyForm');
    if (dietForm) {
        dietForm.addEventListener('submit', saveDietSurvey);
    }
    
    const trainingForm = document.getElementById('trainingSurveyForm');
    if (trainingForm) {
        trainingForm.addEventListener('submit', saveTrainingSurvey);
    }
    
    // Przyciski zamykania modali
    const dietModal = document.getElementById('dietSurveyModal');
    if (dietModal) {
        const closeBtn = dietModal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeDietSurvey);
        }
        
        // Zamknij po kliknięciu poza modal
        dietModal.addEventListener('click', (e) => {
            if (e.target === dietModal) {
                closeDietSurvey();
            }
        });
    }
    
    const trainingModal = document.getElementById('trainingSurveyModal');
    if (trainingModal) {
        const closeBtn = trainingModal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeTrainingSurvey);
        }
        
        // Zamknij po kliknięciu poza modal
        trainingModal.addEventListener('click', (e) => {
            if (e.target === trainingModal) {
                closeTrainingSurvey();
            }
        });
    }
});

// Eksport funkcji
window.openDietSurvey = openDietSurvey;
window.closeDietSurvey = closeDietSurvey;
window.openTrainingSurvey = openTrainingSurvey;
window.closeTrainingSurvey = closeTrainingSurvey;

console.log('✅ Surveys.js loaded');
