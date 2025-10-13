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
        snapshot.forEach(doc => {
            payments.push({ id: doc.id, ...doc.data() });
        });
        
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
    
    if (payments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💰</div>
                <p>Brak płatności</p>
                <p style="color: var(--text-gray); font-size: 14px; margin-top: 10px;">
                    Dodaj pierwszą płatność klikając przycisk "+ Dodaj płatność"
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = payments.map(payment => {
        const statusClass = payment.status === 'oplacone' ? 'success' : 
                           payment.status === 'oczekujace' ? 'warning' : 'danger';
        const statusLabel = payment.status === 'oplacone' ? '✅ Opłacone' : 
                           payment.status === 'oczekujace' ? '⏳ Oczekujące' : '❌ Zaległość';
        
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
                        <div style="font-size: 24px; font-weight: 600; color: var(--primary-green); margin-bottom: 5px;">
                            ${payment.amount.toFixed(2)} zł
                        </div>
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
        if (payment.status === 'oplacone') {
            totalRevenue += payment.amount;
            
            const paymentDate = payment.date.toDate ? payment.date.toDate() : new Date(payment.date);
            if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
                paidThisMonth += payment.amount;
            }
        } else {
            pendingPayments += payment.amount;
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

// Edycja płatności
function editPayment(paymentId) {
    showToast('Funkcja edycji w przygotowaniu', 'info');
}

// Eksporty globalne
window.openPaymentModal = openPaymentModal;
window.handlePaymentSubmit = handlePaymentSubmit;
window.loadPayments = loadPayments;
window.deletePayment = deletePayment;
window.editPayment = editPayment;
window.updatePaymentClientSelect = updatePaymentClientSelect;

console.log('✅ Finances.js loaded');
