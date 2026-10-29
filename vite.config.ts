/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * No `npm run dev`, atende `/api/<nome>` com a função de `api/<nome>.ts`, como a Vercel faz em produção.
 * Lê as variáveis do `.env.local` (ex.: ANTHROPIC_API_KEY) só para essas funções: sem o prefixo VITE_,
 * elas nunca entram no código enviado ao navegador.
 */
function vercelFunctionsInDev(): Plugin {
  return {
    name: 'nexo:vercel-functions-dev',
    apply: 'serve',
    configureServer(server) {
      const { root, mode } = server.config
      for (const [key, value] of Object.entries(loadEnv(mode, root, ''))) process.env[key] ??= value

      server.middlewares.use(async (req, res, next) => {
        const name = req.url?.match(/^\/api\/([a-z0-9-]+)(?:\?|$)/)?.[1]
        if (!name || !existsSync(path.join(root, 'api', `${name}.ts`))) return next()

        try {
          const handlers = await server.ssrLoadModule(`/api/${name}.ts`)
          const handler = handlers[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end()
          }

          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value)
          }

          const response: Response = await handler(
            new Request(new URL(req.url!, 'http://localhost'), {
              method: req.method,
              headers,
              body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
            }),
          )
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// Vite config — https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelFunctionsInDev()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
