import * as http from 'node:http'

export function rawdb(rootDir: string): Promise<rawdb.RequestListener>
export function getCollectionNames(): string[]
export function getCollection(collectionNameOrUrl: string): rawdb.Collection | undefined
export function getItem(collectionName: string, id: string, includeBodySource?: boolean): Promise<any>
export function applyChanges(collectionName: string, _id: string, changes: rawdb.ChangeSet): Promise<any>
export function setSecret(key: string, value: string): Promise<void>
export function getSecret(key: string): Promise<string | undefined>




declare global {

  namespace rawdb {

    type ItemType = 'md' | 'json'
    type ItemProperty = { name: string, isLazy: boolean, isBodyProp: boolean }

    interface Collection {
      name: string
      url: string
      path: string
      lazyProperties: string[]
      items: CollectionItem[]
    }

    interface CollectionItem {
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

    interface Settings {
      [collectionName: string]: CollectionSettings | undefined
    }

    interface CollectionSettings {
      url: string
      itemproperty: string
      sort: string[]
      lazy: string[]
    }

    type ParseResult = {
      body: string
      bodySource: string
      bodyProps: string[] // names of properties parsed in body
      [key: string]: any
    }

    type State = {
      currentCollection: Collection | null
      currentItem: CollectionItem | null
      prevItem: CollectionItem | null
      nextItem: CollectionItem | null
      [key: string]: any
    }

    type Response = http.ServerResponse & {
      locals: any
    }

    type RequestListener = (req: http.IncomingMessage, res: Response) => Promise<void>

    type ChangeSet = { propertyName: string, newValue: any, oldValue: any, lang?: string }[]

  }

}