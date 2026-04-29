import path from 'node:path';

const severityLabel = {
    0: 'INFO',
    1: 'WARN',
    2: 'ERROR',
    3: 'DEBUG',
} as const;

export type SeverityLevel = 0 | 1 | 2 | 3;

const stackTracePattern = /at\s+(?:(\S+)\s+\()?(.+):(\d+):\d+\)?/;

export function info(...msg: string[]) {
    emitLog(0, ...msg);
}
export function warn(...msg: string[]) {
    emitLog(1, ...msg);
}
export function error(...msg: string[]) {
    emitLog(2, ...msg);
}
export function debug(...msg: string[]) {
    emitLog(3, ...msg);
}

let logger = _emitLog;
export const emitLog = (level: SeverityLevel, ...msg: string[]) => logger(level, ...msg);

export function setLogger(newLogger?: typeof logger) {
    logger = newLogger ?? _emitLog;
}

function _emitLog(level: SeverityLevel, ...msg: string[]) {
    const now = new Date().toISOString().replace('T', ' ').slice(0, -1);

    const stackLine = new Error().stack?.split('\n')[3] ?? '';
    const match = stackTracePattern.exec(stackLine);

    const func = match?.[1] ? `[${match[1]}]` : '';
    const file = match?.[2] ? path.basename(match[2]) : 'unknown';
    const line = match?.[3] ?? '0';

    const formatted = `[${now}][${severityLabel[level]}][${file}:${line}]${func}: ${msg}`;
    console[['info', 'warn', 'error', 'debug'][level] as 'info' | 'warn' | 'error' | 'debug'](formatted);
}
