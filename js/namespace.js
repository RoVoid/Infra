import { defineStorageDir, resolveStoragePath } from './storage.js';
let namespace = '';
export function defineNamespace(newNamespace) {
    if (!/^[a-z-]{3,20}$/.test(newNamespace)) {
        throw new Error('Invalid namespace format');
    }
    namespace = newNamespace;
    if (!resolveStoragePath()) {
        defineStorageDir(process.env.STORAGE ?? '.');
    }
}
export function getNamespace() {
    return namespace;
}
export function withNamespace(key) {
    return namespace ? `${namespace}.${key}` : key;
}
