import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';
import { error } from './logger.js';
import { ensureDir, resolveStoragePath, writeJsonAtomic } from './storage.js';
import { withNamespace } from './namespace.js';

// ----- Account -----

type AccountData = Record<string, unknown>;

export class Account {
    uuid: string;
    nickname: string;
    settings: Record<string, unknown>;
    data: AccountData;

    constructor(args: { uuid: string; nickname?: string; settings?: Record<string, unknown>; data?: AccountData }) {
        this.uuid = args.uuid;
        this.nickname = args.nickname ?? 'Unnamed';
        this.settings = args.settings ?? {};
        this.data = args.data ?? {};
    }

    read(key: string) {
        return this.data[withNamespace(key)];
    }

    write(key: string, value: unknown) {
        const k = withNamespace(key);
        if (value === null) delete this.data[k];
        else this.data[k] = value;
    }

    rename(name: string) {
        const v = name.trim();
        if (v.length < 3) return;
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
    public active = true;

    constructor(
        public account: Account,
        public ws: WebSocket,
    ) {}

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
    private readonly accounts = new Map<string, Account>();
    private readonly marked = new Set<string>();

    get(uuid: string) {
        return this.accounts.get(uuid);
    }

    ensure(uuid: string) {
        let acc = this.accounts.get(uuid);
        if (!acc) {
            acc = new Account({ uuid });
            this.accounts.set(uuid, acc);
        }
        return acc;
    }

    mark(uuid: string) {
        this.marked.add(uuid);
    }

    load() {
        const dir = resolveStoragePath('accounts');
        ensureDir(dir);

        this.accounts.clear();
        this.marked.clear();

        for (const file of fs.readdirSync(dir)) {
            if (path.extname(file) !== '.json') continue;

            try {
                const raw = fs.readFileSync(path.join(dir, file), 'utf8');
                const parsed = JSON.parse(raw);
                if (!parsed?.uuid) continue;

                this.accounts.set(parsed.uuid, new Account(parsed));
            } catch {
                error(`Failed to load ${file}`);
            }
        }
    }

    save(targetUuid?: string, onlyMarked = false) {
        const dir = resolveStoragePath('accounts');
        ensureDir(dir);

        const writeOne = (acc?: Account) => {
            if (!acc) return;
            const filePath = path.join(dir, `${acc.uuid}.json`);
            writeJsonAtomic(filePath, acc.serialize());
        };

        if (!targetUuid) {
            if (onlyMarked) {
                for (const uuid of this.marked) {
                    writeOne(this.accounts.get(uuid));
                }
                this.marked.clear();
            } else {
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
    private readonly sessions = new Map<string, Session>();
    private readonly wsIndex = new Map<WebSocket, Session>();

    constructor(private readonly accounts: AccountManager) {}

    get(uuid: string) {
        return this.sessions.get(uuid);
    }

    getByWs(ws: WebSocket) {
        return this.wsIndex.get(ws);
    }

    create(uuid: string, ws: WebSocket) {
        let session = this.sessions.get(uuid);
        if (session) return session;

        const acc = this.accounts.ensure(uuid);
        session = new Session(acc, ws);

        this.sessions.set(uuid, session);
        this.wsIndex.set(ws, session);
        return session;
    }

    remove(uuid: string) {
        const session = this.sessions.get(uuid);
        if (session) this.wsIndex.delete(session.ws);
        this.sessions.delete(uuid);
    }

    all() {
        return this.sessions.values();
    }

    // === 📡 Коммуникация ===
    private send(ws: WebSocket, type: string, data?: object) {
        if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, data }));
    }

    sendTo(uuid: string, type: string, data?: object) {
        const session = this.get(uuid);
        if (session?.active) this.send(session.ws, type, data);
    }

    broadcast(type: string, data?: object) {
        for (const session of this.all()) if (session.active) this.send(session.ws, type, data);
    }
}
