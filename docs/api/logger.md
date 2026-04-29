# Logger

## Log functions

```ts
info(...msg: string[]): void
warn(...msg: string[]): void
error(...msg: string[]): void
debug(...msg: string[]): void
```

Output format:
```
[2026-04-29 12:00:00.000][INFO][server.ts:42][startWebServer]: Server started
```

## emitLog

```ts
emitLog(level: SeverityLevel, ...msg: string[]): void
```

| Level | Value |
|-------|-------|
| INFO  | `0`   |
| WARN  | `1`   |
| ERROR | `2`   |
| DEBUG | `3`   |

## setLogger

```ts
setLogger(logger?: (level: SeverityLevel, ...msg: string[]) => void): void
```

Replaces the default logger. Call without arguments to restore the default.

```ts
// Custom logger
setLogger((level, ...msg) => {
    myLogger.log(level, msg.join(' '));
});

// Restore default
setLogger();
```
