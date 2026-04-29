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
declare class WsEventEmitter {
    private readonly emitter;
    on<K extends keyof WsEvents>(event: K, listener: WsEvents[K]): this;
    once<K extends keyof WsEvents>(event: K, listener: WsEvents[K]): this;
    off<K extends keyof WsEvents>(event: K, listener: WsEvents[K]): this;
    emit<K extends keyof WsEvents>(event: K, ...args: Parameters<WsEvents[K]>): void;
}
export declare const wsEvents: WsEventEmitter;
export declare function getWss(): WebSocketServer;
export declare function getSession(ws: WebSocket): Session | undefined;
export declare function startWebServer(server: Server, sessions?: SessionManager, pingIntervalMs?: number): void;
export declare function stopWebServer(): Promise<void>;
export declare function kick(ws: WebSocket, code?: number, reason?: string): void;
export declare function parseCookies(cookieHeader?: string): {
    [k: string]: string;
};
export {};
