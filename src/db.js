const DB_NAME = 'pixel-forge';
const DB_VERSION = 1;
const STORE = 'projects';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function req2p(r) {
  return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}

export async function saveProject(project) {
  const db = await open();
  return req2p(tx(db, 'readwrite').put(project));
}

export async function loadProject(id) {
  const db = await open();
  return req2p(tx(db, 'readonly').get(id));
}

export async function listProjects() {
  const db = await open();
  return req2p(tx(db, 'readonly').getAllKeys());
}

export async function deleteProject(id) {
  const db = await open();
  return req2p(tx(db, 'readwrite').delete(id));
}
