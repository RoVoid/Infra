import { WebSocket } from 'ws';
type AccountData = Record<string, unknown>;
export declare class Account {
    uuid: string;
    nickname: string;
    settings: Record<string, unknown>;
    data: AccountData;
    constructor(args: {
        uuid: string;
        nickname?: string;
        settings?: Record<string, unknown>;
        data?: AccountData;
    });
    read(key: string): unknown;
    write(key: string, value: unknown): void;
    rename(name: string): void;
    serialize(): {
        uuid: string;
        nickname: string;
        settings: Record<string, unknown>;
        data: AccountData;
    };
}
export declare class Session {
    account: Account;
    ws: WebSocket;
    active: boolean;
    constructor(account: Account, ws: WebSocket);
    get uuid(): string;
    get nickname(): string;
    serialize(): {
        account: {
            uuid: string;
            nickname: string;
            settings: Record<string, unknown>;
            data: AccountData;
        };
        active: boolean;
    };
}
export declare class AccountManager {
    private readonly accounts;
    private readonly marked;
    get(uuid: string): Account | undefined;
    ensure(uuid: string): Account;
    mark(uuid: string): void;
    load(): void;
    save(targetUuid?: string, onlyMarked?: boolean): void;
}
export declare class SessionManager {
    private readonly accounts;
    private readonly sessions;
    private readonly wsIndex;
    constructor(accounts: AccountManager);
    get(uuid: string): Session | undefined;
    getByWs(ws: WebSocket): Session | undefined;
    create(uuid: string, ws: WebSocket): Session;
    remove(uuid: string): void;
    all(): MapIterator<Session>;
    private send;
    sendTo(uuid: string, type: string, data?: object): void;
    broadcast(type: string, data?: object): void;
}
export {};
