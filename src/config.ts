import path from 'node:path';
import fs from 'node:fs';
import { ensureDir, resolveStoragePath, writeJsonAtomic } from './storage.js';
import { getNamespace } from './namespace.js';

type ConfigObject = Record<string, unknown>;

export function loadConfig<T extends ConfigObject>(defaults: T): T {
    const configDir = resolveStoragePath('config');
    ensureDir(configDir);

    const file = path.join(configDir, `${getNamespace()}.json`);

    let data: any = {};
    try {
        const raw = fs.readFileSync(file, 'utf8');
        data = JSON.parse(raw);
    } catch {}

    const merged = merge(defaults, data);
    writeJsonAtomic(file, merged);

    return merged;
}

function merge(target: any, source: any): any {
    if (Array.isArray(target)) {
        return Array.isArray(source) ? source : target;
    }

    if (typeof target !== 'object' || target === null) {
        return source ?? target;
    }

    const out: any = { ...target };

    for (const key of Object.keys(target)) {
        if (source?.[key] === undefined) continue;
        out[key] = merge(target[key], source[key]);
    }

    return out;
}
