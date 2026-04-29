# Getting Started

## Install

```bash
npm install @rovoid/infra
```

## Setup

```ts
import http from 'node:http';
import { defineNamespace, AccountManager, SessionManager, startWebServer, events } from '@rovoid/infra';

defineNamespace('my-app'); // must be called first

const accounts = new AccountManager();
const sessions = new SessionManager(accounts);

accounts.load();

const server = http.createServer();
startWebServer(server, sessions);

events.on('connection', (ws, req) => {
    // handle new connection
});

server.listen(3000);
```
