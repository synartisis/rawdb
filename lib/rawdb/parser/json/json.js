/** @type {(content: string) => rawdb.ParseResult} */
export function parse(content) {
  const parsed = JSON.parse(content)
  return { ...parsed, body: '', bodySource: '', bodyProps: [] }
}


/** @type {(object: rawdb.CollectionItem) => string} */
export function serialize(object) {
  return JSON.stringify(object)
}