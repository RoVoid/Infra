import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';
import { error } from './logger.js';
import { ensureDir, resolveStoragePath, writeJsonAtomic } from './storage.js';
import { withNamespace } from './namespace.js';
export class Account {
    uuid;
    nickname;
    settings;
    data;
    constructor(args) {
        this.uuid = args.uuid;
        this.nickname = args.nickname ?? 'Unnamed';
        this.settings = args.settings ?? {};
        this.data = args.data ?? {};
    }
    read(key) {
        return this.data[withNamespace(key)];
    }
    write(key, value) {
        const k = withNamespace(key);
        if (value === null)
            delete this.data[k];
        else
            this.data[k] = value;
    }
    rename(name) {
        const v = name.trim();
        if (v.length < 3)
            return;
        this.nickname = v.length > 16 ? v.slice(0, 16) : v;
    }
    serialize() {
        return {
            uuid: this.uuid,
            nickname: this.nickname,
            settings: this.settings,
            data: this.data,
        };
    }
}
// ----- Session -----
export class Session {
    account;
    ws;
    active = true;
    constructor(account, ws) {
        this.account = account;
        this.ws = ws;
    }
    get uuid() {
        return this.account.uuid;
    }
    get nickname() {
        return this.account.nickname;
    }
    serialize() {
        return {
            account: this.account.serialize(),
            active: this.active,
        };
    }
}
// ----- AccountManager -----
export class AccountManager {
    accounts = new Map();
    marked = new Set();
    get(uuid) {
        return this.accounts.get(uuid);
    }
    ensure(uuid) {
        let acc = this.accounts.get(uuid);
        if (!acc) {
            acc = new Account({ uuid });
            this.accounts.set(uuid, acc);
        }
        return acc;
    }
    mark(uuid) {
        this.marked.add(uuid);
    }
    load() {
        const dir = resolveStoragePath('accounts');
        ensureDir(dir);
        this.accounts.clear();
        this.marked.clear();
        for (const file of fs.readdirSync(dir)) {
            if (path.extname(file) !== '.json')
                continue;
            try {
                const raw = fs.readFileSync(path.join(dir, file), 'utf8');
                const parsed = JSON.parse(raw);
                if (!parsed?.uuid)
                    continue;
                this.accounts.set(parsed.uuid, new Account(parsed));
            }
            catch {
                error(`Failed to load ${file}`);
            }
        }
    }
    save(targetUuid, onlyMarked = false) {
        const dir = resolveStoragePath('accounts');
        ensureDir(dir);
        const writeOne = (acc) => {
            if (!acc)
                return;
            const filePath = path.join(dir, `${acc.uuid}.json`);
            writeJsonAtomic(filePath, acc.serialize());
        };
        if (!targetUuid) {
            if (onlyMarked) {
                for (const uuid of this.marked) {
                    writeOne(this.accounts.get(uuid));
                }
                this.marked.clear();
            }
            else {
                for (const acc of this.accounts.values()) {
                    writeOne(acc);
                }
            }
            return;
        }
        writeOne(this.accounts.get(targetUuid));
    }
}
// ----- SessionManager -----
export class SessionManager {
    accounts;
    sessions = new Map();
    wsIndex = new Map();
    constructor(accounts) {
        this.accounts = accounts;
    }
    get(uuid) {
        return this.sessions.get(uuid);
    }
    getByWs(ws) {
        return this.wsIndex.get(ws);
    }
    create(uuid, ws) {
        let session = this.sessions.get(uuid);
        if (session)
            return session;
        const acc = this.accounts.ensure(uuid);
        session = new Session(acc, ws);
        this.sessions.set(uuid, session);
        this.wsIndex.set(ws, session);
        return session;
    }
    remove(uuid) {
        const session = this.sessions.get(uuid);
        if (session)
            this.wsIndex.delete(session.ws);
        this.sessions.delete(uuid);
    }
    all() {
        return this.sessions.values();
    }
    // === 📡 Коммуникация ===
    send(ws, type, data) {
        if (ws?.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ type, data }));
    }
    sendTo(uuid, type, data) {
        const session = this.get(uuid);
        if (session?.active)
            this.send(session.ws, type, data);
    }
    broadcast(type, data) {
        for (const session of this.all())
            if (session.active)
                this.send(session.ws, type, data);
    }
}
