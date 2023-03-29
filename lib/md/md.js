import { marked } from 'marked'
import { frontMatter } from './front-matter.js'
import * as html from '../html/html.js'


export function mdParse(content) {
  const fm = frontMatter(content)
  const body = marked.parse(fm.content)
  const mdBodyAttribs = parseMarkdownBodyAttributes(body) 
  return { ...fm.data, body, mdBodyAttribs }
}



function parseMarkdownBodyAttributes(body) {
  if (!body) return {}
  const mdAttrs = {}
  const doc = html.parseFragment(body)
  const sections = html.qsa(doc, el => el.name === 'section' && el.attribs.id)
  for (const section of sections) {
    const value = html.serialize(section)
    mdAttrs[section.attribs.id] = value?.trim()
  }
  return mdAttrs
}
