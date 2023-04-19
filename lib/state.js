import * as store from './store/store.js'
import { getSetting } from './store/settings.js'

const HTTP_RESPONSE_PROPERTY_FOR_STATE = 'locals'


/** @type {(res: rawdb.Response, maybeCollectionUrl: string, maybeId: string) => Promise<void>} */
export async function setState(res, maybeCollectionUrl, maybeId) {

  /** @type {rawdb.State} */
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
      const item = await store.getItem(collection.name, maybeId)
      if (item) {
        const itemProperty = getSetting(collection.name, 'itemproperty')
        if (itemProperty && typeof itemProperty === 'string') state[itemProperty] = item
        state.currentItem = item
        const currentItemIndex = collection.items.findIndex(o => o._id === item._id)
        if (currentItemIndex < collection.items.length - 1) {
          state.nextItem = collection.items[currentItemIndex + 1]
        } else {
          state.nextItem = null
        }
        if (currentItemIndex > 0) {
          state.prevItem = collection.items[currentItemIndex - 1]
        } else {
          state.prevItem = null
        }
      }
    }
  }

  Object.assign(res[HTTP_RESPONSE_PROPERTY_FOR_STATE], {...state}, {...store.getCollectionsFlatten()})

}
