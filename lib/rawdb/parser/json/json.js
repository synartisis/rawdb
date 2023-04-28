/** @typedef {import('../parser.js').ParseResult} ParseResult */
/** @typedef {import('../../../types.js').CollectionItem} CollectionItem */


/** @type {(content: string) => ParseResult} */
export function parse(content) {
  const parsed = JSON.parse(content)
  return { ...parsed, body: '', bodySource: '', bodyProps: [] }
}


/** @type {(item: CollectionItem) => string} */
export function serialize(item) {
  return JSON.stringify(item)
}