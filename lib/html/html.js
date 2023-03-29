import { htmlParser } from 'tagel'


export function htmlParse(content) {
  throw new Error('not implemented')
}


export function parseFragment(content) {
  return htmlParser.parseFragment(content)
}

export function serialize(node) {
  return htmlParser.serialize(node)
}

export function qsa(root, predicate, res) {
  return htmlParser.qsa(root, predicate, res)
}