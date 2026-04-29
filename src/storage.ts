import fs from 'node:fs';
import path from 'node:path';
import { error, info } from './logger.js';

let storageDir = '';

export function ensureDir(dir: string) {
    try {
        const stat = fs.statSync(dir);
        if (!stat.isDirectory()) throw new Error();
    } catch {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function defineStorageDir(newDir: string) {
    try {
        const stat = fs.statSync(newDir);
        if (!stat.isDirectory()) return;
        storageDir = newDir;
        info(`Defined storage path: ${newDir}`);
    } catch {
        error(`${newDir} does not exist`);
    }
}

export function resolveStoragePath(extra: string = '') {
    return extra ? path.join(storageDir, extra) : storageDir;
}

export function writeJsonAtomic(filePath: string, data: unknown) {
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data), 'utf8');
    fs.renameSync(tmp, filePath);
}
