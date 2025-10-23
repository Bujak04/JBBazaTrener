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
if (addMeasurementForm) {
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
}

// Wypełnianie listy klientów w select
function updateMeasurementClientSelect() {
    const select = document.getElementById('measurementClientSelect');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Wybierz klienta...</option>';
    
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
        
        // Renderuj statystyki progresu
        renderProgressStats(client);
        
        renderMeasurementsList(client);
        renderAllCharts(client);
        
        // Inicjalizuj pod-zakładki
        initializeMeasurementSubTabs();
        
    } catch (error) {
        console.error('Error loading measurements:', error);
        showToast('Błąd ładowania pomiarów', 'error');
    } finally {
        showLoading(false);
    }
}

// Inicjalizacja pod-zakładek w pomiarach
function initializeMeasurementSubTabs() {
    const subTabButtons = document.querySelectorAll('.measurement-sub-tab-btn');
    
    subTabButtons.forEach(button => {
        button.onclick = function() {
            const tabName = this.dataset.measurementTab;
            
            // Usuń active ze wszystkich pod-zakładek
            document.querySelectorAll('.measurement-sub-tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.measurement-sub-content').forEach(content => content.classList.remove('active'));
            
            // Dodaj active do wybranej pod-zakładki
            this.classList.add('active');
            const targetTab = document.getElementById(`measurement-${tabName}-tab`);
            
            if (targetTab) {
                targetTab.classList.add('active');
            }
        };
    });
}

// Funkcja renderująca statystyki progresu
function renderProgressStats(client) {
    const measurements = client.measurements || [];
    
    if (measurements.length < 2) {
        const statsTab = document.getElementById('measurement-stats-tab');
        if (statsTab) {
            statsTab.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <p>Potrzeba przynajmniej 2 pomiarów do analizy progresu</p>
                </div>
            `;
        }
        return;
    }
    
    // Sortuj chronologicznie
    const sorted = [...measurements].sort((a, b) => {
        const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
    });
    
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const beforeLast = sorted.length >= 2 ? sorted[sorted.length - 2] : first;
    
    // Oblicz różnice OD POCZĄTKU (pierwszy → ostatni)
    const weightDiffTotal = last.weight && first.weight ? (last.weight - first.weight).toFixed(1) : null;
    const chestDiffTotal = last.chest && first.chest ? (last.chest - first.chest).toFixed(1) : null;
    const shouldersDiffTotal = last.shoulders && first.shoulders ? (last.shoulders - first.shoulders).toFixed(1) : null;
    const neckDiffTotal = last.neck && first.neck ? (last.neck - first.neck).toFixed(1) : null;
    const bicepsRDiffTotal = last.bicepsR && first.bicepsR ? (last.bicepsR - first.bicepsR).toFixed(1) : null;
    const bicepsLDiffTotal = last.bicepsL && first.bicepsL ? (last.bicepsL - first.bicepsL).toFixed(1) : null;
    const forearmRDiffTotal = last.forearmR && first.forearmR ? (last.forearmR - first.forearmR).toFixed(1) : null;
    const forearmLDiffTotal = last.forearmL && first.forearmL ? (last.forearmL - first.forearmL).toFixed(1) : null;
    const waistDiffTotal = last.waist && first.waist ? (last.waist - first.waist).toFixed(1) : null;
    const thighRDiffTotal = last.thighR && first.thighR ? (last.thighR - first.thighR).toFixed(1) : null;
    const thighLDiffTotal = last.thighL && first.thighL ? (last.thighL - first.thighL).toFixed(1) : null;
    const calfRDiffTotal = last.calfR && first.calfR ? (last.calfR - first.calfR).toFixed(1) : null;
    const calfLDiffTotal = last.calfL && first.calfL ? (last.calfL - first.calfL).toFixed(1) : null;
    
    // Oblicz różnice OD OSTATNIEGO POMIARU (przedostatni → ostatni)
    const weightDiffRecent = last.weight && beforeLast.weight ? (last.weight - beforeLast.weight).toFixed(1) : null;
    const chestDiffRecent = last.chest && beforeLast.chest ? (last.chest - beforeLast.chest).toFixed(1) : null;
    const shouldersDiffRecent = last.shoulders && beforeLast.shoulders ? (last.shoulders - beforeLast.shoulders).toFixed(1) : null;
    const neckDiffRecent = last.neck && beforeLast.neck ? (last.neck - beforeLast.neck).toFixed(1) : null;
    const bicepsRDiffRecent = last.bicepsR && beforeLast.bicepsR ? (last.bicepsR - beforeLast.bicepsR).toFixed(1) : null;
    const bicepsLDiffRecent = last.bicepsL && beforeLast.bicepsL ? (last.bicepsL - beforeLast.bicepsL).toFixed(1) : null;
    const forearmRDiffRecent = last.forearmR && beforeLast.forearmR ? (last.forearmR - beforeLast.forearmR).toFixed(1) : null;
    const forearmLDiffRecent = last.forearmL && beforeLast.forearmL ? (last.forearmL - beforeLast.forearmL).toFixed(1) : null;
    const waistDiffRecent = last.waist && beforeLast.waist ? (last.waist - beforeLast.waist).toFixed(1) : null;
    const thighRDiffRecent = last.thighR && beforeLast.thighR ? (last.thighR - beforeLast.thighR).toFixed(1) : null;
    const thighLDiffRecent = last.thighL && beforeLast.thighL ? (last.thighL - beforeLast.thighL).toFixed(1) : null;
    const calfRDiffRecent = last.calfR && beforeLast.calfR ? (last.calfR - beforeLast.calfR).toFixed(1) : null;
    const calfLDiffRecent = last.calfL && beforeLast.calfL ? (last.calfL - beforeLast.calfL).toFixed(1) : null;
    
    const getArrow = (diff) => {
        if (!diff) return '';
        return parseFloat(diff) > 0 ? '📈' : parseFloat(diff) < 0 ? '📉' : '➡️';
    };
    
    const getClass = (diff, reverse = false) => {
        if (!diff) return '';
        const num = parseFloat(diff);
        if (reverse) {
            return num < 0 ? 'progress-positive' : num > 0 ? 'progress-negative' : '';
        }
        return num > 0 ? 'progress-positive' : num < 0 ? 'progress-negative' : '';
    };
    
    // Funkcja pomocnicza do generowania karty statystyki
    const generateStatCard = (label, diff, firstVal, lastVal, reverse = false) => {
        if (!diff) return '';
        
        let card = '<div class="stat-card ' + getClass(diff, reverse) + '">';
        card += '<div class="stat-icon">' + getArrow(diff) + '</div>';
        card += '<div class="stat-info">';
        card += '<h3>' + (diff > 0 ? '+' : '') + diff + ' ' + (label.includes('Waga') ? 'kg' : 'cm') + '</h3>';
        card += '<p>' + label + '</p>';
        
        if (firstVal && lastVal) {
            card += '<small style="color: var(--text-gray); display: block;">' + firstVal + ' → ' + lastVal + '</small>';
        }
        
        card += '</div>';
        card += '</div>';
        
        return card;
    };
    
    // Funkcja generująca pełny HTML statystyk
    const generateStatsHTML = (fromMeasure, toMeasure, weightDiff, chestDiff, shouldersDiff, neckDiff, bicepsRDiff, bicepsLDiff, forearmRDiff, forearmLDiff, waistDiff, thighRDiff, thighLDiff, calfRDiff, calfLDiff, title, icon) => {
        let statsHTML = '<div style="text-align: center; margin-bottom: 30px;">';
        statsHTML += '<h3 style="margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 24px;">';
        statsHTML += '<span style="font-size: 28px;">' + icon + '</span> ' + title;
        statsHTML += '</h3>';
        statsHTML += '<p style="color: var(--text-gray); font-size: 14px;">';
        statsHTML += 'Porównanie: <strong style="color: var(--primary-green);">' + formatDate(fromMeasure.date) + '</strong> → ';
        statsHTML += '<strong style="color: var(--primary-green);">' + formatDate(toMeasure.date) + '</strong>';
        statsHTML += '</p>';
        statsHTML += '</div>';
        
        // Sekcja: Waga ciała
        if (weightDiff) {
            statsHTML += '<div style="margin-bottom: 30px;">';
            statsHTML += '<h4 style="color: var(--text-white); margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">';
            statsHTML += '<span>⚖️</span> Waga ciała';
            statsHTML += '</h4>';
            statsHTML += '<div class="stats-grid" style="grid-template-columns: 1fr;">';
            statsHTML += '<div class="stat-card ' + getClass(weightDiff, true) + '" style="padding: 25px;">';
            statsHTML += '<div style="display: flex; align-items: center; gap: 20px;">';
            statsHTML += '<div class="stat-icon" style="font-size: 48px; width: 70px; height: 70px;">' + getArrow(weightDiff) + '</div>';
            statsHTML += '<div class="stat-info" style="flex: 1;">';
            statsHTML += '<h3 style="font-size: 36px; margin-bottom: 5px;">' + (weightDiff > 0 ? '+' : '') + weightDiff + ' kg</h3>';
            statsHTML += '<p style="font-size: 16px; margin-bottom: 5px;">Zmiana wagi</p>';
            statsHTML += '<small style="color: var(--text-gray); font-size: 15px;">' + fromMeasure.weight + ' kg → ' + toMeasure.weight + ' kg</small>';
            statsHTML += '</div>';
            statsHTML += '</div>';
            statsHTML += '</div>';
            statsHTML += '</div>';
            statsHTML += '</div>';
        }
        
        // Sekcja: Tułów
        const tulowStats = [chestDiff, shouldersDiff, neckDiff, waistDiff].filter(Boolean);
        if (tulowStats.length > 0) {
            statsHTML += '<div style="margin-bottom: 30px;">';
            statsHTML += '<h4 style="color: var(--text-white); margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">';
            statsHTML += '<span>💪</span> Tułów';
            statsHTML += '</h4>';
            statsHTML += '<div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">';
            
            statsHTML += generateStatCard('Klatka piersiowa', chestDiff, fromMeasure.chest, toMeasure.chest, false);
            statsHTML += generateStatCard('Barki', shouldersDiff, fromMeasure.shoulders, toMeasure.shoulders, false);
            statsHTML += generateStatCard('Szyja', neckDiff, fromMeasure.neck, toMeasure.neck, false);
            statsHTML += generateStatCard('Talia', waistDiff, fromMeasure.waist, toMeasure.waist, true);
            
            statsHTML += '</div>';
            statsHTML += '</div>';
        }
        
        // Sekcja: Ramiona
        const ramionaStats = [bicepsRDiff, bicepsLDiff, forearmRDiff, forearmLDiff].filter(Boolean);
        if (ramionaStats.length > 0) {
            statsHTML += '<div style="margin-bottom: 30px;">';
            statsHTML += '<h4 style="color: var(--text-white); margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">';
            statsHTML += '<span>🦾</span> Ramiona';
            statsHTML += '</h4>';
            statsHTML += '<div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">';
            
            statsHTML += generateStatCard('Biceps prawy', bicepsRDiff, fromMeasure.bicepsR, toMeasure.bicepsR, false);
            statsHTML += generateStatCard('Biceps lewy', bicepsLDiff, fromMeasure.bicepsL, toMeasure.bicepsL, false);
            statsHTML += generateStatCard('Przedramię prawe', forearmRDiff, fromMeasure.forearmR, toMeasure.forearmR, false);
            statsHTML += generateStatCard('Przedramię lewe', forearmLDiff, fromMeasure.forearmL, toMeasure.forearmL, false);
            
            statsHTML += '</div>';
            statsHTML += '</div>';
        }
        
        // Sekcja: Nogi
        const nogiStats = [thighRDiff, thighLDiff, calfRDiff, calfLDiff].filter(Boolean);
        if (nogiStats.length > 0) {
            statsHTML += '<div style="margin-bottom: 30px;">';
            statsHTML += '<h4 style="color: var(--text-white); margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">';
            statsHTML += '<span>🦵</span> Nogi';
            statsHTML += '</h4>';
            statsHTML += '<div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">';
            
            statsHTML += generateStatCard('Udo prawe', thighRDiff, fromMeasure.thighR, toMeasure.thighR, false);
            statsHTML += generateStatCard('Udo lewe', thighLDiff, fromMeasure.thighL, toMeasure.thighL, false);
            statsHTML += generateStatCard('Łydka prawa', calfRDiff, fromMeasure.calfR, toMeasure.calfR, false);
            statsHTML += generateStatCard('Łydka lewa', calfLDiff, fromMeasure.calfL, toMeasure.calfL, false);
            
            statsHTML += '</div>';
            statsHTML += '</div>';
        }
        
        return statsHTML;
    };
    
    // Generuj statystyki "Od początku"
    const statsHTMLTotal = generateStatsHTML(first, last, weightDiffTotal, chestDiffTotal, shouldersDiffTotal, neckDiffTotal, bicepsRDiffTotal, bicepsLDiffTotal, forearmRDiffTotal, forearmLDiffTotal, waistDiffTotal, thighRDiffTotal, thighLDiffTotal, calfRDiffTotal, calfLDiffTotal, 'Od początku', '📊');
    
    // Generuj statystyki "Od ostatniego pomiaru"
    const statsHTMLRecent = generateStatsHTML(beforeLast, last, weightDiffRecent, chestDiffRecent, shouldersDiffRecent, neckDiffRecent, bicepsRDiffRecent, bicepsLDiffRecent, forearmRDiffRecent, forearmLDiffRecent, waistDiffRecent, thighRDiffRecent, thighLDiffRecent, calfRDiffRecent, calfLDiffRecent, 'Od ostatniego pomiaru', '🔥');
    
    // Wstaw statystyki w odpowiednie zakładki
    const statsTotalTab = document.getElementById('measurement-stats-total-tab');
    const statsRecentTab = document.getElementById('measurement-stats-recent-tab');
    
    if (statsTotalTab) {
        statsTotalTab.innerHTML = '<div class="progress-stats-container">' + statsHTMLTotal + '</div>';
    }
    
    if (statsRecentTab) {
        statsRecentTab.innerHTML = '<div class="progress-stats-container">' + statsHTMLRecent + '</div>';
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
            
            openMeasurementModal(selectedMeasurementClient.id);
        });
    }
});

// Obsługa formularza dodawania pomiaru
async function handleMeasurementSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    
    // Obsłuż zarówno modalem z profilu klienta (dataset.clientId) jak i z zakładki pomiary (selectedMeasurementClient)
    let clientId = null;
    
    // Sprawdź w różnych miejscach gdzie może być zapisany clientId
    if (form.dataset.clientId) {
        clientId = form.dataset.clientId;
    } else if (window.currentMeasurementClientId) {
        clientId = window.currentMeasurementClientId;
    } else if (selectedMeasurementClient) {
        clientId = selectedMeasurementClient.id;
    }
    
    if (!clientId) {
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
        const clientRef = window.db.collection('clients').doc(clientId);
        const clientDoc = await clientRef.get();
        const clientData = clientDoc.data();
        
        const updatedMeasurements = [...(clientData.measurements || []), measurementData];
        
        await clientRef.update({
            measurements: updatedMeasurements
        });
        
        showToast('Pomiar dodany', 'success');
        document.getElementById('measurementModal').classList.remove('active');
        
        // Odśwież widok profilu klienta jeśli jest otwarty
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
        // Odśwież widok w zakładce pomiary jeśli klient jest wybrany
        if (selectedMeasurementClient && selectedMeasurementClient.id === clientId) {
            await loadClientMeasurements(clientId);
        }
        
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
            updatedAt: new Date()
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

// Renderowanie wszystkich wykresów
function renderAllCharts(client) {
    const measurements = client.measurements || [];
    
    if (measurements.length === 0) {
        return;
    }
    
    // Sortuj po dacie
    const sortedMeasurements = [...measurements].sort((a, b) => {
        const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
    });
    
    const labels = sortedMeasurements.map(m => formatDate(m.date));
    
    // Definicja wykresów dla wszystkich partii ciała
    const chartConfigs = [
        { id: 'weightChart', label: 'Waga (kg)', data: sortedMeasurements.map(m => m.weight || null), color: '#0ed145' },
        { id: 'chestChart', label: 'Klatka (cm)', data: sortedMeasurements.map(m => m.chest || null), color: '#1e90ff' },
        { id: 'shouldersChart', label: 'Barki (cm)', data: sortedMeasurements.map(m => m.shoulders || null), color: '#3498db' },
        { id: 'neckChart', label: 'Szyja (cm)', data: sortedMeasurements.map(m => m.neck || null), color: '#16a085' },
        { id: 'bicepsRChart', label: 'Biceps P (cm)', data: sortedMeasurements.map(m => m.bicepsR || null), color: '#9b59b6' },
        { id: 'bicepsLChart', label: 'Biceps L (cm)', data: sortedMeasurements.map(m => m.bicepsL || null), color: '#8e44ad' },
        { id: 'forearmRChart', label: 'Przedramię P (cm)', data: sortedMeasurements.map(m => m.forearmR || null), color: '#2ecc71' },
        { id: 'forearmLChart', label: 'Przedramię L (cm)', data: sortedMeasurements.map(m => m.forearmL || null), color: '#27ae60' },
        { id: 'waistChart', label: 'Talia (cm)', data: sortedMeasurements.map(m => m.waist || null), color: '#ff6b35' },
        { id: 'thighRChart', label: 'Udo P (cm)', data: sortedMeasurements.map(m => m.thighR || null), color: '#e74c3c' },
        { id: 'thighLChart', label: 'Udo L (cm)', data: sortedMeasurements.map(m => m.thighL || null), color: '#c0392b' },
        { id: 'calfRChart', label: 'Łydka P (cm)', data: sortedMeasurements.map(m => m.calfR || null), color: '#f39c12' },
        { id: 'calfLChart', label: 'Łydka L (cm)', data: sortedMeasurements.map(m => m.calfL || null), color: '#e67e22' }
    ];
    
    // Renderuj każdy wykres
    chartConfigs.forEach(config => {
        renderMeasurementChart(config.id, config.label, labels, config.data, config.color);
    });
}

// Funkcja renderująca pojedynczy wykres pomiarów
function renderMeasurementChart(canvasId, label, labels, data, color) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) return;
    
    // Sprawdź czy są jakiekolwiek dane
    const hasData = data.some(value => value !== null);
    
    if (!hasData) {
        canvas.style.display = 'none';
        canvas.parentElement.style.display = 'none';
        return;
    }
    
    canvas.style.display = 'block';
    canvas.parentElement.style.display = 'block';
    
    // Usuń poprzedni wykres jeśli istnieje
    const chartInstanceKey = `${canvasId}Instance`;
    if (window[chartInstanceKey]) {
        window[chartInstanceKey].destroy();
    }
    
    window[chartInstanceKey] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: `${color}20`,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: color,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#b0b0b0',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: '#2a2a2a',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b0b0',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: '#2a2a2a',
                        drawBorder: false
                    }
                }
            }
        }
    });
}

// Otwieranie modala pomiaru z pre-wypełnionym klientem
function openMeasurementModal(clientId = null) {
    const modal = document.getElementById('measurementModal');
    const form = document.getElementById('measurementForm');
    
    if (!modal || !form) {
        console.error('Measurement modal elements not found');
        return;
    }
    
    form.reset();
    
    // Zapisz clientId w różnych miejscach dla pewności
    if (clientId) {
        form.dataset.clientId = clientId;
        window.currentMeasurementClientId = clientId;
    } else if (selectedMeasurementClient) {
        form.dataset.clientId = selectedMeasurementClient.id;
        window.currentMeasurementClientId = selectedMeasurementClient.id;
    }
    
    // Ustaw dzisiejszą datę jako domyślną
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('measurementDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    modal.classList.add('active');
}

console.log('Measurements.js loaded');
// Eksporty globalne
window.handleMeasurementSubmit = handleMeasurementSubmit;
window.loadClientMeasurements = loadClientMeasurements;
window.deleteMeasurement = deleteMeasurement;
window.updateMeasurementClientSelect = updateMeasurementClientSelect;
window.openMeasurementModal = openMeasurementModal;
window.renderProgressStats = renderProgressStats;
window.renderAllCharts = renderAllCharts;
window.initializeMeasurementSubTabs = initializeMeasurementSubTabs;

