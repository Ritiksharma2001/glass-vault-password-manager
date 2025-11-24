🔐 GlassVault — Offline Encrypted Password Manager

⚠ Copyright © 2025 Ritik Sharma
This software is proprietary. Unauthorized copying, redistribution, or modification is strictly prohibited.

🧭 Overview

GlassVault is a lightweight, privacy-focused offline password manager built using pure HTML, CSS, and JavaScript.
It stores all data locally in the browser, encrypted with military-grade security — meaning:

✔ No cloud
✔ No accounts
✔ No tracking
✔ No external storage

Your data stays 100% in your device.

🛡 Why GlassVault?
Feature	Status
Fully Offline — Works without internet	✔
Master Password Lock	✔
AES-256 Encryption	✔
Password Generator	✔
Copy to Clipboard	✔
Add/Edit/Delete Entries	✔
Search & Filter	✔
Import Backup	✔
Export Backup	✔
LocalStorage Encryption	✔
Dark/Light Mode	✔
Mobile Friendly	✔
Works in Browser With No Installation	✔
🔧 Tech Stack

HTML

CSS (Glassmorphism Design UI)

JavaScript

CryptoJS (AES-256 Encryption + SHA-256 Hashing)

🔒 Security

GlassVault uses:

AES-256 to encrypt passwords before saving

SHA-256 hashing for storing the master password securely

Client-side encryption only — nothing is sent anywhere

✔ No server
✔ No account
✔ No recovery system (for privacy)

🧨 If you forget your Master Password, your vault cannot be unlocked.
This is intentional and part of the security model.

📦 Installation
Option 1 — Use Offline Locally

Download the project folder

Open index.html in any modern browser

Use your vault completely offline

Option 2 — Deploy on GitHub Pages

Upload the project to a GitHub repository

Open: Settings → Pages

Select:

Branch: main

Folder: /root

Deploy — Your vault will be live in seconds

💾 Backup & Restore

GlassVault provides export and import options.

Action	Format	Encrypted?
Export backup	.json	✔
Import backup	.json	✔

🔍 Backups are still encrypted — they are only readable by re-entering the same master password inside GlassVault.

📷 Screenshots (Optional to Add)
📌 /screenshots/login-screen.png
📌 /screenshots/dashboard.png
📌 /screenshots/password-entry-ui.png

📣 License

This project is licensed under:

MIT License


✔ Allowed: Personal use, modification, commercial use
✖ Not Allowed: Removing copyright without notice

⭐ Future Enhancements (Optional)

Cloud sync (optional toggle)

Biometric unlock (Fingerprint/FaceID)

Multiple vault profiles

Auto-fill browser extension

❤️ Author

Developed with focus on privacy & security
by Ritik Sharma
