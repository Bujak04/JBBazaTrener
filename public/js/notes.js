// This file handles the creation and retrieval of notes associated with clients.

// Function to add a note for a specific client
function addNote(clientId, noteContent) {
    const note = {
        content: noteContent,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    window.db.collection('clients').doc(clientId).collection('notes').add(note)
        .then(() => {
            console.log('Note added successfully');
            // Optionally, refresh the notes list or provide feedback to the user
        })
        .catch((error) => {
            console.error('Error adding note: ', error);
        });
}

// Function to retrieve notes for a specific client
function getNotes(clientId) {
    window.db.collection('clients').doc(clientId).collection('notes').orderBy('timestamp', 'desc').get()
        .then((querySnapshot) => {
            const notes = [];
            querySnapshot.forEach((doc) => {
                notes.push({ id: doc.id, ...doc.data() });
            });
            displayNotes(notes);
        })
        .catch((error) => {
            console.error('Error retrieving notes: ', error);
        });
}

// Function to display notes in the UI
function displayNotes(notes) {
    const notesContainer = document.getElementById('notesContainer');
    notesContainer.innerHTML = ''; // Clear existing notes

    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.innerHTML = `
            <p>${note.content}</p>
            <small>${new Date(note.timestamp.toDate()).toLocaleString()}</small>
        `;
        notesContainer.appendChild(noteElement);
    });
}

// Obsługa formularza dodawania notatki
async function handleNoteSubmit(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('noteClientSelect').value;
    const content = document.getElementById('noteContent').value.trim();
    
    if (!content) {
        showToast('Wpisz treść notatki', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const noteData = {
            content: content,
            clientId: clientId || null,
            clientName: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: auth.currentUser.uid
        };
        
        // Jeśli notatka jest przypisana do klienta, pobierz jego imię
        if (clientId) {
            const clientDoc = await window.db.collection('clients').doc(clientId).get();
            const clientName = clientDoc.exists ? clientDoc.data().firstName + ' ' + clientDoc.data().lastName : 'Nieznany klient';
            noteData.clientName = clientName;
        }
        
        await window.db.collection('notes').add(noteData);
        
        showToast('Notatka dodana', 'success');
        document.getElementById('noteModal').classList.remove('active');
        document.getElementById('noteForm').reset();
        
        // Wywołaj callback jeśli został ustawiony (np. odświeżenie notatek w profilu)
        if (window.noteModalCallback) {
            window.noteModalCallback();
            window.noteModalCallback = null;
        }
        
        // Odśwież listę notatek w zakładce Notatki
        if (document.getElementById('notes-tab').classList.contains('active')) {
            renderNotesList();
        }
        
    } catch (error) {
        console.error('Error adding note:', error);
        showToast('Błąd dodawania notatki', 'error');
    } finally {
        showLoading(false);
    }
}

// Renderowanie listy notatek
async function renderNotesList() {
    const container = document.getElementById('notesList');
    
    if (!container) return;
    
    try {
        const snapshot = await window.db.collection('notes')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p>Brak notatek</p>
                </div>
            `;
            return;
        }
        
        const notes = [];
        snapshot.forEach(doc => {
            notes.push({ id: doc.id, ...doc.data() });
        });
        
        container.innerHTML = notes.map(note => `
            <div class="note-card">
                <div class="note-header">
                    ${note.clientName ? 
                        `<span class="note-client">${note.clientName}</span>` :
                        `<span class="note-client" style="color: var(--text-gray);">Ogólna notatka</span>`
                    }
                    <span class="note-date">${formatDate(note.createdAt)}</span>
                </div>
                <div class="note-content">${note.content}</div>
                <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-danger" onclick="deleteNote('${note.id}')">Usuń</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading notes:', error);
        container.innerHTML = '<p style="color: var(--danger);">Błąd ładowania notatek</p>';
    }
}

// Usuwanie notatki
async function deleteNote(noteId) {
    if (!confirm('Czy na pewno chcesz usunąć tę notatkę?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        await window.db.collection('notes').doc(noteId).delete();
        showToast('Notatka usunięta', 'success');
        renderNotesList();
    } catch (error) {
        console.error('Error deleting note:', error);
        showToast('Błąd usuwania notatki', 'error');
    } finally {
        showLoading(false);
    }
}

// Wypełnianie listy klientów w formularzu notatki
function populateNoteClientSelect() {
    const select = document.getElementById('noteClientSelect');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Ogólna notatka</option>';
    
    const allClients = window.allClients || [];
    
    allClients
        .sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
        })
        .forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.firstName} ${client.lastName}`;
            select.appendChild(option);
        });
}

// Otwieranie modala notatki z opcjonalnym callbackiem
function openNoteModal(clientId = null, callback = null) {
    const modal = document.getElementById('noteModal');
    const form = document.getElementById('noteForm');
    
    if (!modal || !form) {
        console.error('Note modal elements not found');
        return;
    }
    
    form.reset();
    
    // Ustaw callback który zostanie wywołany po zapisaniu
    if (callback) {
        window.noteModalCallback = callback;
    }
    
    // Jeśli podano clientId, ustaw go w selecte
    if (clientId) {
        populateNoteClientSelect();
        setTimeout(() => {
            document.getElementById('noteClientSelect').value = clientId;
        }, 100);
    } else {
        populateNoteClientSelect();
    }
    
    modal.classList.add('active');
}

console.log('Notes.js loaded');
// Eksporty globalne
window.renderNotesList = renderNotesList;
window.handleNoteSubmit = handleNoteSubmit;
window.deleteNote = deleteNote;
window.openNoteModal = openNoteModal;
window.populateNoteClientSelect = populateNoteClientSelect;
