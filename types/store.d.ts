/** @typedef {import('./types.js').CollectionItem} CollectionItem */
/** @typedef {import('./types.js').ChangeSet} ChangeSet */
/**
 * get a list of rawdb collection names
 */
export function getCollectionNames(): string[];
/** @param {string} collectionNameOrUrl */
export function getCollection(collectionNameOrUrl: string): import("./types.js").Collection | undefined;
export function getItem(collectionName: string, id: string, includeBodySource?: boolean): Promise<CollectionItem | undefined>;
export function applyChanges(collectionName: string, id: string, changes: import("./types.js").ChangeSet): Promise<CollectionItem>;
export function setSecret(key: string, value: string): Promise<void>;
export function getSecret(key: string): Promise<string | undefined>;
export type CollectionItem = import('./types.js').CollectionItem;
export type ChangeSet = import('./types.js').ChangeSet;
