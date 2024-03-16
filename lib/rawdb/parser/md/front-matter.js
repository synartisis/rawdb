import yaml from 'js-yaml'

const pattern = /(^-{3}(?:\r\n|\r|\n)([\w\W]*?)-{3}(?:\r\n|\r|\n))?([\w\W]*)*/


/** @param {string} text  */
export function frontMatter(text) {

  let data = null
  let content = ''

  const matches = text.match(pattern)

  if (matches?.[2] !== undefined) {
    // data = yaml.load(matches[2]) || {}
    // use yaml.JSON_SCHEMA to avoid autodetect dates
    data = yaml.load(matches[2], { schema: yaml.JSON_SCHEMA }) || {}
  }

  if (matches?.[3] !== undefined) {
    content = matches[3]
  }

  return { data, content }
}
