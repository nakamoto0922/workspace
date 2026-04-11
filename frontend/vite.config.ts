import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devHost = env.FRONTEND_HOST || '127.0.0.1'
  const devPort = Number(env.PORT || 3000)
  const canonicalLocalHost = `localhost:${devPort}`

  const canonicalizeLoopbackHost = {
    name: 'canonicalize-loopback-host',
    configureServer(server: {
      middlewares: {
        use: (
          handler: (
            req: {
              headers: Record<string, string | string[] | undefined>
              url?: string
            },
            res: {
              statusCode: number
              setHeader: (name: string, value: string) => void
              end: () => void
            },
            next: () => void,
          ) => void,
        ) => void
      }
    }) {
      server.middlewares.use((req, res, next) => {
        const hostHeader = req.headers.host
        const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader

        if (host === `[::1]:${devPort}` || host === `::1:${devPort}`) {
          res.statusCode = 307
          res.setHeader(
            'Location',
            `http://${canonicalLocalHost}${req.url ?? '/'}`,
          )
          res.end()
          return
        }

        next()
      })
    },
  }

  return {
    server: {
      host: devHost,
      port: devPort,
      strictPort: true,
    },
    preview: {
      host: devHost,
      port: devPort,
      strictPort: true,
    },
    plugins: [
      canonicalizeLoopbackHost,
      devtools(),
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
