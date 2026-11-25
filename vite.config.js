import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// En développement, les fonctions Netlify /api/steam/* sont servies par Vite (même code qu'en production).
const steamDev = () => ({
  name: 'steam-dev',
  configureServer(server) {
    const routes = { login: 'steam-login', callback: 'steam-callback', me: 'steam-me', logout: 'steam-logout', app: 'steam-app', store: 'steam-store', search: 'steam-search', catalog: 'steam-catalog' }
    server.middlewares.use('/api/steam', async (req, res) => {
      const name = routes[req.url.split('?')[0].replace(/^\//, '')]
      if (!name) return ((res.statusCode = 404), res.end())
      const { default: handler } = await import(/* @vite-ignore */ pathToFileURL(resolve(process.cwd(), 'netlify/functions', name + '.mjs')).href)
      const origin = 'http://localhost:5173'
      const r = await handler(new Request(origin + '/api/steam' + req.url, { headers: { cookie: req.headers.cookie || '' } }))
      res.statusCode = r.status
      r.headers.forEach((v, k) => (k === 'set-cookie' ? res.setHeader('set-cookie', r.headers.getSetCookie?.() ?? v) : res.setHeader(k, v)))
      res.end(await r.text())
    })
  },
})

export default defineConfig({
  plugins: [vue(), tailwindcss(), steamDev()],
})
