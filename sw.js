// PillBot Service Worker - v3.7 Robustness Update
const CACHE_NAME = 'pillbot-cache-v5';
const ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.action === 'took-it') {
        const id = event.notification.data ? event.notification.data.id : null;
        if(id) event.waitUntil(updateInventory(id));
    }
});

async function updateInventory(id) {
    const db = await new Promise(res => {
        const req = indexedDB.open('PillBotV3', 1);
        req.onsuccess = () => res(req.result);
    });
    const tx = db.transaction('meds', 'readwrite');
    const store = tx.objectStore('meds');
    const med = await new Promise(r => {
        const getReq = store.get(id);
        getReq.onsuccess = () => r(getReq.result);
    });
    if (med && med.stock > 0) {
        med.stock -= 1;
        await new Promise(r => {
            const putReq = store.put(med);
            putReq.onsuccess = () => r();
        });
        const allClients = await clients.matchAll();
        allClients.forEach(client => client.postMessage({type: 'REFRESH'}));
    }
}
