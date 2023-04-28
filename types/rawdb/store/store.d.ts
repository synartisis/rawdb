export function load(): Promise<void>;
export function getItem(collectionName: string, id: string, includeBodySource?: boolean): Promise<CollectionItem | undefined>;
export function applyChanges(collectionName: string, id: string, changes: import("../../types.js").ChangeSet): Promise<CollectionItem>;
export type CollectionItem = import('../../types.js').CollectionItem;
export type ChangeSet = import('../../types.js').ChangeSet;
export { getCollectionNames, getCollection, getCollectionsFlatten } from "./collection.js";
