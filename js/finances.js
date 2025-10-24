// Finances.js - Zarządzanie finansami i płatnościami

// Otwieranie modala płatności
function openPaymentModal(clientId = null) {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');
    const clientSelect = document.getElementById('paymentClientSelect');
    
    if (!modal || !form) {
        console.error('Payment modal elements not found');
        return;
    }
    
    form.reset();
    
    // Wypełnij listę podopiecznych
    updatePaymentClientSelect();
    
    // Jeśli podano clientId, wybierz go
    if (clientId && clientSelect) {
        clientSelect.value = clientId;
    }
    
    // Ustaw dzisiejszą datę jako domyślną
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('paymentDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    modal.classList.add('active');
}

// Wypełnianie listy podopiecznych w select
function updatePaymentClientSelect() {
    const select = document.getElementById('paymentClientSelect');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Wybierz podopiecznego...</option>';
    
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

// Obsługa formularza płatności
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('paymentClientSelect').value;
    const serviceType = document.getElementById('paymentServiceType').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const discount = parseFloat(document.getElementById('paymentDiscount').value) || 0;
    const date = document.getElementById('paymentDate').value;
    const status = document.getElementById('paymentStatus').value;
    const notes = document.getElementById('paymentNotes').value.trim();
    
    if (!clientId) {
        showToast('Wybierz podopiecznego', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Pobierz dane podopiecznego
        const clientDoc = await window.db.collection('clients').doc(clientId).get();
        const clientData = clientDoc.data();
        
        const paymentData = {
            clientId: clientId,
            clientName: `${clientData.firstName} ${clientData.lastName}`,
            serviceType: serviceType,
            amount: amount,
            discount: discount,
            finalAmount: amount - discount,
            date: firebase.firestore.Timestamp.fromDate(new Date(date)),
            status: status,
            notes: notes,
            createdAt: firebase.firestore.Timestamp.fromDate(new Date())
        };
        
        await window.db.collection('payments').add(paymentData);
        
        showToast('Płatność dodana', 'success');
        document.getElementById('paymentModal').classList.remove('active');
        
        // Odśwież zakładkę finansów jeśli jest aktywna
        if (document.getElementById('finances-tab').classList.contains('active')) {
            loadPayments();
        }
        
    } catch (error) {
        console.error('Error adding payment:', error);
        showToast('Błąd dodawania płatności: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Ładowanie płatności
async function loadPayments() {
    showLoading(true);
    
    try {
        const snapshot = await window.db.collection('payments')
            .orderBy('date', 'desc')
            .get();
        
        const payments = [];
        const batch = window.db.batch();
        let needsMigration = false;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Automatyczna migracja starych płatności bez discount i finalAmount
            if (data.discount === undefined || data.finalAmount === undefined) {
                const discount = data.discount || 0;
                const finalAmount = data.amount - discount;
                
                batch.update(doc.ref, {
                    discount: discount,
                    finalAmount: finalAmount
                });
                
                needsMigration = true;
                data.discount = discount;
                data.finalAmount = finalAmount;
            }
            
            payments.push({ id: doc.id, ...data });
        });
        
        // Zapisz migrację jeśli była potrzebna
        if (needsMigration) {
            await batch.commit();
            console.log('✅ Zmigrowano stare płatności (dodano discount i finalAmount)');
        }
        
        // Zapisz płatności globalnie dla filtrów
        window.allPayments = payments;
        
        // Załaduj listę klientów do filtru
        updatePaymentClientFilter(payments);
        
        renderPaymentsList(payments);
        calculateFinanceStats(payments);
        
    } catch (error) {
        console.error('Error loading payments:', error);
        showToast('Błąd ładowania płatności', 'error');
    } finally {
        showLoading(false);
    }
}

// Renderowanie listy płatności
function renderPaymentsList(payments) {
    const container = document.getElementById('paymentsList');
    
    if (!container) return;
    
    // Pobierz wartości filtrów
    const statusFilter = document.getElementById('paymentStatusFilter')?.value || 'all';
    const clientFilter = document.getElementById('paymentClientFilter')?.value || 'all';
    
    // Zastosuj filtry
    let filteredPayments = payments;
    
    if (statusFilter !== 'all') {
        filteredPayments = filteredPayments.filter(p => p.status === statusFilter);
    }
    
    if (clientFilter !== 'all') {
        filteredPayments = filteredPayments.filter(p => p.clientId === clientFilter);
    }
    
    if (filteredPayments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💰</div>
                <p>Brak płatności${statusFilter !== 'all' || clientFilter !== 'all' ? ' spełniających kryteria filtrów' : ''}</p>
                <p style="color: var(--text-gray); font-size: 14px; margin-top: 10px;">
                    ${statusFilter === 'all' && clientFilter === 'all' ? 'Dodaj pierwszą płatność klikając przycisk "+ Dodaj płatność"' : 'Zmień filtry aby zobaczyć więcej płatności'}
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredPayments.map(payment => {
        const statusClass = payment.status === 'oplacone' ? 'success' : 
                           payment.status === 'oczekujace' ? 'warning' : 'danger';
        const statusLabel = payment.status === 'oplacone' ? '✅ Opłacone' : 
                           payment.status === 'oczekujace' ? '⏳ Oczekujące' : '❌ Zaległość';
        
        const discount = payment.discount || 0;
        const finalAmount = payment.amount - discount;
        
        return `
            <div class="payment-card" style="background: var(--card-bg); border-radius: 10px; padding: 20px; margin-bottom: 15px; border-left: 4px solid var(--primary-green);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; font-size: 18px;">${payment.clientName}</h3>
                        <p style="margin: 5px 0 0 0; color: var(--text-gray); font-size: 14px;">
                            ${getServiceLabel(payment.serviceType)} • ${formatDate(payment.date)}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        ${discount > 0 ? `
                            <div style="font-size: 14px; color: var(--text-gray); text-decoration: line-through; margin-bottom: 2px;">
                                ${payment.amount.toFixed(2)} zł
                            </div>
                            <div style="font-size: 13px; color: var(--danger); margin-bottom: 2px;">
                                -${discount.toFixed(2)} zł rabatu
                            </div>
                            <div style="font-size: 24px; font-weight: 600; color: var(--primary-green); margin-bottom: 5px;">
                                ${finalAmount.toFixed(2)} zł
                            </div>
                        ` : `
                            <div style="font-size: 24px; font-weight: 600; color: var(--primary-green); margin-bottom: 5px;">
                                ${payment.amount.toFixed(2)} zł
                            </div>
                        `}
                        <span class="client-status status-${statusClass}">${statusLabel}</span>
                    </div>
                </div>
                ${payment.notes ? `<p style="color: var(--text-gray); font-size: 14px; margin: 10px 0 0 0;">${payment.notes}</p>` : ''}
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn-secondary" onclick="editPayment('${payment.id}')" style="padding: 5px 15px; font-size: 13px;">Edytuj</button>
                    <button class="btn-danger" onclick="deletePayment('${payment.id}')" style="padding: 5px 15px; font-size: 13px;">Usuń</button>
                </div>
            </div>
        `;
    }).join('');
}

// Obliczanie statystyk finansowych
function calculateFinanceStats(payments) {
    let totalRevenue = 0;
    let pendingPayments = 0;
    let paidThisMonth = 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    payments.forEach(payment => {
        const discount = payment.discount || 0;
        const finalAmount = payment.amount - discount;
        
        if (payment.status === 'oplacone') {
            totalRevenue += finalAmount;
            
            const paymentDate = payment.date.toDate ? payment.date.toDate() : new Date(payment.date);
            if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
                paidThisMonth += finalAmount;
            }
        } else {
            pendingPayments += finalAmount;
        }
    });
    
    document.getElementById('totalRevenue').textContent = `${totalRevenue.toFixed(2)} zł`;
    document.getElementById('pendingPayments').textContent = `${pendingPayments.toFixed(2)} zł`;
    document.getElementById('paidThisMonth').textContent = `${paidThisMonth.toFixed(2)} zł`;
}

// Usuwanie płatności
async function deletePayment(paymentId) {
    if (!confirm('Czy na pewno chcesz usunąć tę płatność?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        await window.db.collection('payments').doc(paymentId).delete();
        showToast('Płatność usunięta', 'success');
        loadPayments();
    } catch (error) {
        console.error('Error deleting payment:', error);
        showToast('Błąd usuwania płatności', 'error');
    } finally {
        showLoading(false);
    }
}

// Edycja płatności (zmiana statusu)
async function editPayment(paymentId) {
    showLoading(true);
    
    try {
        const paymentDoc = await window.db.collection('payments').doc(paymentId).get();
        
        if (!paymentDoc.exists) {
            showToast('Nie znaleziono płatności', 'error');
            return;
        }
        
        const payment = paymentDoc.data();
        const currentStatus = payment.status;
        const currentDiscount = payment.discount || 0;
        
        const statusOptions = [
            { value: 'oczekujace', label: '⏳ Oczekujące' },
            { value: 'oplacone', label: '✅ Opłacone' },
            { value: 'zaleglosc', label: '❌ Zaległość' }
        ];
        
        const optionsHtml = statusOptions.map(opt => 
            `<option value="${opt.value}" ${currentStatus === opt.value ? 'selected' : ''}>${opt.label}</option>`
        ).join('');
        
        const result = await new Promise((resolve) => {
            const modalHtml = `
                <div class="modal active" id="editPaymentStatusModal" style="z-index: 10000;">
                    <div class="modal-content" style="max-width: 500px;">
                        <div class="modal-header">
                            <h2>Edytuj płatność</h2>
                            <button class="close-btn" onclick="document.getElementById('editPaymentStatusModal').remove(); ">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p style="margin-bottom: 15px; color: var(--text-gray);">
                                <strong>${payment.clientName}</strong><br>
                                Kwota bazowa: ${payment.amount.toFixed(2)} zł
                            </p>
                            
                            <div class="form-group">
                                <label>Status *</label>
                                <select id="newPaymentStatus" class="form-control" style="padding: 12px; background: var(--bg-dark); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-white); font-size: 16px; width: 100%;">
                                    ${optionsHtml}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Rabat (zł)</label>
                                <input type="number" id="paymentDiscount" value="${currentDiscount}" step="0.01" min="0" placeholder="0.00" 
                                    style="padding: 12px; background: var(--bg-dark); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-white); font-size: 16px; width: 100%;">
                                <small style="color: var(--text-gray); font-size: 13px; margin-top: 5px; display: block;">
                                    Kwota po rabacie: <strong id="finalAmount">${(payment.amount - currentDiscount).toFixed(2)} zł</strong>
                                </small>
                            </div>
                            
                            <div class="modal-actions">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('editPaymentStatusModal').remove();">Anuluj</button>
                                <button type="button" class="btn-primary" id="confirmStatusChange">Zapisz zmiany</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Aktualizuj kwotę po rabacie na bieżąco
            const discountInput = document.getElementById('paymentDiscount');
            const finalAmountSpan = document.getElementById('finalAmount');
            
            discountInput.addEventListener('input', () => {
                const discount = parseFloat(discountInput.value) || 0;
                const finalAmount = Math.max(0, payment.amount - discount);
                finalAmountSpan.textContent = finalAmount.toFixed(2) + ' zł';
            });
            
            document.getElementById('confirmStatusChange').onclick = () => {
                const newStatus = document.getElementById('newPaymentStatus').value;
                const discount = parseFloat(document.getElementById('paymentDiscount').value) || 0;
                document.getElementById('editPaymentStatusModal').remove();
                resolve({ status: newStatus, discount: discount });
            };
        });
        
        if (result) {
            const updateData = {
                status: result.status,
                discount: result.discount,
                finalAmount: payment.amount - result.discount,
                updatedAt: firebase.firestore.Timestamp.fromDate(new Date())
            };
            
            await window.db.collection('payments').doc(paymentId).update(updateData);
            
            showToast('Płatność zaktualizowana', 'success');
            loadPayments();
        }
        
    } catch (error) {
        console.error('Error editing payment:', error);
        showToast('Błąd edycji płatności', 'error');
    } finally {
        showLoading(false);
    }
}

// Aktualizacja filtru klientów w finansach
function updatePaymentClientFilter(payments) {
    const filter = document.getElementById('paymentClientFilter');
    
    if (!filter) return;
    
    // Zbierz unikalne pary clientId i clientName
    const uniqueClients = new Map();
    payments.forEach(payment => {
        if (payment.clientId && payment.clientName) {
            uniqueClients.set(payment.clientId, payment.clientName);
        }
    });
    
    // Sortuj alfabetycznie po nazwisku
    const sortedClients = Array.from(uniqueClients.entries()).sort((a, b) => 
        a[1].localeCompare(b[1])
    );
    
    // Zapisz aktualną wartość filtru
    const currentValue = filter.value;
    
    // Wypełnij select
    filter.innerHTML = '<option value="all">Wszyscy podopieczni</option>';
    sortedClients.forEach(([id, name]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        filter.appendChild(option);
    });
    
    // Przywróć wartość jeśli istniała
    if (currentValue && Array.from(uniqueClients.keys()).includes(currentValue)) {
        filter.value = currentValue;
    }
}

// Inicjalizacja filtrów
function initializePaymentFilters() {
    const statusFilter = document.getElementById('paymentStatusFilter');
    const clientFilter = document.getElementById('paymentClientFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            // Ponowne renderowanie z aktualnymi danymi
            const paymentsData = window.allPayments || [];
            renderPaymentsList(paymentsData);
        });
    }
    
    if (clientFilter) {
        clientFilter.addEventListener('change', () => {
            // Ponowne renderowanie z aktualnymi danymi
            const paymentsData = window.allPayments || [];
            renderPaymentsList(paymentsData);
        });
    }
}

// Eksporty globalne
window.openPaymentModal = openPaymentModal;
window.handlePaymentSubmit = handlePaymentSubmit;
window.loadPayments = loadPayments;
window.deletePayment = deletePayment;
window.editPayment = editPayment;
window.updatePaymentClientSelect = updatePaymentClientSelect;
window.updatePaymentClientFilter = updatePaymentClientFilter;
window.initializePaymentFilters = initializePaymentFilters;

// Inicjalizuj filtry przy ładowaniu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePaymentFilters);
} else {
    initializePaymentFilters();
}

console.log('✅ Finances.js loaded');
