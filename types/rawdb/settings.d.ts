export function initialized(): boolean;
export function setRootDirectory(rootDir: string): void;
export function getRootDirectory(): string;
export function loadSettings(): Promise<void>;
export function getSetting<Key extends keyof import("../types.js").CollectionSettings>(collectionName: string, key: Key): import("../types.js").CollectionSettings[Key];
/** @type {Settings} */
export let settings: Settings;
export type Settings = import('../types.js').Settings;
export type CollectionSettings = import('../types.js').CollectionSettings;
