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
    <ul>
      ${Object.keys(state).map(collectionName => /*html*/`<li><a href="/rawdb${url}/${collectionName}">${collectionName}</a></li>`).join('\n')}
    </ul>
  `
  if (url.startsWith('/state/')) {
    const collectionName = url.split('?')[0].split('#')[0].replace('/state/', '')
    if (!!state[collectionName]) {
      return /*html*/`
        <pre>${JSON.stringify(state[collectionName])}</pre>
      `      
    }
  }
  return ''
}