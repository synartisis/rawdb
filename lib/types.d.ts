import type * as http from 'node:http'

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

export interface Settings {
  [collectionName: string]: CollectionSettings | undefined
}

export interface CollectionSettings {
  url: string
  itemproperty: string
  sort: string[]
  lazy: string[]
}

export type ItemType = 'md' | 'json'
export type ItemProperty = { name: string, isLazy: boolean, isBodyProp: boolean }

export type ChangeSet = { propertyName: string, newValue: any, oldValue: any, lang?: string }[]

export type ParseResult = {
  body: string
  bodySource: string
  bodyProps: string[] // names of properties parsed in body
  [key: string]: any
}

export interface Config {
  rootDir: string
}

export type Response = http.ServerResponse & {
  locals: any
}

export type RequestListener = (req: http.IncomingMessage, res: Response) => Promise<void>

export type State = {
  currentCollection: Collection | null
  currentItem: CollectionItem | null
  prevItem: CollectionItem | null
  nextItem: CollectionItem | null
  [key: string]: any
}
