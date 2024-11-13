/** @typedef {import('node:http').ServerResponse & { locals: string }} Response */
/** @import { State } from '../../types.js' */

import * as store from '../store/store.js'
import { getSetting } from '../settings.js'

const HTTP_RESPONSE_PROPERTY_FOR_STATE = 'locals'


/** @type {(res: Response, maybeCollectionUrl: string, maybeId: string) => Promise<void>} */
export async function setState(res, maybeCollectionUrl, maybeId) {

  /** @type {State} */
  const state = {
    currentCollection: null,
    currentItem: null,
    prevItem: null,
    nextItem: null,
  }

  if (maybeCollectionUrl && maybeId) {
    const collection = store.getCollection(maybeCollectionUrl)
    if (collection) {
      state.currentCollection = collection
      const item = await store.getItem(collection.name, maybeId, true)
      if (item) {
        const itemProperty = getSetting(collection.name, 'itemproperty')
        if (itemProperty !== 'currentItem') state[itemProperty] = item
        state.currentItem = item
        const currentItemIndex = collection.items.findIndex(o => o.meta.id === item.meta.id)
        if (currentItemIndex < collection.items.length - 1) {
          state.nextItem = collection.items[currentItemIndex + 1]
        }
        if (currentItemIndex > 0) {
          state.prevItem = collection.items[currentItemIndex - 1]
        }
      }
    }
  }

  Object.assign(res[HTTP_RESPONSE_PROPERTY_FOR_STATE], {...state}, {...store.getCollectionsFlatten()})

}
