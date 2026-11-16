# Torro Bah VDC Management System — Version 1.0 prototype

## Included
- Phone-friendly progressive web app (PWA) starter.
- Officer-specific digital recording templates.
- Save draft / save submitted record.
- Search and view saved records.
- Print a record or use the browser's Print / Save as PDF option.
- JSON backup export and import.
- Basic offline app-shell caching.

## Important limitations
This is a demonstration prototype, not a secure production system.
- Records are stored in browser localStorage on one device.
- There are no user accounts, role-based permissions, cloud sync, encrypted storage or multi-device backups.
- Do not enter sensitive welfare case details, bank information, passwords or confidential personal information.
- The app does not provide legally valid approvals, electronic signatures or a full audit trail.
- Browser storage can be cleared; export backups regularly during testing.

## Run on Android
1. Extract this ZIP using your phone's file manager.
2. For a quick preview, open `index.html` in a browser. Some PWA/offline features require serving the files over HTTPS.
3. To install as a PWA, publish the folder to an HTTPS static host, then open the site in Chrome and choose Install app / Add to Home screen.
4. Keep the original source files and exported JSON backups in a VDC-controlled location.

## Next development stage
Add secure individual accounts, role-based access, approval workflows, cloud database, encryption, synchronisation, reliable backups, document attachments, and governance configuration aligned with the adopted constitution and applicable Gambian law.
