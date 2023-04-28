export function loadItem(collection: Collection, filename: string, loadLazyProperties: boolean, includeBodySource?: boolean): Promise<CollectionItem | undefined>;
export function applyItemChanges(collection: Collection, filename: string, changes: import("../../types.js").ChangeSet): Promise<CollectionItem>;
export type Collection = import('../../types.js').Collection;
export type CollectionItem = import('../../types.js').CollectionItem;
export type ChangeSet = import('../../types.js').ChangeSet;
