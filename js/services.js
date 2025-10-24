// This file manages service-related functionalities, including tracking active, expiring, and unpaid services.

// Domyślny cennik usług (przechowywany w Firebase)
let servicePricing = {
    dieta: 0,
    plan_treningowy: 0,
    prowadzenie: 0,
    prowadzenie_pierwszy: 0,
    wspolpraca_prywatna: 0
};

// Eksportuj do window
window.servicePricing = servicePricing;

// Załaduj cennik z Firebase
async function loadPricing() {
    try {
        const pricingDoc = await window.db.collection('settings').doc('pricing').get();
        if (pricingDoc.exists) {
            servicePricing = pricingDoc.data();
            window.servicePricing = servicePricing; // Aktualizuj window.servicePricing
            
            // Wypełnij pola w zakładce Usługi (jeśli istnieją)
            const priceDietaInput = document.getElementById('priceDieta');
            const pricePlanInput = document.getElementById('pricePlan');
            const priceProwadzenieInput = document.getElementById('priceProwadzenie');
            const priceProwadzeniePierwszyInput = document.getElementById('priceProwadzeniePierwszy');
            const priceWspolpracaInput = document.getElementById('priceWspolpraca');
            
            if (priceDietaInput) priceDietaInput.value = servicePricing.dieta || 0;
            if (pricePlanInput) pricePlanInput.value = servicePricing.plan_treningowy || 0;
            if (priceProwadzenieInput) priceProwadzenieInput.value = servicePricing.prowadzenie || 0;
            if (priceProwadzeniePierwszyInput) priceProwadzeniePierwszyInput.value = servicePricing.prowadzenie_pierwszy || 0;
            if (priceWspolpracaInput) priceWspolpracaInput.value = servicePricing.wspolpraca_prywatna || 0;
        }
    } catch (error) {
        console.error('Error loading pricing:', error);
    }
}

// Zapisz cennik do Firebase
async function savePricing() {
    try {
        showLoading(true);
        
        const priceDieta = parseFloat(document.getElementById('priceDieta').value) || 0;
        const pricePlan = parseFloat(document.getElementById('pricePlan').value) || 0;
        const priceProwadzenie = parseFloat(document.getElementById('priceProwadzenie').value) || 0;
        const priceProwadzeniePierwszy = parseFloat(document.getElementById('priceProwadzeniePierwszy').value) || 0;
        const priceWspolpraca = parseFloat(document.getElementById('priceWspolpraca').value) || 0;
        
        servicePricing = {
            dieta: priceDieta,
            plan_treningowy: pricePlan,
            prowadzenie: priceProwadzenie,
            prowadzenie_pierwszy: priceProwadzeniePierwszy,
            wspolpraca_prywatna: priceWspolpraca
        };
        
        window.servicePricing = servicePricing; // Aktualizuj window.servicePricing
        
        await window.db.collection('settings').doc('pricing').set(servicePricing);
        
        showToast('Cennik zapisany pomyślnie', 'success');
    } catch (error) {
        console.error('Error saving pricing:', error);
        showToast('Błąd zapisywania cennika: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}


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
    
    // Ustaw domyślną cenę na 0
    const priceInput = document.getElementById('servicePrice');
    if (priceInput) {
        priceInput.value = 0;
    }
    
    // Resetuj rabat
    const discountInput = document.getElementById('serviceDiscount');
    if (discountInput) {
        discountInput.value = 0;
    }
    
    // Odśwież formatowanie daty
    if (typeof window.initializeDateFormatting === 'function') {
        setTimeout(() => window.initializeDateFormatting(), 100);
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
    const priceInput = document.getElementById('servicePrice');
    const discountInput = document.getElementById('serviceDiscount');
    const paymentDescInput = document.getElementById('servicePaymentDescription');
    
    if (!startDateInput || !statusSelect || !priceInput) {
        showToast('Błąd: brak pól formularza', 'error');
        return;
    }
    
    const startDate = startDateInput.value;
    const endDate = endDateInput ? endDateInput.value : null;
    const status = statusSelect.value;
    const notes = notesTextarea ? notesTextarea.value.trim() : '';
    const price = parseFloat(priceInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;
    const paymentDescription = paymentDescInput ? paymentDescInput.value.trim() : '';
    
    const finalPrice = Math.max(0, price - discount);
    
    if (finalPrice === 0) {
        const confirm = window.confirm('Cena usługi wynosi 0 PLN. Czy na pewno chcesz kontynuować?');
        if (!confirm) return;
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
        
        const now = new Date();
        const newServices = selectedTypes.map(type => {
            const service = {
                type: type,
                startDate: firebase.firestore.Timestamp.fromDate(new Date(startDate)),
                status: status,
                notes: notes,
                price: finalPrice,
                originalPrice: price,
                discount: discount,
                paymentDescription: paymentDescription,
                createdAt: firebase.firestore.Timestamp.fromDate(now)
            };
            
            // Prowadzenie - automatycznie 30 dni od startu
            if (type === 'prowadzenie') {
                const endDateCalc = new Date(startDate);
                endDateCalc.setDate(endDateCalc.getDate() + 30);
                service.endDate = firebase.firestore.Timestamp.fromDate(endDateCalc);
            } 
            // Dieta i plan treningowy - bez daty końca (to jest data kupna)
            else if (type === 'dieta' || type === 'plan_treningowy') {
                service.endDate = null;
                service.purchaseDate = firebase.firestore.Timestamp.fromDate(new Date(startDate));
            }
            // Współpraca prywatna - bez daty końca
            else if (type === 'wspolpraca_prywatna') {
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
            updatedAt: new Date()
        });
        
        // Automatycznie utwórz płatność dla każdej usługi
        const clientName = `${clientData.firstName} ${clientData.lastName}`;
        
        for (const service of newServices) {
            const serviceTypeNames = {
                'dieta': 'Dieta',
                'plan_treningowy': 'Plan treningowy',
                'prowadzenie': 'Prowadzenie',
                'wspolpraca_prywatna': 'Współpraca prywatna'
            };
            
            const serviceTypeName = serviceTypeNames[service.type] || service.type;
            
            let paymentNotes = serviceTypeName;
            if (paymentDescription) {
                paymentNotes += ` - ${paymentDescription}`;
            }
            if (discount > 0) {
                paymentNotes += ` (Rabat: ${discount} PLN)`;
            }
            if (service.notes) {
                paymentNotes += `\n${service.notes}`;
            }
            
            const paymentData = {
                clientId: clientId,
                clientName: clientName,
                serviceType: service.type,
                amount: finalPrice,
                date: firebase.firestore.Timestamp.fromDate(new Date(startDate)),
                status: status === 'aktywny' ? 'oplacone' : 'oczekujace',
                notes: paymentNotes,
                createdAt: firebase.firestore.Timestamp.fromDate(now)
            };
            
            await window.db.collection('payments').add(paymentData);
        }
        
        showToast(`Dodano ${newServices.length} usług i utworzono płatności`, 'success');
        
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
            updatedAt: new Date()
        });
        
        // Automatyczne tworzenie płatności przy przedłużaniu (używa normalnej ceny prowadzenia, nie pierwszej)
        console.log('🔍 servicePricing:', window.servicePricing);
        const prowadzeniePrice = window.servicePricing?.prowadzenie || 0;
        console.log('💰 Cena prowadzenia:', prowadzeniePrice);
        
        if (prowadzeniePrice > 0) {
            // Oblicz ile płatności utworzyć (każde 30 dni = 1 płatność)
            const numberOfPayments = Math.ceil(days / 30);
            const clientName = `${clientData.firstName} ${clientData.lastName}`;
            
            console.log(`📊 Przedłużenie o ${days} dni = ${numberOfPayments} płatności po ${prowadzeniePrice} zł`);
            
            for (let i = 0; i < numberOfPayments; i++) {
                const paymentDate = new Date(newEndDate);
                paymentDate.setDate(paymentDate.getDate() - (numberOfPayments - i - 1) * 30);
                
                const paymentData = {
                    clientId: clientId,
                    clientName: clientName,
                    serviceType: 'prowadzenie',
                    amount: prowadzeniePrice,
                    discount: 0,
                    finalAmount: prowadzeniePrice,
                    date: firebase.firestore.Timestamp.fromDate(paymentDate),
                    status: 'oczekujace',
                    notes: `Przedłużenie prowadzenia - miesiąc ${i + 1}/${numberOfPayments}`,
                    createdAt: firebase.firestore.Timestamp.now()
                };
                
                await window.db.collection('payments').add(paymentData);
                console.log(`✅ Utworzono płatność ${i + 1}/${numberOfPayments}:`, paymentData);
            }
            
            const totalAmount = prowadzeniePrice * numberOfPayments;
            showToast(`Prowadzenie przedłużone o ${days} dni. Dodano ${numberOfPayments} płatności (${totalAmount} zł)`, 'success');
        } else {
            console.warn('⚠️ Nie utworzono płatności - cena prowadzenia = 0 lub brak cennika');
            showToast(`Prowadzenie przedłużone o ${days} dni. UWAGA: Nie dodano płatności (ustaw cenę w Ustawieniach)`, 'warning');
        }
        
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
        service.endedAt = new Date(); // Zmieniono z serverTimestamp() na new Date()
        
        // Dodaj do historii usług (bez serverTimestamp w obiekcie service)
        const serviceForHistory = { ...service };
        delete serviceForHistory.endedAt; // Usuń endedAt żeby nie było problemu
        
        await window.db.collection('services_history').add({
            clientId: clientId,
            clientName: `${clientData.firstName} ${clientData.lastName}`,
            service: serviceForHistory,
            endedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        services[serviceIndex] = service;
        
        const newStatus = calculateClientStatus(services);
        
        await clientRef.update({
            services: services,
            status: newStatus,
            updatedAt: new Date() // Zmieniono z serverTimestamp() na new Date()
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
            updatedAt: new Date()
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
    updateActiveServicesList();
    updateOtherServicesList();
    updateServicesHistory();
}

// Inicjalizacja nasłuchiwania na usługi w historii
function initializeServicesListener() {
    window.db.collection('services_history')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .onSnapshot(() => {
            updateServicesHistory();
        });
}

// Usuwanie historii usługi
async function deleteServiceHistory(historyId) {
    if (!confirm('Czy na pewno chcesz usunąć tę usługę z historii?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        await window.db.collection('services_history').doc(historyId).delete();
        showToast('Usługa usunięta z historii', 'success');
    } catch (error) {
        console.error('Error deleting service history:', error);
        showToast('Błąd usuwania usługi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Aktualizacja listy aktywnych prowadzeń
function updateActiveServicesList() {
    const container = document.getElementById('activeCoachingList');
    if (!container) return;
    
    const activeServices = [];
    const expiringServices = [];
    const unpaidServices = [];
    
    if (window.allClients) {
        window.allClients.forEach(client => {
            if (client.services) {
                client.services.forEach((service, index) => {
                    if (service.type === 'prowadzenie') {
                        const serviceData = {
                            clientId: client.id,
                            clientName: `${client.firstName} ${client.lastName}`,
                            service: service,
                            serviceIndex: index
                        };
                        
                        if (service.status === 'aktywny' && service.endDate) {
                            const today = new Date();
                            const endDate = service.endDate.toDate();
                            const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                            
                            if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
                                expiringServices.push({ ...serviceData, daysUntilEnd });
                            } else if (daysUntilEnd > 7) {
                                activeServices.push({ ...serviceData, daysUntilEnd });
                            }
                        } else if (service.status === 'nieoplacony') {
                            unpaidServices.push(serviceData);
                        }
                    }
                });
            }
        });
    }
    
    let html = '';
    
    if (activeServices.length > 0) {
        html += '<h4 style="color: var(--success-green); margin-top: 20px;">✅ Aktywne prowadzenia</h4>';
        activeServices.forEach(item => {
            html += `
                <div class="service-item" style="background: var(--card-bg); padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid var(--success-green);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${item.clientName}</strong>
                            <p style="color: var(--text-gray); margin: 5px 0; font-size: 14px;">
                                Do końca: ${item.daysUntilEnd} dni (${formatDate(item.service.endDate)})
                            </p>
                        </div>
                        <button onclick="openClientDetails('${item.clientId}')" class="btn-secondary" style="padding: 8px 15px;">Zobacz</button>
                    </div>
                </div>
            `;
        });
    }
    
    if (expiringServices.length > 0) {
        html += '<h4 style="color: var(--warning-yellow); margin-top: 20px;">⚠️ Wygasające prowadzenia</h4>';
        expiringServices.forEach(item => {
            html += `
                <div class="service-item" style="background: var(--card-bg); padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid var(--warning-yellow);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${item.clientName}</strong>
                            <p style="color: var(--warning-yellow); margin: 5px 0; font-size: 14px;">
                                ⚠️ Kończy się za ${item.daysUntilEnd} dni! (${formatDate(item.service.endDate)})
                            </p>
                        </div>
                        <button onclick="openClientDetails('${item.clientId}')" class="btn-secondary" style="padding: 8px 15px;">Zobacz</button>
                    </div>
                </div>
            `;
        });
    }
    
    if (unpaidServices.length > 0) {
        html += '<h4 style="color: var(--danger-red); margin-top: 20px;">❌ Nieopłacone prowadzenia</h4>';
        unpaidServices.forEach(item => {
            html += `
                <div class="service-item" style="background: var(--card-bg); padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid var(--danger-red);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${item.clientName}</strong>
                            <p style="color: var(--danger-red); margin: 5px 0; font-size: 14px;">
                                💳 Nieopłacone
                            </p>
                        </div>
                        <button onclick="openClientDetails('${item.clientId}')" class="btn-secondary" style="padding: 8px 15px;">Zobacz</button>
                    </div>
                </div>
            `;
        });
    }
    
    if (html === '') {
        html = '<div class="empty-state"><p style="color: var(--text-gray);">Brak aktywnych prowadzeń</p></div>';
    }
    
    container.innerHTML = html;
}

// Aktualizacja listy innych usług (diety i plany)
function updateOtherServicesList() {
    const container = document.getElementById('otherServicesList');
    if (!container) return;
    
    const otherServices = [];
    
    if (window.allClients) {
        window.allClients.forEach(client => {
            if (client.services) {
                client.services.forEach((service, index) => {
                    if ((service.type === 'dieta' || service.type === 'plan_treningowy' || service.type === 'wspolpraca_prywatna') && service.status !== 'zakonczony') {
                        otherServices.push({
                            clientId: client.id,
                            clientName: `${client.firstName} ${client.lastName}`,
                            service: service,
                            serviceIndex: index
                        });
                    }
                });
            }
        });
    }
    
    if (otherServices.length === 0) {
        container.innerHTML = '<div class="empty-state"><p style="color: var(--text-gray);">Brak aktywnych diet i planów treningowych</p></div>';
        return;
    }
    
    let html = '';
    otherServices.forEach(item => {
        const icon = item.service.type === 'dieta' ? '🥗' : item.service.type === 'plan_treningowy' ? '💪' : '🤝';
        const label = getServiceLabel(item.service.type);
        html += `
            <div class="service-item" style="background: var(--card-bg); padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid var(--primary-green);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${item.clientName}</strong>
                        <p style="color: var(--text-gray); margin: 5px 0; font-size: 14px;">
                            ${icon} ${label} • ${formatDate(item.service.startDate || item.service.purchaseDate)}
                        </p>
                    </div>
                    <button onclick="openClientDetails('${item.clientId}')" class="btn-secondary" style="padding: 8px 15px;">Zobacz</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
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
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="client-status" style="background: rgba(128,128,128,0.2); color: #888; border: 1px solid #666;">Zakończono</span>
                        <button onclick="deleteServiceHistory('${item.id}')" 
                                class="action-btn" 
                                style="background: rgba(255, 0, 0, 0.1); color: var(--danger-red); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--danger-red); cursor: pointer; transition: all 0.2s;"
                                onmouseover="this.style.background='var(--danger-red)'; this.style.color='white'"
                                onmouseout="this.style.background='rgba(255, 0, 0, 0.1)'; this.style.color='var(--danger-red)'">
                            🗑️ Usuń
                        </button>
                    </div>
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
window.updateActiveServicesList = updateActiveServicesList;
window.updateOtherServicesList = updateOtherServicesList;
window.initializeServicesListener = initializeServicesListener;
window.deleteServiceHistory = deleteServiceHistory;
window.openServiceModal = openServiceModal;
window.extendService = extendService;
window.endService = endService;
window.deleteService = deleteService;
window.handleServiceSubmit = handleServiceSubmit;
window.loadPricing = loadPricing;
window.savePricing = savePricing;
window.servicePricing = servicePricing;

console.log('Services.js loaded');
