// PillBot Service Worker
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.action === 'took-it') {
        event.waitUntil(updateInventory());
    }
});

async function updateInventory() {
    const db = await new Promise(res => {
        const req = indexedDB.open('PillBotDB', 1);
        req.onsuccess = () => res(req.result);
    });
    const tx = db.transaction('meds', 'readwrite');
    const store = tx.objectStore('meds');
    const data = await new Promise(r => {
        const getReq = store.get('current_med');
        getReq.onsuccess = () => r(getReq.result);
    });
    if (data && data.stock > 0) {
        data.stock -= 1;
        const msgBuffer = new TextEncoder().encode(data.hash + JSON.stringify(data));
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        data.hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        store.put(data, 'current_med');
    }
}
