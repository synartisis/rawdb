import * as http from 'node:http'

export async function rawdb(rootDir: string): Promise<http.RequestListener>


declare global {

  namespace rawdb {

    interface Collection {
      name: string
      url: string
      path: string
      lazyProperties: string[]
      items: CollectionItem[]
    }

    interface CollectionItem {
      _id: string
      _href: string
      _filename: string
      [key: string]: any
    }

    interface Settings {
      [collection: string]: CollectionSettings | undefined
    }

    interface CollectionSettings {
      url: string
      itemproperty: string | 'currentItem'
      sort: number | Function
      lazy: string[]
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
      [key: string]: string
    }

    type RequestListener = http.RequestListener<http.IncomingMessage, Response>

  }

}