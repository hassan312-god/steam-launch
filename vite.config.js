import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// En développement, la fonction Netlify des avis est servie par Vite (même code qu'en production).
const reviewsDev = () => ({
  name: 'reviews-dev',
  configureServer(server) {
    server.middlewares.use('/api/reviews', async (req, res) => {
      const { default: handler } = await import('./netlify/functions/reviews.mjs')
      const r = await handler(new Request('http://localhost/api/reviews' + (req.url === '/' ? '' : req.url)))
      res.statusCode = r.status
      res.setHeader('content-type', 'application/json')
      res.end(await r.text())
    })
  },
})

export default defineConfig({
  plugins: [vue(), tailwindcss(), reviewsDev()],
})
