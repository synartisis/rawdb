export interface Config {
  /**
   * rawdb root directory  
   * 
   * must be set to the root of content location
   * @example rootDir: 'my_content/'
   */
  rootDir: string
  /**
   * rawdb base Url
   * 
   * default value is '/'
   * */
  baseUrl?: string
}

export interface Collection {
  name: string
  url: string
  path: string
  lazyProperties: string[]
  items: CollectionItem[]
  transformers: Array<Function>
  addTransformer: (transformerFn: Function) => void
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
  [collectionName: string]: CollectionSettings
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


export type State = {
  currentCollection: Collection | null
  currentItem: CollectionItem | null
  prevItem: CollectionItem | null
  nextItem: CollectionItem | null
  [key: string]: any
}
