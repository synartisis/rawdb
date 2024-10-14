export function initialized(): boolean;
export function setRootDirectory(rootDir: string): void;
export function setRootUrl(_rootUrl: string): void;
export function getRootDirectory(): string;
export function getRootUrl(): string;
export function loadSettings(): Promise<void>;
export function getSetting<Key extends keyof CollectionSettings>(collectionName: string, key: Key): CollectionSettings[Key];
/** @type {Settings} */
export let settings: Settings;
export type Settings = import("../types.js").Settings;
export type CollectionSettings = import("../types.js").CollectionSettings;
