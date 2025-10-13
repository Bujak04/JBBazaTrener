// clients.js - This file manages client-related functionalities, such as adding, editing, deleting clients, and retrieving client data from Firestore.

const db = firebase.firestore();
const clientsCollection = db.collection('clients');

// Function to retrieve all clients from Firestore
async function getClients() {
    const snapshot = await clientsCollection.get();
    const clients = [];
    snapshot.forEach(doc => {
        clients.push({ id: doc.id, ...doc.data() });
    });
    return clients;
}

// Function to add a new client
async function addClient(clientData) {
    const { imieNazwisko, plec, wiek, telefon, email } = clientData;
    await clientsCollection.add({
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
    await clientsCollection.doc(clientId).update(updatedData);
}

// Function to delete a client
async function deleteClient(clientId) {
    await clientsCollection.doc(clientId).delete();
}

// Function to get client details by ID
async function getClientDetails(clientId) {
    const doc = await clientsCollection.doc(clientId).get();
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
            await db.collection('clients').doc(clientId).update(clientData);
            showToast('Klient zaktualizowany', 'success');
        } else {
            // Dodawanie nowego klienta
            clientData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            clientData.status = 'nieaktywny';
            clientData.services = [];
            clientData.measurements = [];
            clientData.files = [];
            
            await db.collection('clients').add(clientData);
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
    
    // Filtrowanie klientów
    let filteredClients = allClients.filter(client => {
        const matchesSearch = 
            client.firstName.toLowerCase().includes(searchTerm) ||
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

// Otwieranie szczegółów klienta
async function openClientDetails(clientId) {
    showLoading(true);
    
    try {
        const doc = await db.collection('clients').doc(clientId).get();
        
        if (!doc.exists) {
            showToast('Nie znaleziono klienta', 'error');
            return;
        }
        
        const client = { id: doc.id, ...doc.data() };
        currentClient = client;
        
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
            <span class="detail-label">Status</span>
            <span class="detail-value">
                <span class="client-status status-${client.status}">
                    ${getStatusLabel(client.status)}
                </span>
            </span>
        </div>
    `;
    
    // Usługi
    renderClientServices(client);
    
    // Notatki
    renderClientNotes(client.id);
    
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
            </div>
            <div class="service-actions">
                <span class="client-status status-${service.status}">${getStatusLabel(service.status)}</span>
                ${service.type === 'prowadzenie' && service.status === 'aktywny' ? `
                    <button class="btn-secondary" onclick="extendService('${client.id}', ${index})">Przedłuż</button>
                    <button class="btn-danger" onclick="endService('${client.id}', ${index})">Zakończ</button>
                ` : ''}
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
        document.getElementById('clientDetailsModal').classList.remove('active');
        openNoteModal(client.id);
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
        'prowadzenie': 'Prowadzenie'
    };
    return labels[type] || type;
}

function getServiceIcon(type) {
    const icons = {
        'dieta': '🥗',
        'plan_treningowy': '💪',
        'prowadzenie': '📊'
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

// Eksporty globalne
window.handleClientSubmit = handleClientSubmit;
window.renderClientsList = renderClientsList;
window.openClientDetails = openClientDetails;
window.openClientModal = openClientModal;
window.deleteClient = deleteClient;

console.log('✅ Clients.js loaded');
