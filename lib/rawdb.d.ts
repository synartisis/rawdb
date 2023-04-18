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
      _href: string
      _filename: string
      [key: string]: any
    }

    interface Settings {
      [collection: string]: CollectionSettings | undefined
    }

    interface CollectionSettings {
      url: string
      itemproperty: string | 'current'
      sort: number
      lazy: string[]
    }

    type Response = http.ServerResponse & {
      locals: any
      [key: string]: string
    }

    type RequestListener = http.RequestListener<http.IncomingMessage, Response>

  }

}