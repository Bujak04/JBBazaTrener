# 🏋️ Panel Trenera Personalnego - Jakub Bujakiewicz# Personal Trainer Panel



Panel administracyjny dla trenera personalnego z pełną integracją Firebase.This project is a personal trainer management panel designed for a single administrator. It integrates with Firebase for authentication, data storage, and push notifications, and is built as a Progressive Web App (PWA) for offline functionality.



## ✨ Funkcje## Features



- ✅ Logowanie Firebase (tylko admin)- **Home Section**: Overview of client statistics, service usage, and upcoming subscription expirations.

- ✅ Zarządzanie klientami- **Clients Management**: Add, edit, and delete clients. View detailed client profiles, including services, measurements, and notes.

- ✅ Usługi: diety, plany, prowadzenie- **Services Overview**: Track active, expiring, and unpaid services. Manage service history and renewals.

- ✅ Pomiary z wykresami- **Notes Section**: Create and manage notes associated with clients and their services.

- ✅ System notatek- **Measurements Tracking**: Record and visualize client measurements over time.

- ✅ Dashboard ze statystykami

- ✅ PWA - działa offline## Technologies Used

- ✅ Auto-wylogowanie po 5 min nieaktywności

- ✅ Responsywny design- HTML, CSS, JavaScript (Vanilla)

- ✅ Ciemny motyw (czarny + zielony #0ed145)- Firebase (Auth, Firestore, Storage, Cloud Functions, FCM)

- Chart.js for data visualization

## 🚀 Deploy na GitHub Pages- PWA features for offline access



```bash## Project Structure

git init

git add .```

git commit -m "Initial commit"personal-trainer-panel

git branch -M main├── public

git remote add origin https://github.com/TWOJ-USERNAME/trener-panel.git│   ├── index.html

git push -u origin main│   ├── login.html

```│   ├── css

│   │   ├── styles.css

Następnie: Settings → Pages → Source: **main** → Folder: **/ (root)**│   │   └── responsive.css

│   ├── js

Strona będzie pod: `https://TWOJ-USERNAME.github.io/trener-panel/public/`│   │   ├── app.js

│   │   ├── firebase-config.js

## 🔧 Konfiguracja Firebase│   │   ├── auth.js

│   │   ├── clients.js

1. Edytuj `public/js/firebase-config.js`│   │   ├── services.js

2. Wklej swoje dane Firebase│   │   ├── notes.js

3. Zmień `ADMIN_UID` na swój UID│   │   ├── measurements.js

4. Dodaj domenę GitHub do Firebase Auth│   │   ├── charts.js

│   │   └── notifications.js

## 📱 Instalacja jako PWA│   ├── assets

│   │   ├── icons

- **Android/iOS:** Menu → "Dodaj do ekranu głównego"│   │   └── images

- **Desktop:** Ikona + w pasku adresu│   ├── manifest.json

│   └── service-worker.js

---├── functions

│   ├── index.js

Made with ❤️ by Jakub Bujakiewicz│   ├── package.json

│   └── .env.example
├── .firebaserc
├── firebase.json
├── firestore.rules
├── storage.rules
├── .gitignore
├── package.json
└── README.md
```

## Setup Instructions

1. **Clone the Repository**:
   ```
   git clone <repository-url>
   cd personal-trainer-panel
   ```

2. **Firebase Configuration**:
   - Create a Firebase project and enable Firestore, Authentication, and Cloud Functions.
   - Update `public/js/firebase-config.js` with your Firebase project credentials.

3. **Install Dependencies for Cloud Functions**:
   ```
   cd functions
   npm install
   ```

4. **Deploy Cloud Functions**:
   ```
   firebase deploy --only functions
   ```

5. **Deploy Hosting**:
   ```
   firebase deploy --only hosting
   ```

6. **Access the Panel**:
   - Open the deployed URL in your browser.

## Deployment on GitHub Pages

1. Push your code to a GitHub repository.
2. Go to the repository settings.
3. Under the "Pages" section, select the branch to deploy from (usually `main` or `gh-pages`).
4. Access your panel at the provided GitHub Pages URL.

## Notes

- Ensure that Firestore and Storage security rules are set to allow access only to the admin UID.
- Regularly check for updates in dependencies and Firebase configurations.

## License

This project is licensed under the MIT License.