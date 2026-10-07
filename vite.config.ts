import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'

/**
 * En desarrollo emula la Netlify Function de `/api/token` para poder probar
 * la app sin la CLI de Netlify (basta con `npm run dev`).
 * En produccion, Netlify sirve la funcion real en la misma ruta (`config.path`).
 */
function devTokenFunction(): Plugin {
  return {
    name: 'dev-token-function',
    configureServer(server) {
      server.middlewares.use('/api/token', async (req, res) => {
        try {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          const body = await readBody(req)
          const module = await server.ssrLoadModule('/netlify/functions/token.ts')
          const handler = module.default as (request: Request) => Promise<Response>

          const request = new Request('http://localhost/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          })

          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(await response.text())
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: (err as Error).message }))
        }
      })
    },
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default defineConfig(({ mode }) => {
  // Carga TODAS las variables (incluidas las del servidor) en process.env para
  // que la funcion de tokens las vea durante el desarrollo (`npm run dev`).
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return {
    plugins: [react(), devTokenFunction()],
  }
})
