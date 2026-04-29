import { EventEmitter } from 'node:events';
import { WebSocket, WebSocketServer } from 'ws';
class WsEventEmitter {
    emitter = new EventEmitter();
    on(event, listener) {
        this.emitter.on(event, listener);
        return this;
    }
    once(event, listener) {
        this.emitter.once(event, listener);
        return this;
    }
    off(event, listener) {
        this.emitter.off(event, listener);
        return this;
    }
    emit(event, ...args) {
        this.emitter.emit(event, ...args);
    }
}
let wss;
let sessionManager;
let pingInterval;
const pingAt = new Map();
export const wsEvents = new WsEventEmitter();
export function getWss() {
    if (!wss)
        throw new Error('WebSocket server is not started');
    return wss;
}
export function getSession(ws) {
    return sessionManager?.getByWs(ws);
}
// ----- ping -----
function startPing(ms = 30_000) {
    stopPing();
    pingInterval = setInterval(() => {
        if (!wss)
            return;
        for (const ws of wss.clients) {
            if (ws.readyState === WebSocket.OPEN) {
                pingAt.set(ws, Date.now());
                ws.ping();
            }
        }
    }, Math.max(ms, 1_000));
}
function stopPing() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = undefined;
    }
    pingAt.clear();
}
// ----- server -----
export function startWebServer(server, sessions, pingIntervalMs = 30_000) {
    if (wss)
        wss.close();
    sessionManager = sessions;
    wss = new WebSocketServer({ server });
    startPing(pingIntervalMs);
    wss.on('error', (err) => wsEvents.emit('error', undefined, err));
    wss.on('connection', (ws, req) => {
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
export function stopWebServer() {
    return new Promise((resolve, reject) => {
        stopPing();
        if (!wss)
            return resolve();
        for (const ws of wss.clients)
            ws.terminate();
        wss.close((err) => {
            wss = undefined;
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
// ----- kick -----
export function kick(ws, code = 1008, reason = 'Kicked') {
    if (ws.readyState === WebSocket.OPEN) {
        ws.close(code, reason);
    }
}
// ----- cookies -----
export function parseCookies(cookieHeader) {
    if (!cookieHeader)
        return {};
    return Object.fromEntries(cookieHeader.split(';').flatMap((part) => {
        const eqIdx = part.indexOf('=');
        if (eqIdx === -1)
            return [];
        const k = part.slice(0, eqIdx).trim();
        const v = decodeURIComponent(part.slice(eqIdx + 1).trim());
        return [[k, v]];
    }));
}
