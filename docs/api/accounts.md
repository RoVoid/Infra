# Accounts & Sessions

## Account

| Property   | Type                        | Default    |
|------------|-----------------------------|------------|
| `uuid`     | `string`                    | —          |
| `nickname` | `string`                    | `'Unnamed'`|
| `settings` | `Record<string, unknown>`   | `{}`       |
| `data`     | `Record<string, unknown>`   | `{}`       |

### Methods

```ts
account.read(key: string): unknown
account.write(key: string, value: unknown): void  // null deletes the key
account.rename(name: string): void                // 3–16 chars, trimmed
account.serialize(): object
```

## Session

```ts
session.uuid      // shortcut to session.account.uuid
session.nickname  // shortcut to session.account.nickname
session.active    // boolean
session.ws        // WebSocket
session.account   // Account
```

## AccountManager

```ts
const accounts = new AccountManager();

accounts.load()                          // load all from disk
accounts.save()                          // save all
accounts.save(uuid)                      // save one
accounts.save(undefined, true)           // save only marked

accounts.get(uuid)                       // Account | undefined
accounts.ensure(uuid)                    // Account (creates if missing)
accounts.mark(uuid)                      // mark for deferred save
```

## SessionManager

```ts
const sessions = new SessionManager(accounts);

sessions.create(uuid, ws)               // Session (creates if missing)
sessions.get(uuid)                      // Session | undefined
sessions.getByWs(ws)                    // Session | undefined
sessions.remove(uuid)
sessions.all()                          // IterableIterator<Session>

sessions.sendTo(uuid, type, data?)      // send to one
sessions.broadcast(type, data?)         // send to all active
```
