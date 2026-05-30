# SKS Business Manager Frontend

Ye frontend project GitHub Pages aur APK WebView/PWA ke liye ready hai.

## Features
- Login/Register UI (demo login nahi)
- Google Login button UI
- Mobile OTP Login UI
- Multi-user local account structure
- Business profile: name, logo, bio, type, mobile, address
- Business categories
- Products, purchase, billing, invoice print
- Profit/Loss report
- Customers list
- Marketing image templates: 10 templates refresh par generate
- Download/share/edit image template
- Premium video template placeholder
- Firebase-ready file: `firebase-ready.js`

## GitHub upload
Saari files repo ke root me upload karein:
- index.html
- style.css
- app.js
- firebase-ready.js
- manifest.json
- sw.js
- icons

## Firebase backend connect
1. Firebase Console > Authentication:
   - Email/Password enable
   - Google enable
   - Phone enable
2. Firestore Database enable karein
3. `firebase-ready.js` me apna config paste karein
4. app.js ke login/register functions ko Firebase functions se connect karein

## Note
Abhi frontend/local version hai. Firebase connect karne ke baad mobile + laptop cloud sync hoga.
