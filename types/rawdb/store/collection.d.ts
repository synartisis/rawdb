export function loadCollections(): Promise<void>;
/** @param {string} collectionNameOrUrl */
export function getCollection(collectionNameOrUrl: string): import("../../types.js").Collection | undefined;
export function getCollectionNames(): string[];
export function getCollectionsFlatten(): {};
export type Collection = import("../../types.js").Collection;
