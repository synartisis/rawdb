const onProduction = process.env.NODE_ENV === 'production'


export function httpMiddleware(state, settings, endpoint = 'rawdb') {
  return (req, res) => {
    if (req.url.startsWith('/' + endpoint) && !onProduction) {
      const subUrl = req.url.substring(endpoint.length + 1)
      if (subUrl === '') res.redirect('/' + endpoint + '/')
      return rawDbEndpoint(subUrl, state, settings)
    }
    Object.assign(res.locals, {...state})
  }
}


function rawDbEndpoint(url, state, settings) {
  if (url === '/') return /*html*/`
    <h2>rawdb</h2>
    <div><a href="settings">settings</a></div>
    <div><a href="state">state</a></div>
  `
  if (url === '/settings') return JSON.stringify(settings)
  if (url === '/state') return /*html*/`
    <pre>${JSON.stringify(state)}</pre>
  `
  return ''
}