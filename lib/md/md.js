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
  const elementsWithId = html.qsa(doc, el => !!html.getAttributes(el)['data-id'])
  for (const el of elementsWithId) {
    const value = html.serialize(el)
    const dataIdAttr = el.attrs.find(o => o.name === 'data-id')
    if (dataIdAttr) {
      dataIdAttr.value = value?.trim()
    }
  }
  return mdAttrs
}
