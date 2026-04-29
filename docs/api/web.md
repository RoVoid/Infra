# Web (WebSocket)

## startWebServer

```ts
startWebServer(server: Server, sessions?: SessionManager, pingIntervalMs?: number): void
```

Starts a WebSocket server on top of an existing HTTP server. Automatically sends ping frames to all connected clients at the given interval (default: `30000` ms).

## stopWebServer

```ts
stopWebServer(): Promise<void>
```

Terminates all clients and closes the server gracefully.

## events

Typed event emitter. All WebSocket events are emitted here.

```ts
events.on('connection', (ws, req) => { })
events.on('disconnection', (ws, code, reason, session) => { })
events.on('message', (ws, data) => { })
events.on('pong', (ws, latency, session) => { })
events.on('close', (ws, code, reason) => { })
events.on('error', (ws, err) => { })
```

Also supports `once` and `off`.

## getWss

```ts
getWss(): WebSocketServer
```

Returns the active `WebSocketServer` instance. Throws if the server is not started.

## getSession

```ts
getSession(ws: WebSocket): Session | undefined
```

Returns the session associated with a WebSocket connection.

## kick

```ts
kick(ws: WebSocket, code?: number, reason?: string): void
```

Closes a client connection. Default code: `1008`, default reason: `'Kicked'`.

## parseCookies

```ts
parseCookies(cookieHeader?: string): Record<string, string>
```

Parses the `Cookie` header string into a key-value object.
