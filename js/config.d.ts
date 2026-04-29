type ConfigObject = Record<string, unknown>;
export declare function loadConfig<T extends ConfigObject>(defaults: T): T;
export {};
