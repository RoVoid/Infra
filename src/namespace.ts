import { defineStorageDir, resolveStoragePath } from './storage.js';

let namespace = '';

export function defineNamespace(newNamespace: string) {
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

export function withNamespace(key: string) {
    return namespace ? `${namespace}.${key}` : key;
}
