import { EventEmitter } from 'node:events';
import { IncomingMessage } from 'node:http';
import type { Server } from 'node:http';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import type { Session, SessionManager } from './accounts.js';

export interface WsEvents {
    connection: (ws: WebSocket, req: IncomingMessage) => void;
    disconnection: (ws: WebSocket, code: number, reason: Buffer, session: Session | undefined) => void;
    message: (ws: WebSocket, data: RawData) => void;
    pong: (ws: WebSocket, latency: number, session: Session | undefined) => void;
    close: (ws: WebSocket, code: number, reason: Buffer) => void;
    error: (ws: WebSocket, err: Error) => void;
}

class WsEventEmitter {
    private readonly emitter = new EventEmitter();

    on<K extends keyof WsEvents>(event: K, listener: WsEvents[K]): this {
        this.emitter.on(event, listener as (...args: unknown[]) => void);
        return this;
    }

    once<K extends keyof WsEvents>(event: K, listener: WsEvents[K]): this {
        this.emitter.once(event, listener as (...args: unknown[]) => void);
        return this;
    }

    off<K extends keyof WsEvents>(event: K, listener: WsEvents[K]): this {
        this.emitter.off(event, listener as (...args: unknown[]) => void);
        return this;
    }

    emit<K extends keyof WsEvents>(event: K, ...args: Parameters<WsEvents[K]>): void {
        this.emitter.emit(event, ...args);
    }
}

let wss: WebSocketServer | undefined;
let sessionManager: SessionManager | undefined;
let pingInterval: NodeJS.Timeout | undefined;

const pingAt = new Map<WebSocket, number>();

export const wsEvents = new WsEventEmitter();

export function getWss(): WebSocketServer {
    if (!wss) throw new Error('WebSocket server is not started');
    return wss;
}

export function getSession(ws: WebSocket): Session | undefined {
    return sessionManager?.getByWs(ws);
}

// ----- ping -----

function startPing(ms = 30_000) {
    stopPing();
    pingInterval = setInterval(
        () => {
            if (!wss) return;
            for (const ws of wss.clients) {
                if (ws.readyState !== WebSocket.OPEN || pingAt.has(ws)) continue;
                pingAt.set(ws, Date.now());
                ws.ping();
            }
        },
        Math.max(ms, 1_000),
    );
}

function stopPing() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = undefined;
    }
    pingAt.clear();
}

// ----- server -----

export function startWebServer(server: Server, sessions?: SessionManager, pingIntervalMs = 30_000) {
    if (wss) wss.close();

    sessionManager = sessions;
    wss = new WebSocketServer({ server });

    startPing(pingIntervalMs);

    wss.on('error', (err) => wsEvents.emit('error', undefined as unknown as WebSocket, err));

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        wsEvents.emit('connection', ws, req);

        ws.on('message', (data) => wsEvents.emit('message', ws, data));

        ws.on('pong', () => {
            const sent = pingAt.get(ws);
            const latency = sent ? Date.now() - sent : -1;
            pingAt.delete(ws);
            const session = sessionManager?.getByWs(ws);
            wsEvents.emit('pong', ws, latency, session);
        });

        ws.on('close', (code, reason) => {
            pingAt.delete(ws);
            const session = sessionManager?.getByWs(ws);
            wsEvents.emit('disconnection', ws, code, reason, session);
            wsEvents.emit('close', ws, code, reason);
        });

        ws.on('error', (err) => wsEvents.emit('error', ws, err));
    });
}

export function stopWebServer(): Promise<void> {
    return new Promise((resolve, reject) => {
        stopPing();
        if (!wss) return resolve();

        for (const ws of wss.clients) ws.terminate();

        wss.close((err) => {
            wss = undefined;
            if (err) reject(err);
            else resolve();
        });
    });
}

// ----- kick -----

export function kick(ws: WebSocket, code = 1008, reason = 'Kicked') {
    if (ws.readyState === WebSocket.OPEN) ws.close(code, reason);
}

// ----- cookies -----

export function parseCookies(cookieHeader?: string) {
    if (!cookieHeader) return {};
    return Object.fromEntries(
        cookieHeader.split(';').flatMap((part) => {
            const eqIdx = part.indexOf('=');
            if (eqIdx === -1) return [];
            const k = part.slice(0, eqIdx).trim();
            const v = decodeURIComponent(part.slice(eqIdx + 1).trim());
            return [[k, v]];
        }),
    );
}
