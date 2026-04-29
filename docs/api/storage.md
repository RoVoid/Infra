# Storage

## defineNamespace

```ts
defineNamespace(namespace: string): void
```

Sets the active namespace (pattern: `/^[a-z-]{3,20}$/`). Must be called before any storage or config operations. Also initializes `storageDir` from `process.env.STORAGE` if not already set.

## getNamespace

```ts
getNamespace(): string
```

## writeJsonAtomic

```ts
writeJsonAtomic(filePath: string, data: unknown): void
```

Writes JSON to a `.tmp` file then renames it — prevents corrupt files on crash.

## ensureDir

```ts
ensureDir(dir: string): void
```

Creates the directory if it doesn't exist.

## resolveStoragePath

```ts
resolveStoragePath(extra?: string): string
```

Resolves a path relative to `storageDir`.

## createUUID

Re-exported from `node:crypto`:

```ts
import { createUUID } from '@rovoid/infra';
const id = createUUID(); // 'f47ac10b-58cc-...'
```
