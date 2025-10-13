// This file manages service-related functionalities, including tracking active, expiring, and unpaid services.



// Function to get all services
async function getServices() {
    const servicesSnapshot = await window.db.collection('services').get();
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return services;
}

// Function to add a new service
async function addService(serviceData) {
    const serviceRef = await window.db.collection('services').add(serviceData);
    return serviceRef.id;
}

// Function to update a service
async function updateService(serviceId, updatedData) {
    await window.db.collection('services').doc(serviceId).update(updatedData);
}

// Function to delete a service
async function deleteService(serviceId) {
    await window.db.collection('services').doc(serviceId).delete();
}

// Function to get active services
async function getActiveServices() {
    const activeServicesSnapshot = await window.db.collection('services').where('status', '==', 'active').get();
    return activeServicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Function to get expiring services
async function getExpiringServices() {
    const expiringServicesSnapshot = await window.db.collection('services').where('status', '==', 'expiring').get();
    return expiringServicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Function to get unpaid services
async function getUnpaidServices() {
    const unpaidServicesSnapshot = await window.db.collection('services').where('status', '==', 'unpaid').get();
    return unpaidServicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Function to track service status updates
async function updateServiceStatus(serviceId, newStatus) {
    await window.db.collection('services').doc(serviceId).update({ status: newStatus });
}

// Otwieranie modala dodawania usługi
function openServiceModal(clientId) {
    const modal = document.getElementById('serviceModal');
    const form = document.getElementById('serviceForm');
    
    if (!modal || !form) {
        console.error('Service modal elements not found');
        return;
    }
    
    form.reset();
    form.dataset.clientId = clientId;
    
    // Ustaw dzisiejszą datę jako domyślną
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('serviceStartDate');
    if (startDateInput) {
        startDateInput.value = today;
    }
    
    modal.classList.add('active');
}

// Obsługa formularza dodawania usługi
async function handleServiceSubmit(e) {
    e.preventDefault();
    
    const clientId = e.target.dataset.clientId;
    
    if (!clientId) {
        showToast('Błąd: brak ID klienta', 'error');
        return;
    }
    
    const selectedTypes = Array.from(document.querySelectorAll('input[name="serviceType"]:checked'))
        .map(cb => cb.value);
    
    if (selectedTypes.length === 0) {
        showToast('Wybierz przynajmniej jedną usługę', 'warning');
        return;
    }
    
    const startDateInput = document.getElementById('serviceStartDate');
    const endDateInput = document.getElementById('serviceEndDate');
    const statusSelect = document.getElementById('serviceStatus');
    const notesTextarea = document.getElementById('serviceNotes');
    
    if (!startDateInput || !statusSelect) {
        showToast('Błąd: brak pól formularza', 'error');
        return;
    }
    
    const startDate = startDateInput.value;
    const endDate = endDateInput ? endDateInput.value : null;
    const status = statusSelect.value;
    const notes = notesTextarea ? notesTextarea.value.trim() : '';
    
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
        
        const now = new Date();
        const newServices = selectedTypes.map(type => {
            const service = {
                type: type,
                startDate: firebase.firestore.Timestamp.fromDate(new Date(startDate)),
                status: status,
                notes: notes,
                payment: {
                    isPaid: false,
                    amount: 0,
                    dueDate: null,
                    paidDate: null
                },
                createdAt: firebase.firestore.Timestamp.fromDate(now)
            };
            
            // Dodaj datę zakończenia tylko dla diety i planu treningowego
            // Prowadzenie nie ma daty zakończenia (ciągłe)
            if (type !== 'prowadzenie' && endDate) {
                service.endDate = firebase.firestore.Timestamp.fromDate(new Date(endDate));
            } else if (type === 'prowadzenie') {
                service.endDate = null;
            }
            
            return service;
        });
        
        const updatedServices = [...(clientData.services || []), ...newServices];
        
        // Aktualizuj status klienta
        const newStatus = calculateClientStatus(updatedServices);
        
        await clientRef.update({
            services: updatedServices,
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Usługi dodane pomyślnie', 'success');
        
        const modal = document.getElementById('serviceModal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Odśwież widok szczegółów klienta jeśli jest otwarty
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error adding services:', error);
        showToast('Błąd dodawania usług: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Przedłużanie prowadzenia
async function extendService(clientId, serviceIndex) {
    const days = prompt('O ile dni przedłużyć prowadzenie?', '30');
    
    if (!days || isNaN(days) || parseInt(days) <= 0) {
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
        const services = [...(clientData.services || [])];
        
        if (!services[serviceIndex]) {
            showToast('Nie znaleziono usługi', 'error');
            showLoading(false);
            return;
        }
        
        const service = services[serviceIndex];
        
        if (!service.endDate) {
            showToast('Usługa nie ma daty zakończenia', 'error');
            showLoading(false);
            return;
        }
        
        // Dodaj dni do daty zakończenia
        const currentEndDate = service.endDate.toDate();
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + parseInt(days));
        
        services[serviceIndex].endDate = firebase.firestore.Timestamp.fromDate(newEndDate);
        services[serviceIndex].status = 'aktywny';
        
        const newStatus = calculateClientStatus(services);
        
        await clientRef.update({
            services: services,
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`Prowadzenie przedłużone o ${days} dni`, 'success');
        
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error extending service:', error);
        showToast('Błąd przedłużania prowadzenia: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Kończenie prowadzenia
async function endService(clientId, serviceIndex) {
    if (!confirm('Czy na pewno chcesz zakończyć to prowadzenie?')) {
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
        const services = [...(clientData.services || [])];
        
        if (!services[serviceIndex]) {
            showToast('Nie znaleziono usługi', 'error');
            showLoading(false);
            return;
        }
        
        const service = services[serviceIndex];
        service.status = 'zakonczony';
        service.endedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        // Dodaj do historii usług
        await window.db.collection('services_history').add({
            clientId: clientId,
            clientName: `${clientData.firstName} ${clientData.lastName}`,
            service: service,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        services[serviceIndex] = service;
        
        const newStatus = calculateClientStatus(services);
        
        await clientRef.update({
            services: services,
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Prowadzenie zakończone', 'success');
        
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error ending service:', error);
        showToast('Błąd kończenia prowadzenia: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Usuwanie usługi
async function deleteService(clientId, serviceIndex) {
    if (!confirm('Czy na pewno chcesz usunąć tę usługę? Ta operacja jest nieodwracalna.')) {
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
        const services = [...(clientData.services || [])];
        
        if (!services[serviceIndex]) {
            showToast('Nie znaleziono usługi', 'error');
            showLoading(false);
            return;
        }
        
        // Usuń usługę z tablicy
        services.splice(serviceIndex, 1);
        
        // Przelicz nowy status klienta
        const newStatus = calculateClientStatus(services);
        
        await clientRef.update({
            services: services,
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Usługa została usunięta', 'success');
        
        // Odśwież widok szczegółów klienta jeśli jest otwarty
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
        // Odśwież zakładkę usług jeśli jest aktywna
        if (document.getElementById('services-tab').classList.contains('active')) {
            updateServicesTab();
        }
        
    } catch (error) {
        console.error('Error deleting service:', error);
        showToast('Błąd usuwania usługi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Obliczanie statusu klienta na podstawie usług
function calculateClientStatus(services) {
    if (!services || services.length === 0) {
        return 'nieaktywny';
    }
    
    const activeGuidance = services.find(s => 
        s.type === 'prowadzenie' && 
        s.status === 'aktywny' && 
        s.endDate
    );
    
    if (!activeGuidance) {
        return 'nieaktywny';
    }
    
    const today = new Date();
    const endDate = activeGuidance.endDate.toDate();
    const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEnd < 0) {
        return 'nieaktywny';
    } else if (daysUntilEnd <= 7) {
        return 'wygasa';
    } else {
        return 'aktywny';
    }
}

// Aktualizacja zakładki Usługi
function updateServicesTab() {
    updateServiceStats();
    updateServicesHistory();
}

// Aktualizacja statystyk usług
function updateServiceStats() {
    let dietCount = 0;
    let planCount = 0;
    let activeCoachingCount = 0;
    let expiringCoachingCount = 0;
    let unpaidCoachingCount = 0;
    
    if (window.allClients) {
        window.allClients.forEach(client => {
            if (client.services) {
                client.services.forEach(service => {
                    if (service.type === 'dieta' && service.status !== 'zakonczony') {
                        dietCount++;
                    }
                    if (service.type === 'plan_treningowy' && service.status !== 'zakonczony') {
                        planCount++;
                    }
                    if (service.type === 'prowadzenie') {
                        if (service.status === 'aktywny') {
                            const today = new Date();
                            const endDate = service.endDate ? service.endDate.toDate() : null;
                            
                            if (endDate) {
                                const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                                
                                if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
                                    expiringCoachingCount++;
                                } else if (daysUntilEnd > 7) {
                                    activeCoachingCount++;
                                }
                            }
                        } else if (service.status === 'nieoplacony') {
                            unpaidCoachingCount++;
                        }
                    }
                });
            }
        });
    }
    
    // Aktualizuj na stronie głównej
    const dietCountEl = document.getElementById('dietCount');
    const planCountEl = document.getElementById('planCount');
    const coachingCountEl = document.getElementById('coachingCount');
    
    if (dietCountEl) dietCountEl.textContent = dietCount;
    if (planCountEl) planCountEl.textContent = planCount;
    if (coachingCountEl) coachingCountEl.textContent = activeCoachingCount + expiringCoachingCount;
    
    // Aktualizuj w zakładce Usługi
    const activeCoachingEl = document.getElementById('activeCoaching');
    const expiringCoachingEl = document.getElementById('expiringCoaching');
    const unpaidCoachingEl = document.getElementById('unpaidCoaching');
    
    if (activeCoachingEl) activeCoachingEl.textContent = activeCoachingCount;
    if (expiringCoachingEl) expiringCoachingEl.textContent = expiringCoachingCount;
    if (unpaidCoachingEl) unpaidCoachingEl.textContent = unpaidCoachingCount;
}

// Aktualizacja historii usług
async function updateServicesHistory() {
    const container = document.getElementById('servicesHistory');
    
    if (!container) return;
    
    try {
        const snapshot = await window.db.collection('services_history')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>Brak zakończonych usług</p>
                </div>
            `;
            return;
        }
        
        const historyItems = [];
        snapshot.forEach(doc => {
            historyItems.push({ id: doc.id, ...doc.data() });
        });
        
        container.innerHTML = historyItems.map(item => {
            const service = item.service || {};
            return `
                <div class="service-history-item">
                    <div class="service-history-info">
                        <h4>${item.clientName || 'Nieznany klient'}</h4>
                        <p>
                            ${getServiceIcon(service.type)} ${getServiceLabel(service.type)}
                            ${service.startDate ? ` • ${formatDate(service.startDate)}` : ''}
                            ${service.endDate ? ` - ${formatDate(service.endDate)}` : ''}
                        </p>
                        ${service.notes ? `<p style="color: var(--text-gray); font-size: 13px;">${service.notes}</p>` : ''}
                    </div>
                    <span class="client-status" style="background: rgba(128,128,128,0.2); color: #888; border: 1px solid #666;">Zakończono</span>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading services history:', error);
        container.innerHTML = '<p style="color: var(--danger);">Błąd ładowania historii</p>';
    }
}

// Eksporty globalne
window.updateServicesTab = updateServicesTab;
window.openServiceModal = openServiceModal;
window.extendService = extendService;
window.endService = endService;
window.deleteService = deleteService;
window.handleServiceSubmit = handleServiceSubmit;

console.log('Services.js loaded');
