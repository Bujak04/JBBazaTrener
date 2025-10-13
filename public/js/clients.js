// clients.js - This file manages client-related functionalities, such as adding, editing, deleting clients, and retrieving client data from Firestore.

// Globalna tablica klientów
let allClients = [];
window.allClients = allClients;

// Funkcja ładowania wszystkich klientów
async function loadAllClients() {
    try {
        const snapshot = await window.db.collection('clients').get();
        allClients = [];
        snapshot.forEach(doc => {
            allClients.push({ id: doc.id, ...doc.data() });
        });
        window.allClients = allClients;
        return allClients;
    } catch (error) {
        console.error('Error loading clients:', error);
        return [];
    }
}

// Function to retrieve all clients from Firestore
async function getClients() {
    const snapshot = await window.db.collection('clients').get();
    const clients = [];
    snapshot.forEach(doc => {
        clients.push({ id: doc.id, ...doc.data() });
    });
    return clients;
}

// Function to add a new client
async function addClient(clientData) {
    const { imieNazwisko, plec, wiek, telefon, email } = clientData;
    await window.db.collection('clients').add({
        imieNazwisko,
        plec,
        wiek,
        telefon,
        email,
        uslugi: [],
        notatki: [],
        pomiary: [],
        status: 'aktywny',
        archiwum: false
    });
}

// Function to edit an existing client
async function editClient(clientId, updatedData) {
    await window.db.collection('clients').doc(clientId).update(updatedData);
}

// Function to delete a client
async function deleteClient(clientId) {
    await window.db.collection('clients').doc(clientId).delete();
}

// Function to get client details by ID
async function getClientDetails(clientId) {
    const doc = await window.db.collection('clients').doc(clientId).get();
    return { id: doc.id, ...doc.data() };
}

// Function to filter clients based on status
async function filterClientsByStatus(status) {
    const snapshot = await clientsCollection.where('status', '==', status).get();
    const clients = [];
    snapshot.forEach(doc => {
        clients.push({ id: doc.id, ...doc.data() });
    });
    return clients;
}

// Function to update client status
async function updateClientStatus(clientId, status) {
    await clientsCollection.doc(clientId).update({ status });
}

// Obsługa formularza dodawania/edycji klienta
async function handleClientSubmit(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('clientId').value;
    const clientData = {
        firstName: document.getElementById('clientFirstName').value.trim(),
        lastName: document.getElementById('clientLastName').value.trim(),
        gender: document.getElementById('clientGender').value,
        age: parseInt(document.getElementById('clientAge').value),
        phone: document.getElementById('clientPhone').value.trim(),
        email: document.getElementById('clientEmail').value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    showLoading(true);
    
    try {
        if (clientId) {
            // Aktualizacja istniejącego klienta
            await window.db.collection('clients').doc(clientId).update(clientData);
            showToast('Klient zaktualizowany', 'success');
        } else {
            // Dodawanie nowego klienta
            clientData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            clientData.status = 'aktywny';
            clientData.services = [];
            clientData.measurements = [];
            clientData.files = [];
            
            await window.db.collection('clients').add(clientData);
            showToast('Klient dodany', 'success');
        }
        
        document.getElementById('clientModal').classList.remove('active');
    } catch (error) {
        console.error('Error saving client:', error);
        showToast('Błąd zapisywania klienta', 'error');
    } finally {
        showLoading(false);
    }
}

// Renderowanie listy klientów
function renderClientsList() {
    const container = document.getElementById('clientsList');
    const searchTerm = document.getElementById('clientSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    if (!container) return;
    
    // Użyj window.allClients zamiast lokalnego
    const allClients = window.allClients || [];
    
    // Filtrowanie klientów
    let filteredClients = allClients.filter(client => {
        const matchesSearch = 
            client.firstName.toLowerCase().includes(searchTerm) ||
            client.lastName.toLowerCase().includes(searchTerm);
            client.lastName.toLowerCase().includes(searchTerm);
        
        const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    // Sortowanie alfabetycznie
    filteredClients.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    if (filteredClients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👤</div>
                <p>Brak klientów do wyświetlenia</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredClients.map(client => `
        <div class="client-card" onclick="openClientDetails('${client.id}')">
            <div class="client-info">
                <h3>${client.firstName} ${client.lastName}</h3>
                <div class="client-meta">
                    <span>👤 ${client.gender === 'M' ? 'Mężczyzna' : 'Kobieta'}</span>
                    <span>🎂 ${client.age} lat</span>
                    ${client.phone ? `<span>📞 ${client.phone}</span>` : ''}
                    ${client.email ? `<span>📧 ${client.email}</span>` : ''}
                </div>
            </div>
            <div class="client-status status-${client.status}">
                ${getStatusLabel(client.status)}
            </div>
        </div>
    `).join('');
}

// Otwieranie modala dodawania/edycji klienta
function openClientModal(clientId = null) {
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');
    const title = document.getElementById('clientModalTitle');
    
    if (!modal || !form) {
        console.error('Client modal elements not found');
        return;
    }
    
    form.reset();
    
    if (clientId) {
        // Edycja klienta
        title.textContent = 'Edytuj klienta';
        document.getElementById('clientId').value = clientId;
        
        // Załaduj dane klienta
        const client = window.allClients.find(c => c.id === clientId);
        if (client) {
            document.getElementById('clientFirstName').value = client.firstName || '';
            document.getElementById('clientLastName').value = client.lastName || '';
            document.getElementById('clientGender').value = client.gender || 'M';
            document.getElementById('clientAge').value = client.age || '';
            document.getElementById('clientPhone').value = client.phone || '';
            document.getElementById('clientEmail').value = client.email || '';
        }
    } else {
        // Nowy klient
        title.textContent = 'Dodaj klienta';
        document.getElementById('clientId').value = '';
    }
    
    modal.classList.add('active');
}

// Otwieranie szczegółów klienta
async function openClientDetails(clientId) {
    showLoading(true);
    
    try {
        const doc = await window.db.collection('clients').doc(clientId).get();
        
        if (!doc.exists) {
            showToast('Nie znaleziono klienta', 'error');
            return;
        }
        
        const client = { id: doc.id, ...doc.data() };
        window.currentClient = client;
        
        renderClientDetails(client);
        
        const modal = document.getElementById('clientDetailsModal');
        modal.classList.add('active');
        
        // Event listenery dla przycisków w modalu
        setupClientDetailsButtons(client);
        
    } catch (error) {
        console.error('Error loading client details:', error);
        showToast('Błąd ładowania danych klienta', 'error');
    } finally {
        showLoading(false);
    }
}

// Renderowanie szczegółów klienta
function renderClientDetails(client) {
    document.getElementById('clientDetailsName').textContent = 
        `${client.firstName} ${client.lastName}`;
    
    // Oblicz liczbę dni od dodania klienta
    let daysSinceAdded = 0;
    let addedDateStr = 'Brak daty';
    if (client.createdAt) {
        const createdDate = client.createdAt.toDate ? client.createdAt.toDate() : new Date(client.createdAt);
        addedDateStr = formatDate(createdDate);
        const today = new Date();
        daysSinceAdded = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
    }
    
    // Dane osobowe
    const personalData = document.getElementById('clientPersonalData');
    personalData.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Płeć</span>
            <span class="detail-value">${client.gender === 'M' ? 'Mężczyzna' : 'Kobieta'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Wiek</span>
            <span class="detail-value">${client.age} lat</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Telefon</span>
            <span class="detail-value">${client.phone || 'Brak'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Email</span>
            <span class="detail-value">${client.email || 'Brak'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Data dodania</span>
            <span class="detail-value" style="cursor: pointer;" onclick="changeClientAddedDate('${client.id}', '${addedDateStr}')" title="Kliknij aby zmienić datę">
                ${addedDateStr} <span style="color: var(--text-gray); font-size: 13px;">(${daysSinceAdded} dni)</span>
            </span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Status</span>
            <span class="detail-value">
                <select class="status-select" id="clientStatusSelect" onchange="changeClientStatus('${client.id}', this.value)" style="padding: 5px 10px; border: 1px solid var(--primary-green); background: var(--card-bg); color: var(--text-color); border-radius: 5px;">
                    <option value="aktywny" ${client.status === 'aktywny' ? 'selected' : ''}>Aktywny</option>
                    <option value="nieaktywny" ${client.status === 'nieaktywny' ? 'selected' : ''}>Nieaktywny</option>
                    <option value="wygasa" ${client.status === 'wygasa' ? 'selected' : ''}>Wygasa</option>
                </select>
            </span>
        </div>
    `;
    
    // Usługi
    renderClientServices(client);
    
    // Notatki
    renderClientNotes(client.id);
    
    // Pomiary
    renderClientMeasurements(client);
    
    // Pliki
    renderClientFiles(client);
}

// Renderowanie usług klienta
function renderClientServices(client) {
    const container = document.getElementById('clientServices');
    const services = client.services || [];
    
    if (services.length === 0) {
        container.innerHTML = '<p style="color: var(--text-gray);">Brak usług</p>';
        return;
    }
    
    container.innerHTML = services.map((service, index) => `
        <div class="service-item">
            <div class="service-info">
                <div class="service-type">${getServiceIcon(service.type)} ${getServiceLabel(service.type)}</div>
                <div class="service-dates">
                    ${service.startDate ? `Start: ${formatDate(service.startDate)}` : ''}
                    ${service.endDate ? ` • Koniec: ${formatDate(service.endDate)}` : ''}
                </div>
                ${service.notes ? `<div style="color: var(--text-gray); font-size: 13px; margin-top: 5px;">${service.notes}</div>` : ''}
                ${service.survey ? `<div style="color: var(--primary-green); font-size: 12px; margin-top: 5px;">✅ Ankieta wypełniona (${new Date(service.survey.completedAt).toLocaleDateString('pl-PL')})</div>` : ''}
            </div>
            <div class="service-actions">
                <span class="client-status status-${service.status}">${getStatusLabel(service.status)}</span>
                ${service.type === 'dieta' ? (
                    service.survey ? `
                        <button class="btn-primary" onclick="viewDietSurvey('${client.id}', ${index})" style="margin-left: 5px;">
                            📊 Pokaż dane
                        </button>
                        <button class="btn-secondary" onclick="openDietSurvey('${client.id}', ${index})" style="margin-left: 5px;">
                            ✏️ Edytuj
                        </button>
                    ` : `
                        <button class="btn-secondary" onclick="openDietSurvey('${client.id}', ${index})" style="margin-left: 5px;">
                            📋 Wypełnij ankietę
                        </button>
                    `
                ) : ''}
                ${service.type === 'plan_treningowy' ? (
                    service.survey ? `
                        <button class="btn-primary" onclick="viewTrainingSurvey('${client.id}', ${index})" style="margin-left: 5px;">
                            📊 Pokaż dane
                        </button>
                        <button class="btn-secondary" onclick="openTrainingSurvey('${client.id}', ${index})" style="margin-left: 5px;">
                            ✏️ Edytuj
                        </button>
                    ` : `
                        <button class="btn-secondary" onclick="openTrainingSurvey('${client.id}', ${index})" style="margin-left: 5px;">
                            📋 Wypełnij ankietę
                        </button>
                    `
                ) : ''}
                ${service.type === 'prowadzenie' && service.status === 'aktywny' ? `
                    <button class="btn-secondary" onclick="extendService('${client.id}', ${index})">Przedłuż</button>
                    <button class="btn-danger" onclick="endService('${client.id}', ${index})">Zakończ</button>
                ` : ''}
                <button class="btn-danger" onclick="deleteService('${client.id}', ${index})" style="margin-left: 5px;">Usuń</button>
            </div>
        </div>
    `).join('');
}

// Renderowanie notatek klienta
async function renderClientNotes(clientId) {
    const container = document.getElementById('clientNotes');
    
    try {
        const snapshot = await db.collection('notes')
            .where('clientId', '==', clientId)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-gray);">Brak notatek</p>';
            return;
        }
        
        const notes = [];
        snapshot.forEach(doc => {
            notes.push({ id: doc.id, ...doc.data() });
        });
        
        container.innerHTML = notes.map(note => `
            <div class="note-card">
                <div class="note-header">
                    <span class="note-date">${formatDate(note.createdAt)}</span>
                </div>
                <div class="note-content">${note.content}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading client notes:', error);
        container.innerHTML = '<p style="color: var(--danger);">Błąd ładowania notatek</p>';
    }
}

// Renderowanie pomiarów klienta
function renderClientMeasurements(client) {
    const container = document.getElementById('clientMeasurements');
    const measurements = client.measurements || [];
    
    if (measurements.length === 0) {
        container.innerHTML = '<p style="color: var(--text-gray);">Brak pomiarów</p>';
        return;
    }
    
    // Sortuj od najnowszych, pokaż tylko 3 ostatnie
    const sortedMeasurements = [...measurements].sort((a, b) => {
        const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
    }).slice(0, 3);
    
    container.innerHTML = sortedMeasurements.map((m) => {
        // Znajdź właściwy index w oryginalnej tablicy
        const originalIndex = measurements.findIndex(measurement => {
            const mDate = m.date.toDate ? m.date.toDate().getTime() : new Date(m.date).getTime();
            const measDate = measurement.date.toDate ? measurement.date.toDate().getTime() : new Date(measurement.date).getTime();
            return measDate === mDate && measurement.weight === m.weight;
        });
        
        return `
        <div class="measurement-card">
            <div class="measurement-header">
                <span class="measurement-date">${formatDate(m.date)}</span>
                <button class="btn-danger" onclick="deleteClientMeasurement('${client.id}', ${originalIndex})" style="padding: 3px 8px; font-size: 12px;">Usuń</button>
            </div>
            <div class="measurement-grid">
                ${m.weight ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Waga</span>
                        <span class="measurement-value">${m.weight} kg</span>
                    </div>
                ` : ''}
                ${m.chest ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Klatka</span>
                        <span class="measurement-value">${m.chest} cm</span>
                    </div>
                ` : ''}
                ${m.waist ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Talia</span>
                        <span class="measurement-value">${m.waist} cm</span>
                    </div>
                ` : ''}
                ${m.bicepsL || m.bicepsR ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Biceps L/P</span>
                        <span class="measurement-value">${m.bicepsL || '-'} / ${m.bicepsR || '-'} cm</span>
                    </div>
                ` : ''}
                ${m.thighL || m.thighR ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Udo L/P</span>
                        <span class="measurement-value">${m.thighL || '-'} / ${m.thighR || '-'} cm</span>
                    </div>
                ` : ''}
            </div>
        </div>
        `;
    }).join('');
    
    // Dodaj link do wszystkich pomiarów jeśli jest ich więcej niż 3
    if (measurements.length > 3) {
        container.innerHTML += `
            <p style="text-align: center; margin-top: 10px; color: var(--primary-green); cursor: pointer;" onclick="switchTab('measurements')">
                Zobacz wszystkie pomiary (${measurements.length}) →
            </p>
        `;
    }
}

// Renderowanie plików klienta
function renderClientFiles(client) {
    const container = document.getElementById('clientFiles');
    const files = client.files || [];
    
    if (files.length === 0) {
        container.innerHTML = '<p style="color: var(--text-gray);">Brak plików</p>';
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="file-item">
            <div class="file-info">
                <span class="file-icon">${getFileIcon(file.type)}</span>
                <div>
                    <div class="file-name">${file.name}</div>
                    ${file.description ? `<div class="file-size">${file.description}</div>` : ''}
                    <div class="file-size">Dodano: ${formatDate(file.uploadedAt)}</div>
                </div>
            </div>
            <div class="service-actions">
                <button class="btn-secondary" onclick="downloadFile('${file.url}', '${file.name}')">Pobierz</button>
                <button class="btn-danger" onclick="deleteFile('${client.id}', '${file.id}')">Usuń</button>
            </div>
        </div>
    `).join('');
}

// Setup przycisków w szczegółach klienta
function setupClientDetailsButtons(client) {
    // Edytuj klienta
    document.getElementById('editClientBtn').onclick = () => {
        document.getElementById('clientDetailsModal').classList.remove('active');
        openClientModal(client);
    };
    
    // Dodaj usługę
    document.getElementById('addServiceBtn').onclick = () => {
        openServiceModal(client.id);
    };
    
    // Dodaj notatkę
    document.getElementById('addClientNoteBtn').onclick = () => {
        // NIE zamykaj profilu, tylko otwórz modal notatki
        openNoteModal(client.id);
    };
    
    // Dodaj pomiar
    document.getElementById('addClientMeasurementBtn').onclick = () => {
        // NIE zamykaj profilu, tylko otwórz modal pomiaru z pre-wypełnionym klientem
        if (window.openMeasurementModal) {
            window.openMeasurementModal(client.id);
        } else {
            // Fallback - jeśli nie ma funkcji, użyj starego sposobu
            document.getElementById('clientDetailsModal').classList.remove('active');
            switchTab('measurements');
            setTimeout(() => {
                if (window.updateMeasurementClientSelect) {
                    window.updateMeasurementClientSelect();
                    document.getElementById('measurementClientSelect').value = client.id;
                    if (window.loadClientMeasurements) {
                        window.loadClientMeasurements(client);
                    }
                }
            }, 100);
        }
    };
    
    // Upload pliku
    document.getElementById('uploadFileBtn').onclick = () => {
        openFileUploadModal(client.id);
    };
    
    // Usuń klienta
    document.getElementById('deleteClientBtn').onclick = () => {
        deleteClient(client.id);
    };
}

// Usuwanie klienta
async function deleteClient(clientId) {
    if (!confirm('Czy na pewno chcesz usunąć tego klienta? Tej operacji nie można cofnąć.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        await db.collection('clients').doc(clientId).delete();
        
        // Usuń powiązane notatki
        const notesSnapshot = await db.collection('notes')
            .where('clientId', '==', clientId)
            .get();
        
        const batch = db.batch();
        notesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        showToast('Klient usunięty', 'success');
        document.getElementById('clientDetailsModal').classList.remove('active');
        
    } catch (error) {
        console.error('Error deleting client:', error);
        showToast('Błąd usuwania klienta', 'error');
    } finally {
        showLoading(false);
    }
}

// Pomocnicze funkcje
function getStatusLabel(status) {
    const labels = {
        'aktywny': 'Aktywny',
        'wygasa': 'Wygasa',
        'nieaktywny': 'Nieaktywny',
        'nieoplacony': 'Nieopłacony'
    };
    return labels[status] || status;
}

function getServiceLabel(type) {
    const labels = {
        'dieta': 'Dieta',
        'plan_treningowy': 'Plan treningowy',
        'prowadzenie': 'Prowadzenie',
        'wspolpraca_prywatna': 'Współpraca prywatna'
    };
    return labels[type] || type;
}

function getServiceIcon(type) {
    const icons = {
        'dieta': '🥗',
        'plan_treningowy': '💪',
        'prowadzenie': '📊',
        'wspolpraca_prywatna': '🤝'
    };
    return icons[type] || '📋';
}

function getFileIcon(type) {
    const icons = {
        'pdf': '📄',
        'image': '🖼️',
        'dieta': '🥗',
        'plan': '💪',
        'zdjecie': '📸',
        'inny': '📎'
    };
    return icons[type] || '📎';
}

// Zmiana statusu klienta
async function changeClientStatus(clientId, newStatus) {
    showLoading(true);
    
    try {
        await window.db.collection('clients').doc(clientId).update({
            status: newStatus
        });
        
        showToast('Status zmieniony', 'success');
        
        // Odśwież widok szczegółów
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error changing status:', error);
        showToast('Błąd zmiany statusu', 'error');
    } finally {
        showLoading(false);
    }
}

// Usuwanie pomiaru klienta
async function deleteClientMeasurement(clientId, measurementIndex) {
    if (!confirm('Czy na pewno chcesz usunąć ten pomiar?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const clientRef = window.db.collection('clients').doc(clientId);
        const clientDoc = await clientRef.get();
        
        if (!clientDoc.exists) {
            showToast('Nie znaleziono klienta', 'error');
            showLoading(false);
            return;
        }
        
        const clientData = clientDoc.data();
        const measurements = [...(clientData.measurements || [])];
        
        if (!measurements[measurementIndex]) {
            showToast('Nie znaleziono pomiaru', 'error');
            showLoading(false);
            return;
        }
        
        // Usuń pomiar z tablicy
        measurements.splice(measurementIndex, 1);
        
        await clientRef.update({
            measurements: measurements,
            updatedAt: new Date()
        });
        
        showToast('Pomiar usunięty', 'success');
        
        // Odśwież widok szczegółów klienta
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error deleting measurement:', error);
        showToast('Błąd usuwania pomiaru: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Zmiana daty dodania klienta
async function changeClientAddedDate(clientId, currentDate) {
    const newDate = prompt('Podaj nową datę dodania klienta (RRRR-MM-DD):', currentDate);
    
    if (!newDate) {
        return;
    }
    
    // Walidacja daty
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDate)) {
        showToast('Nieprawidłowy format daty. Użyj RRRR-MM-DD', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await window.db.collection('clients').doc(clientId).update({
            createdAt: firebase.firestore.Timestamp.fromDate(new Date(newDate))
        });
        
        showToast('Data dodania zmieniona', 'success');
        
        // Odśwież widok szczegółów
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error changing added date:', error);
        showToast('Błąd zmiany daty', 'error');
    } finally {
        showLoading(false);
    }
}


// Eksporty globalne
window.handleClientSubmit = handleClientSubmit;
window.renderClientsList = renderClientsList;
window.openClientDetails = openClientDetails;
window.openClientModal = openClientModal;
window.deleteClient = deleteClient;
window.changeClientStatus = changeClientStatus;
window.deleteClientMeasurement = deleteClientMeasurement;
window.changeClientAddedDate = changeClientAddedDate;

console.log('✅ Clients.js loaded');

