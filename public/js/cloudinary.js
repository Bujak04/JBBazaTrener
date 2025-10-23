// Cloudinary configuration
const CLOUDINARY_CONFIG = {
    cloudName: 'daa0cchek',
    uploadPreset: 'client_uploads'
};

// Initialize Cloudinary widget for photos
function initPhotoUploadWidget(clientId, callback) {
    const widget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        folder: `clients/${clientId}/photos`,
        sources: ['local', 'camera'],
        multiple: true,
        maxFiles: 10,
        maxFileSize: 10000000, // 10MB
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        styles: {
            palette: {
                window: '#000000',
                windowBorder: '#0ed145',
                tabIcon: '#0ed145',
                menuIcons: '#0ed145',
                textDark: '#ffffff',
                textLight: '#ffffff',
                link: '#0ed145',
                action: '#0ed145',
                inactiveTabIcon: '#555555',
                error: '#ff6b6b',
                inProgress: '#0ed145',
                complete: '#0ed145',
                sourceBg: '#1a1a1a'
            }
        },
        text: {
            'en': {
                'or': 'lub',
                'menu.files': 'Moje pliki',
                'local.dd_title_single': 'Przeciągnij i upuść zdjęcie tutaj',
                'local.dd_title_multi': 'Przeciągnij i upuść zdjęcia tutaj',
                'local.browse': 'Przeglądaj',
                'camera.capture': 'Zrób zdjęcie',
                'camera.cancel': 'Anuluj',
                'camera.take_pic': 'Zrób zdjęcie i wgraj',
                'queue.title': 'Kolejka uploadu',
                'queue.done': 'Gotowe',
                'queue.statuses.uploaded': 'Wgrane'
            }
        }
    }, (error, result) => {
        if (error) {
            console.error('Upload error:', error);
            showToast('Błąd uploadu zdjęcia', 'error');
            return;
        }
        
        if (result.event === 'success') {
            const photoData = {
                id: result.info.public_id,
                url: result.info.secure_url,
                thumbnail: result.info.thumbnail_url || result.info.secure_url,
                fileName: result.info.original_filename,
                format: result.info.format,
                size: result.info.bytes,
                width: result.info.width,
                height: result.info.height,
                uploadedAt: new Date(),
                type: 'photo'
            };
            
            if (callback) callback(photoData);
        }
        
        if (result.event === 'close') {
            widget.close();
        }
    });
    
    return widget;
}

// Initialize Cloudinary widget for diets/files
function initFileUploadWidget(clientId, callback) {
    const widget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        folder: `clients/${clientId}/diets`,
        sources: ['local'],
        multiple: true,
        maxFiles: 5,
        maxFileSize: 20000000, // 20MB
        clientAllowedFormats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
        styles: {
            palette: {
                window: '#000000',
                windowBorder: '#0ed145',
                tabIcon: '#0ed145',
                menuIcons: '#0ed145',
                textDark: '#ffffff',
                textLight: '#ffffff',
                link: '#0ed145',
                action: '#0ed145',
                inactiveTabIcon: '#555555',
                error: '#ff6b6b',
                inProgress: '#0ed145',
                complete: '#0ed145',
                sourceBg: '#1a1a1a'
            }
        },
        text: {
            'en': {
                'or': 'lub',
                'menu.files': 'Moje pliki',
                'local.dd_title_single': 'Przeciągnij i upuść plik tutaj',
                'local.dd_title_multi': 'Przeciągnij i upuść pliki tutaj',
                'local.browse': 'Przeglądaj',
                'queue.title': 'Kolejka uploadu',
                'queue.done': 'Gotowe',
                'queue.statuses.uploaded': 'Wgrane'
            }
        }
    }, (error, result) => {
        if (error) {
            console.error('Upload error:', error);
            showToast('Błąd uploadu pliku', 'error');
            return;
        }
        
        if (result.event === 'success') {
            const fileData = {
                id: result.info.public_id,
                url: result.info.secure_url,
                fileName: result.info.original_filename + '.' + result.info.format,
                format: result.info.format,
                size: result.info.bytes,
                uploadedAt: new Date(),
                type: 'diet'
            };
            
            if (callback) callback(fileData);
        }
        
        if (result.event === 'close') {
            widget.close();
        }
    });
    
    return widget;
}

// Upload photo to client with date
async function uploadClientPhoto(clientId) {
    if (!clientId) {
        showToast('Błąd: Brak ID klienta', 'error');
        return;
    }
    
    // Stwórz ładniejszy modal do wprowadzania daty
    const today = new Date();
    const todayStr = today.toLocaleDateString('pl-PL');
    
    const dateInput = prompt(`📅 Podaj datę zdjęcia (DD.MM.RRRR)\n\nWciśnij Enter dla dzisiejszej daty: ${todayStr}`, todayStr);
    
    if (dateInput === null) return; // Anulowano
    
    let selectedDate;
    if (!dateInput || dateInput.trim() === '' || dateInput === todayStr) {
        selectedDate = today;
    } else {
        // Parse DD.MM.RRRR
        const parts = dateInput.trim().split('.');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Miesiące są 0-indexed
            const year = parseInt(parts[2], 10);
            
            // Walidacja zakresów
            if (isNaN(day) || isNaN(month) || isNaN(year) || 
                day < 1 || day > 31 || 
                month < 0 || month > 11 || 
                year < 1900 || year > 2100) {
                showToast('Nieprawidłowa data. Użyj formatu DD.MM.RRRR (np. 23.10.2025)', 'error');
                return;
            }
            
            selectedDate = new Date(year, month, day);
            
            // Sprawdź czy data jest poprawna
            if (isNaN(selectedDate.getTime())) {
                showToast('Nieprawidłowy format daty. Użyj DD.MM.RRRR', 'error');
                return;
            }
        } else {
            showToast('Nieprawidłowy format daty. Użyj DD.MM.RRRR (np. 23.10.2025)', 'error');
            return;
        }
    }
    
    const widget = initPhotoUploadWidget(clientId, async (photoData) => {
        try {
            showLoading(true);
            
            photoData.photoDate = firebase.firestore.Timestamp.fromDate(selectedDate);
            
            const clientRef = window.db.collection('clients').doc(clientId);
            const clientDoc = await clientRef.get();
            const client = clientDoc.data();
            
            const photos = client.photos || [];
            photos.push(photoData);
            
            await clientRef.update({
                photos: photos,
                updatedAt: new Date()
            });
            
            showToast('Zdjęcie dodane!', 'success');
            
            // Odśwież profil klienta jeśli jest otwarty
            if (window.currentClient && window.currentClient.id === clientId) {
                openClientDetails(clientId);
            }
            
        } catch (error) {
            console.error('Error saving photo:', error);
            showToast('Błąd zapisywania zdjęcia', 'error');
        } finally {
            showLoading(false);
        }
    });
    
    widget.open();
}

// Open photo gallery modal
function openPhotoGallery(clientId, photos) {
    if (!photos || photos.length === 0) {
        showToast('Brak zdjęć do wyświetlenia', 'info');
        return;
    }
    
    // Grupuj zdjęcia po datach
    const photosByDate = {};
    photos.forEach(photo => {
        let dateObj;
        if (photo.photoDate) {
            // Konwersja z Firebase Timestamp (może być obiekt lub już Date)
            if (photo.photoDate.seconds) {
                dateObj = new Date(photo.photoDate.seconds * 1000);
            } else if (photo.photoDate.toDate) {
                dateObj = photo.photoDate.toDate();
            } else {
                dateObj = new Date(photo.photoDate);
            }
        } else if (photo.uploadedAt) {
            if (photo.uploadedAt.seconds) {
                dateObj = new Date(photo.uploadedAt.seconds * 1000);
            } else if (photo.uploadedAt.toDate) {
                dateObj = photo.uploadedAt.toDate();
            } else {
                dateObj = new Date(photo.uploadedAt);
            }
        } else {
            dateObj = new Date();
        }
        
        // Sprawdź czy data jest poprawna
        if (isNaN(dateObj.getTime())) {
            console.error('Invalid date for photo:', photo);
            dateObj = new Date(); // Użyj dzisiejszej daty jako fallback
        }
        
        const dateKey = dateObj.toLocaleDateString('pl-PL'); // Format DD.MM.RRRR
        
        if (!photosByDate[dateKey]) {
            photosByDate[dateKey] = {
                date: dateObj,
                dateStr: dateKey,
                photos: []
            };
        }
        photosByDate[dateKey].photos.push(photo);
    });
    
    // Sortuj daty od najnowszych
    const sortedDates = Object.values(photosByDate).sort((a, b) => b.date - a.date);
    
    let galleryHTML = '<div style="padding: 10px;">';
    
    sortedDates.forEach(dateGroup => {
        const datePhotos = dateGroup.photos;
        const dayOfWeek = dateGroup.date.toLocaleDateString('pl-PL', { weekday: 'long' });
        
        galleryHTML += `
            <div style="margin-bottom: 50px; background: linear-gradient(135deg, rgba(14, 209, 69, 0.05), rgba(0, 0, 0, 0.3)); border-radius: 12px; padding: 20px; border: 1px solid rgba(14, 209, 69, 0.2);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--primary-green);">
                    <div>
                        <h3 style="color: var(--primary-green); margin: 0; font-size: 20px; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">📅</span>
                            ${dateGroup.dateStr}
                        </h3>
                        <p style="margin: 5px 0 0 34px; color: var(--text-gray); font-size: 14px; text-transform: capitalize;">
                            ${dayOfWeek}
                        </p>
                    </div>
                    <div style="background: rgba(14, 209, 69, 0.2); padding: 8px 16px; border-radius: 20px; border: 1px solid var(--primary-green);">
                        <span style="color: var(--primary-green); font-weight: 600; font-size: 14px;">
                            ${datePhotos.length} ${datePhotos.length === 1 ? 'zdjęcie' : datePhotos.length < 5 ? 'zdjęcia' : 'zdjęć'}
                        </span>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px;">
                    ${datePhotos.map((photo, idx) => {
                        const uploadTime = photo.uploadedAt ? (photo.uploadedAt.toDate ? photo.uploadedAt.toDate() : new Date(photo.uploadedAt)) : new Date();
                        return `
                        <div style="position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 3/4; background: var(--card-bg); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;" 
                             onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 20px rgba(14, 209, 69, 0.3)'" 
                             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.3)'"
                             onclick="viewFullPhoto('${photo.url}', '${photo.fileName}')">
                            <img src="${photo.url}" 
                                 alt="${photo.fileName}" 
                                 style="width: 100%; height: 100%; object-fit: cover;">
                            <div style="position: absolute; top: 10px; right: 10px;">
                                <button onclick="event.stopPropagation(); deleteClientPhoto('${clientId}', '${photo.id}')" 
                                        style="background: rgba(255, 0, 0, 0.9); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: background 0.2s;"
                                        onmouseover="this.style.background='rgba(255, 0, 0, 1)'"
                                        onmouseout="this.style.background='rgba(255, 0, 0, 0.9)'">
                                    🗑️
                                </button>
                            </div>
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0, 0, 0, 0.9)); padding: 15px;">
                                <div style="color: white; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: 600;">Zdjęcie ${idx + 1}</span>
                                    <span style="opacity: 0.8;">${formatFileSize(photo.size)}</span>
                                </div>
                                <div style="color: var(--text-gray); font-size: 11px; margin-top: 4px;">
                                    Dodano: ${uploadTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    });
    
    galleryHTML += '</div>';
    
    document.getElementById('photoGalleryContent').innerHTML = galleryHTML;
    document.getElementById('photoGalleryTitle').innerHTML = `📸 Galeria zdjęć <span style="color: var(--text-gray); font-size: 16px; font-weight: normal;">(${photos.length} ${photos.length === 1 ? 'zdjęcie' : 'zdjęć'})</span>`;
    document.getElementById('photoGalleryModal').classList.add('active');
}

// View full photo in new window
function viewFullPhoto(url, fileName) {
    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${fileName}</title>
            <style>
                body { 
                    margin: 0; 
                    background: #000; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh;
                }
                img { 
                    max-width: 100%; 
                    max-height: 100vh; 
                    object-fit: contain;
                }
            </style>
        </head>
        <body>
            <img src="${url}" alt="${fileName}">
        </body>
        </html>
    `);
}

// Upload diet/file to client
async function uploadClientFile(clientId) {
    if (!clientId) {
        showToast('Błąd: Brak ID klienta', 'error');
        return;
    }
    
    const widget = initFileUploadWidget(clientId, async (fileData) => {
        try {
            showLoading(true);
            
            const clientRef = window.db.collection('clients').doc(clientId);
            const clientDoc = await clientRef.get();
            const client = clientDoc.data();
            
            const files = client.files || [];
            files.push(fileData);
            
            await clientRef.update({
                files: files,
                updatedAt: new Date()
            });
            
            showToast('Plik dodany!', 'success');
            
            // Odśwież profil klienta jeśli jest otwarty
            if (window.currentClient && window.currentClient.id === clientId) {
                openClientDetails(clientId);
            }
            
        } catch (error) {
            console.error('Error saving file:', error);
            showToast('Błąd zapisywania pliku', 'error');
        } finally {
            showLoading(false);
        }
    });
    
    widget.open();
}

// Delete photo from client
async function deleteClientPhoto(clientId, photoId) {
    if (!confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const clientRef = window.db.collection('clients').doc(clientId);
        const clientDoc = await clientRef.get();
        const client = clientDoc.data();
        
        const photos = (client.photos || []).filter(p => p.id !== photoId);
        
        await clientRef.update({
            photos: photos,
            updatedAt: new Date()
        });
        
        showToast('Zdjęcie usunięte', 'success');
        
        // Zamknij modal galerii
        document.getElementById('photoGalleryModal').classList.remove('active');
        
        // Odśwież profil klienta
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error deleting photo:', error);
        showToast('Błąd usuwania zdjęcia', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete file from client
async function deleteClientFile(clientId, fileId) {
    if (!confirm('Czy na pewno chcesz usunąć ten plik?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const clientRef = window.db.collection('clients').doc(clientId);
        const clientDoc = await clientRef.get();
        const client = clientDoc.data();
        
        const files = (client.files || []).filter(f => f.id !== fileId);
        
        await clientRef.update({
            files: files,
            updatedAt: new Date()
        });
        
        showToast('Zdjęcie usunięte', 'success');
        
        // Zamknij modal galerii
        document.getElementById('photoGalleryModal').classList.remove('active');
        
        // Odśwież profil klienta
        if (window.currentClient && window.currentClient.id === clientId) {
            openClientDetails(clientId);
        }
        
    } catch (error) {
        console.error('Error deleting file:', error);
        showToast('Błąd usuwania pliku', 'error');
    } finally {
        showLoading(false);
    }
}

// Open file view modal
function openFileView(clientId, file) {
    const modal = document.getElementById('fileViewModal');
    const title = document.getElementById('fileViewTitle');
    const contentDiv = document.getElementById('fileViewContent');
    
    let uploadDate;
    if (file.uploadedAt) {
        if (file.uploadedAt.seconds) {
            uploadDate = new Date(file.uploadedAt.seconds * 1000);
        } else if (file.uploadedAt.toDate) {
            uploadDate = file.uploadedAt.toDate();
        } else {
            uploadDate = new Date(file.uploadedAt);
        }
    } else {
        uploadDate = new Date();
    }
    
    const dateStr = uploadDate.toLocaleDateString('pl-PL');
    const timeStr = uploadDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const dayOfWeek = uploadDate.toLocaleDateString('pl-PL', { weekday: 'long' });
    
    const isPDF = file.format === 'pdf' || file.fileName.toLowerCase().endsWith('.pdf');
    const fileIcon = isPDF ? '📕' : file.fileName.toLowerCase().includes('.doc') ? '📘' : file.fileName.toLowerCase().includes('.xls') ? '📗' : '📄';
    
    title.innerHTML = `${fileIcon} ${file.fileName}`;
    
    let content = `
        <div style="background: linear-gradient(135deg, rgba(14, 209, 69, 0.05), rgba(0, 0, 0, 0.3)); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(14, 209, 69, 0.2);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div style="background: rgba(14, 209, 69, 0.1); padding: 12px; border-radius: 8px; border-left: 3px solid var(--primary-green);">
                    <div style="color: var(--text-gray); font-size: 12px; margin-bottom: 4px;">📅 Data dodania</div>
                    <div style="color: white; font-weight: 600;">${dateStr}</div>
                    <div style="color: var(--text-gray); font-size: 11px; text-transform: capitalize;">${dayOfWeek}</div>
                </div>
                <div style="background: rgba(14, 209, 69, 0.1); padding: 12px; border-radius: 8px; border-left: 3px solid var(--primary-green);">
                    <div style="color: var(--text-gray); font-size: 12px; margin-bottom: 4px;">� Godzina</div>
                    <div style="color: white; font-weight: 600;">${timeStr}</div>
                </div>
                <div style="background: rgba(14, 209, 69, 0.1); padding: 12px; border-radius: 8px; border-left: 3px solid var(--primary-green);">
                    <div style="color: var(--text-gray); font-size: 12px; margin-bottom: 4px;">📦 Rozmiar</div>
                    <div style="color: white; font-weight: 600;">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <a href="${file.url}" 
                   target="_blank" 
                   style="background: var(--primary-green); color: var(--bg-dark); padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(14, 209, 69, 0.3);"
                   onmouseover="this.style.background='#0bc93d'; this.style.transform='translateY(-2px)'"
                   onmouseout="this.style.background='var(--primary-green)'; this.style.transform='translateY(0)'">
                    📥 Pobierz plik
                </a>
                <button onclick="deleteClientFile('${clientId}', '${file.id}'); document.getElementById('fileViewModal').classList.remove('active');" 
                        style="background: rgba(255, 0, 0, 0.9); color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);"
                        onmouseover="this.style.background='rgba(255, 0, 0, 1)'; this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.background='rgba(255, 0, 0, 0.9)'; this.style.transform='translateY(0)'">
                    🗑️ Usuń plik
                </button>
            </div>
        </div>
    `;
    
    if (isPDF) {
        content += `
            <div style="background: var(--card-bg); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
                <iframe src="${file.url}" 
                        style="width: 100%; height: 600px; border: none;"
                        frameborder="0">
                </iframe>
            </div>
        `;
    } else {
        content += `
            <div style="background: var(--card-bg); border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
                <div style="font-size: 80px; margin-bottom: 20px;">${fileIcon}</div>
                <p style="color: var(--text-gray); font-size: 14px; margin-bottom: 20px;">
                    Podgląd niedostępny dla tego typu pliku.<br>
                    Użyj przycisku "Pobierz plik" aby otworzyć w odpowiednim programie.
                </p>
            </div>
        `;
    }
    
    contentDiv.innerHTML = content;
    modal.classList.add('active');
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Export functions
window.uploadClientPhoto = uploadClientPhoto;
window.uploadClientFile = uploadClientFile;
window.deleteClientPhoto = deleteClientPhoto;
window.deleteClientFile = deleteClientFile;
window.formatFileSize = formatFileSize;
window.openPhotoGallery = openPhotoGallery;
window.viewFullPhoto = viewFullPhoto;
window.openFileView = openFileView;

console.log('Cloudinary.js loaded');
