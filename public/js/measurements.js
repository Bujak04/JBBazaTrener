// This file manages client measurements, including adding new measurements and displaying progress charts.


const measurementsList = document.getElementById('measurements-list');
const addMeasurementForm = document.getElementById('add-measurement-form');
const clientId = localStorage.getItem('clientId'); // Assuming clientId is stored in localStorage

let selectedMeasurementClient = null;

// Function to fetch and display measurements for a specific client
function fetchMeasurements() {
    window.db.collection('clients').doc(clientId).get().then(doc => {
        if (doc.exists) {
            const measurements = doc.data().pomiary || [];
            measurementsList.innerHTML = '';
            measurements.forEach(measurement => {
                const li = document.createElement('li');
                li.textContent = `Data: ${measurement.data}, Waga: ${measurement.waga}, Klatka: ${measurement.klatka}`;
                measurementsList.appendChild(li);
            });
        } else {
            console.log('No such document!');
        }
    }).catch(error => {
        console.error('Error fetching measurements: ', error);
    });
}

// Function to add a new measurement
addMeasurementForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newMeasurement = {
        data: new Date().toLocaleDateString(),
        waga: addMeasurementForm.waga.value,
        klatka: addMeasurementForm.klatka.value,
        // Add other measurement fields as necessary
    };

    window.db.collection('clients').doc(clientId).update({
        pomiary: firebase.firestore.FieldValue.arrayUnion(newMeasurement)
    }).then(() => {
        fetchMeasurements();
        addMeasurementForm.reset();
    }).catch(error => {
        console.error('Error adding measurement: ', error);
    });
});

// Wypełnianie listy klientów w select
function updateMeasurementClientSelect() {
    const select = document.getElementById('measurementClientSelect');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Wybierz klienta...</option>';
    
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
    
    // Event listener na zmianę klienta
    select.addEventListener('change', async (e) => {
        const clientId = e.target.value;
        
        if (!clientId) {
            document.getElementById('measurementContent').style.display = 'none';
            return;
        }
        
        await loadClientMeasurements(clientId);
    });
}

// Ładowanie pomiarów klienta
async function loadClientMeasurements(clientId) {
    showLoading(true);
    
    try {
        const doc = await window.db.collection('clients').doc(clientId).get();
        
        if (!doc.exists) {
            showToast('Nie znaleziono klienta', 'error');
            return;
        }
        
        const client = { id: doc.id, ...doc.data() };
        selectedMeasurementClient = client;
        
        document.getElementById('selectedClientName').textContent = 
            `${client.firstName} ${client.lastName}`;
        
        document.getElementById('measurementContent').style.display = 'block';
        
        renderMeasurementsList(client);
        renderWeightChart(client);
        
    } catch (error) {
        console.error('Error loading measurements:', error);
        showToast('Błąd ładowania pomiarów', 'error');
    } finally {
        showLoading(false);
    }
}

// Renderowanie listy pomiarów
function renderMeasurementsList(client) {
    const container = document.getElementById('measurementsList');
    const measurements = client.measurements || [];
    
    if (measurements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📏</div>
                <p>Brak pomiarów dla tego klienta</p>
            </div>
        `;
        return;
    }
    
    // Sortuj od najnowszych
    measurements.sort((a, b) => {
        const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
    });
    
    container.innerHTML = measurements.map((m, index) => `
        <div class="measurement-card">
            <div class="measurement-header">
                <span class="measurement-date">${formatDate(m.date)}</span>
                <button class="btn-danger" onclick="deleteMeasurement('${client.id}', ${index})">Usuń</button>
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
                ${m.shoulders ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Barki</span>
                        <span class="measurement-value">${m.shoulders} cm</span>
                    </div>
                ` : ''}
                ${m.neck ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Szyja</span>
                        <span class="measurement-value">${m.neck} cm</span>
                    </div>
                ` : ''}
                ${m.bicepsL || m.bicepsR ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Biceps L/P</span>
                        <span class="measurement-value">${m.bicepsL || '-'} / ${m.bicepsR || '-'} cm</span>
                    </div>
                ` : ''}
                ${m.forearmL || m.forearmR ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Przedramię L/P</span>
                        <span class="measurement-value">${m.forearmL || '-'} / ${m.forearmR || '-'} cm</span>
                    </div>
                ` : ''}
                ${m.waist ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Talia</span>
                        <span class="measurement-value">${m.waist} cm</span>
                    </div>
                ` : ''}
                ${m.thighL || m.thighR ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Udo L/P</span>
                        <span class="measurement-value">${m.thighL || '-'} / ${m.thighR || '-'} cm</span>
                    </div>
                ` : ''}
                ${m.calfL || m.calfR ? `
                    <div class="measurement-item">
                        <span class="measurement-label">Łydka L/P</span>
                        <span class="measurement-value">${m.calfL || '-'} / ${m.calfR || '-'} cm</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Obsługa przycisku dodaj pomiar
document.addEventListener('DOMContentLoaded', () => {
    const addMeasurementBtn = document.getElementById('addMeasurementBtn');
    
    if (addMeasurementBtn) {
        addMeasurementBtn.addEventListener('click', () => {
            if (!selectedMeasurementClient) {
                showToast('Wybierz najpierw klienta', 'warning');
                return;
            }
            
            openMeasurementModal();
        });
    }
});

// Otwieranie modala dodawania pomiaru
function openMeasurementModal() {
    const modal = document.getElementById('measurementModal');
    const form = document.getElementById('measurementForm');
    
    form.reset();
    
    // Ustaw dzisiejszą datę
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('measurementDate').value = today;
    
    modal.classList.add('active');
}

// Obsługa formularza dodawania pomiaru
async function handleMeasurementSubmit(e) {
    e.preventDefault();
    
    if (!selectedMeasurementClient) {
        showToast('Brak wybranego klienta', 'error');
        return;
    }
    
    const measurementData = {
        date: firebase.firestore.Timestamp.fromDate(
            new Date(document.getElementById('measurementDate').value)
        ),
        weight: parseFloat(document.getElementById('measWeight').value) || null,
        chest: parseFloat(document.getElementById('measChest').value) || null,
        shoulders: parseFloat(document.getElementById('measShoulders').value) || null,
        neck: parseFloat(document.getElementById('measNeck').value) || null,
        bicepsL: parseFloat(document.getElementById('measBicepsL').value) || null,
        bicepsR: parseFloat(document.getElementById('measBicepsR').value) || null,
        forearmL: parseFloat(document.getElementById('measForearmL').value) || null,
        forearmR: parseFloat(document.getElementById('measForearmR').value) || null,
        waist: parseFloat(document.getElementById('measWaist').value) || null,
        thighL: parseFloat(document.getElementById('measThighL').value) || null,
        thighR: parseFloat(document.getElementById('measThighR').value) || null,
        calfL: parseFloat(document.getElementById('measCalfL').value) || null,
        calfR: parseFloat(document.getElementById('measCalfR').value) || null
    };
    
    showLoading(true);
    
    try {
        const clientRef = window.db.collection('clients').doc(selectedMeasurementClient.id);
        const clientDoc = await clientRef.get();
        const clientData = clientDoc.data();
        
        const updatedMeasurements = [...(clientData.measurements || []), measurementData];
        
        await clientRef.update({
            measurements: updatedMeasurements
        });
        
        showToast('Pomiar dodany', 'success');
        document.getElementById('measurementModal').classList.remove('active');
        
        // Odśwież widok
        await loadClientMeasurements(selectedMeasurementClient.id);
        
    } catch (error) {
        console.error('Error adding measurement:', error);
        showToast('Błąd dodawania pomiaru', 'error');
    } finally {
        showLoading(false);
    }
}

// Usuwanie pomiaru
async function deleteMeasurement(clientId, measurementIndex) {
    if (!confirm('Czy na pewno chcesz usunąć ten pomiar?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const clientRef = window.db.collection('clients').doc(clientId);
        const clientDoc = await clientRef.get();
        const clientData = clientDoc.data();
        
        const measurements = [...(clientData.measurements || [])];
        measurements.splice(measurementIndex, 1);
        
        await clientRef.update({
            measurements: measurements,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Pomiar usunięty', 'success');
        await loadClientMeasurements(clientId);
        
    } catch (error) {
        console.error('Error deleting measurement:', error);
        showToast('Błąd usuwania pomiaru', 'error');
    } finally {
        showLoading(false);
    }
}

// Wykres wagi (w charts.js)
function renderWeightChart(client) {
    const canvas = document.getElementById('weightChart');
    
    if (!canvas) return;
    
    const measurements = client.measurements || [];
    
    if (measurements.length === 0) {
        canvas.style.display = 'none';
        return;
    }
    
    canvas.style.display = 'block';
    
    // Sortuj po dacie
    const sortedMeasurements = [...measurements].sort((a, b) => {
        const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
    });
    
    const labels = sortedMeasurements.map(m => formatDate(m.date));
    const weights = sortedMeasurements.map(m => m.weight || null);
    
    // Usuń poprzedni wykres jeśli istnieje
    if (window.weightChartInstance) {
        window.weightChartInstance.destroy();
    }
    
    window.weightChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Waga (kg)',
                data: weights,
                borderColor: '#0ed145',
                backgroundColor: 'rgba(14, 209, 69, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#b0b0b0'
                    },
                    grid: {
                        color: '#2a2a2a'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b0b0'
                    },
                    grid: {
                        color: '#2a2a2a'
                    }
                }
            }
        }
    });
}

console.log('Measurements.js loaded');
// Eksporty globalne
window.handleMeasurementSubmit = handleMeasurementSubmit;
window.loadClientMeasurements = loadClientMeasurements;
window.deleteMeasurement = deleteMeasurement;
