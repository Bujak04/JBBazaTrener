// This file contains functions to create charts using Chart.js for client statuses and services.

let clientsChartInstance = null;
let servicesChartInstance = null;

function createClientStatusChart(data) {
    const ctx = document.getElementById('clientStatusChart').getContext('2d');
    const clientStatusChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Active', 'Expiring', 'Inactive'],
            datasets: [{
                label: 'Number of Clients',
                data: data,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createServiceUsageChart(data) {
    const ctx = document.getElementById('serviceUsageChart').getContext('2d');
    const serviceUsageChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Diet', 'Training Plan', 'Coaching'],
            datasets: [{
                label: 'Service Usage',
                data: data,
                backgroundColor: [
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(54, 162, 235, 0.6)'
                ],
                borderColor: [
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Service Usage Distribution'
                }
            }
        }
    });
}

// Aktualizacja dashboardu
function updateDashboard() {
    updateClientStats();
    updateClientsChart();
    updateServicesChart();
    updateExpiringList();
    updateServiceStats();
}

// Eksport globalny
window.updateDashboard = updateDashboard;

// Aktualizacja statystyk klientów
function updateClientStats() {
    let totalClients = 0;
    let activeClients = 0;
    let expiringClients = 0;
    let inactiveClients = 0;
    
    if (window.allClients) {
        totalClients = window.allClients.length;
        
        window.allClients.forEach(client => {
            switch(client.status) {
                case 'aktywny':
                    activeClients++;
                    break;
                case 'wygasa':
                    expiringClients++;
                    break;
                case 'nieaktywny':
                    inactiveClients++;
                    break;
            }
        });
    }
    
    const totalClientsEl = document.getElementById('totalClients');
    const activeClientsEl = document.getElementById('activeClients');
    const expiringClientsEl = document.getElementById('expiringClients');
    const inactiveClientsEl = document.getElementById('inactiveClients');
    
    if (totalClientsEl) totalClientsEl.textContent = totalClients;
    if (activeClientsEl) activeClientsEl.textContent = activeClients;
    if (expiringClientsEl) expiringClientsEl.textContent = expiringClients;
    if (inactiveClientsEl) inactiveClientsEl.textContent = inactiveClients;
}

// Wykres statusu klientów (pie chart)
function updateClientsChart() {
    const canvas = document.getElementById('clientsChart');
    
    if (!canvas) return;
    
    let activeCount = 0;
    let expiringCount = 0;
    let inactiveCount = 0;
    
    if (window.allClients) {
        window.allClients.forEach(client => {
            switch(client.status) {
                case 'aktywny':
                    activeCount++;
                    break;
                case 'wygasa':
                    expiringCount++;
                    break;
                case 'nieaktywny':
                    inactiveCount++;
                    break;
            }
        });
    }
    
    // Usuń poprzedni wykres
    if (clientsChartInstance) {
        clientsChartInstance.destroy();
    }
    
    clientsChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Aktywni', 'Wygasający', 'Nieaktywni'],
            datasets: [{
                data: [activeCount, expiringCount, inactiveCount],
                backgroundColor: [
                    '#0ed145',
                    '#ffaa00',
                    '#ff4444'
                ],
                borderColor: '#000000',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Wykres rozkładu usług (bar chart)
function updateServicesChart() {
    const canvas = document.getElementById('servicesChart');
    
    if (!canvas) return;
    
    let dietCount = 0;
    let planCount = 0;
    let coachingCount = 0;
    
    if (window.allClients) {
        window.allClients.forEach(client => {
            if (client.services) {
                client.services.forEach(service => {
                    if (service.status !== 'zakonczony') {
                        switch(service.type) {
                            case 'dieta':
                                dietCount++;
                                break;
                            case 'plan_treningowy':
                                planCount++;
                                break;
                            case 'prowadzenie':
                                coachingCount++;
                                break;
                        }
                    }
                });
            }
        });
    }
    
    // Usuń poprzedni wykres
    if (servicesChartInstance) {
        servicesChartInstance.destroy();
    }
    
    servicesChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Diety', 'Plany treningowe', 'Prowadzenie'],
            datasets: [{
                label: 'Liczba aktywnych usług',
                data: [dietCount, planCount, coachingCount],
                backgroundColor: '#0ed145',
                borderColor: '#0bb037',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b0b0b0',
                        stepSize: 1
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
                        display: false
                    }
                }
            }
        }
    });
}

// Lista wygasających prowadzeń
function updateExpiringList() {
    const container = document.getElementById('expiringList');
    
    if (!container) return;
    
    const expiringClients = [];
    const today = new Date();
    
    if (window.allClients) {
        window.allClients.forEach(client => {
            if (client.services) {
                client.services.forEach(service => {
                    if (service.type === 'prowadzenie' && 
                        service.status === 'aktywny' && 
                        service.endDate) {
                        
                        const endDate = service.endDate.toDate();
                        const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntilEnd <= 14 && daysUntilEnd >= 0) {
                            expiringClients.push({
                                client: client,
                                endDate: endDate,
                                daysUntilEnd: daysUntilEnd
                            });
                        }
                    }
                });
            }
        });
    }
    
    // Sortuj po liczbie dni
    expiringClients.sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);
    
    if (expiringClients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <p>Brak wygasających prowadzeń w najbliższych 14 dniach</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = expiringClients.map(item => `
        <div class="expiring-item" onclick="openClientDetails('${item.client.id}')">
            <span class="client-name">${item.client.firstName} ${item.client.lastName}</span>
            <span class="expiry-date">
                ${item.daysUntilEnd === 0 ? 'Wygasa dziś!' : 
                  item.daysUntilEnd === 1 ? 'Wygasa jutro' : 
                  `Wygasa za ${item.daysUntilEnd} dni`}
                (${formatDate(item.endDate)})
            </span>
        </div>
    `).join('');
}

console.log('Charts.js loaded');