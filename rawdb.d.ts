import * as http from 'node:http'

export async function rawdb(rootDir: string): Promise<http.RequestListener>


declare global {

  namespace rawdb {

    interface State {
      [key: string]: Collection
    }

    type Collection = CollectionItem[]

    interface CollectionItem {
      _id: string
      [key: string]: any
    }

    interface Settings {
      [collection: string]: CollectionSettings | undefined
    }

    interface CollectionSettings {
      itemproperty: string | 'current'
      sort: numder?
    }

    type Response = http.ServerResponse & {
      locals: any
      [key: string]: string
    }

    type RequestListener = http.RequestListener<http.IncomingMessage, Response>

  }

}