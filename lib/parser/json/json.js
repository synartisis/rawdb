/** @type {(content: string) => rawdb.ParseResult} */
export function parse(content) {
  const parsed = JSON.parse(content)
  return { ...parsed, body: '', bodySource: '', bodyProps: [] }
}


/** @type {(object: any) => string} */
export function serialize(object) {
  return JSON.stringify(object)
}