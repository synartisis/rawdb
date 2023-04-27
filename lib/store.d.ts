export function getCollectionNames(): string[]
export function getCollection(collectionNameOrUrl: string): Collection | undefined
export function getItem(collectionName: string, id: string, includeBodySource?: boolean): Promise<any>
export function applyChanges(collectionName: string, id: string, changes: ChangeSet): Promise<any>
export function setSecret(key: string, value: string): Promise<void>
export function getSecret(key: string): Promise<string | undefined>


export interface Collection {
  name: string
  url: string
  path: string
  lazyProperties: string[]
  items: CollectionItem[]
}

export interface CollectionItem {
  meta: {
    id: string;
    href: string,
    filename: string,
    type: ItemType,
    properties: ItemProperty[],
    bodySource: string,
  }
  [key: string]: any
}

export type ItemType = 'md' | 'json'
export type ItemProperty = { name: string, isLazy: boolean, isBodyProp: boolean }

export type ChangeSet = { propertyName: string, newValue: any, oldValue: any, lang?: string }[]
