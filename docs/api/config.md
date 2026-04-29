# Config

## loadConfig

```ts
loadConfig<T extends Record<string, unknown>>(defaults: T): T
```

Loads config from `{storageDir}/config/{namespace}.json`. Merges saved values with `defaults` and writes the result back to disk. Always returns a fully populated object.

```ts
const config = loadConfig({
    port: 3000,
    maxPlayers: 16,
    debug: false,
});
```

::: tip
Call `defineNamespace` before `loadConfig`.
:::
