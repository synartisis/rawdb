import { marked } from 'marked'
import { frontMatter } from './front-matter.js'
import * as html from 'syn-html-parser'


/** @param {string} content */
export function mdParse(content) {
  const fm = frontMatter(content)
  const body = marked.parse(fm.content)
  const mdBodyAttribs = parseMarkdownBodyAttributes(body) 
  return { ...fm.data, ...mdBodyAttribs, body }
}


/** @param {string} body */
function parseMarkdownBodyAttributes(body) {
  if (!body) return {}
  const mdAttrs = Object.create(null)
  const doc = html.parseFragment(body)
  const elementsWithId = html.qsa(doc, el => !!html.getAttribute(el, 'data-id'))
  for (const el of elementsWithId) {
    const attr = html.getAttribute(el, 'data-id')
    if (!attr) continue
    const value = html.serialize(el)
    mdAttrs[attr] = value
  }
  return mdAttrs
}
