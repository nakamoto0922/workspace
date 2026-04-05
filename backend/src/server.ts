import { serve } from '@hono/node-server'
import { createApp } from './app/app.js'
import { env } from './app/env.js'

const app = createApp()

serve(
  {
    fetch: app.fetch,
    port: env.port,
  },
  (info) => {
    console.log(`backend listening on http://localhost:${info.port}`)
  },
)
