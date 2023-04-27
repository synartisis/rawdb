import type * as http from 'node:http'
import type * as dataTypes from './store.d.ts'

declare global {

  namespace rawdb {

    type Collection = dataTypes.Collection
    type CollectionItem = dataTypes.CollectionItem
    type ItemType = dataTypes.ItemType
    type ChangeSet = dataTypes.ChangeSet

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
      currentCollection: dataTypes.Collection | null
      currentItem: dataTypes.CollectionItem | null
      prevItem: dataTypes.CollectionItem | null
      nextItem: dataTypes.CollectionItem | null
      [key: string]: any
    }

    type Response = http.ServerResponse & {
      locals: any
    }
    
    type RequestListener = (req: http.IncomingMessage, res: Response) => Promise<void>

  }

}
