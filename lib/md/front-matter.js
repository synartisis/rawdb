import yaml from 'js-yaml'

const pattern = /(^-{3}(?:\r\n|\r|\n)([\w\W]*?)-{3}(?:\r\n|\r|\n))?([\w\W]*)*/

export function frontMatter(string, opts) {
  opts = opts || {}

  const parsed = {
    data: null,
    content: ''
  }

  const matches = string.match(pattern)

  if (matches[2] !== undefined) {
    const parse = opts.safeLoad ? yaml.safeLoad : yaml.load

    try {
      parsed.data = parse(matches[2]) || {}
    } catch(err) {
      throw err
    }
  }

  if (matches[3] !== undefined) {
    parsed.content = matches[3]
  }

  return parsed
}
