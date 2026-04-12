import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ApiError } from './api-error.js'
import { pool } from '../db/client.js'
import { env } from './env.js'
import { skillMapRoutes } from '../features/skill-map/api/skill-map-routes.js'
import { skillNodeRoutes } from '../features/skill-map/api/skill-node-routes.js'
import { skillEdgeRoutes } from '../features/skill-map/api/skill-edge-routes.js'
import { progressRoutes } from '../features/progress/api/progress-routes.js'
import { userRoutes } from '../features/users/api/user-routes.js'

export function createApp() {
  const app = new Hono()

  app.use(
    '*',
    cors({
      origin: (requestOrigin) => {
        if (!requestOrigin) {
          return env.frontendOrigins[0] ?? ''
        }

        return env.frontendOrigins.includes(requestOrigin) ? requestOrigin : ''
      },
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    }),
  )

  app.get('/health', (c) =>
    c.json({
      status: 'ok',
    }),
  )

  app.get('/health/db', async (c) => {
    await pool.query('select 1')

    return c.json({
      status: 'ok',
      database: 'ok',
    })
  })

  app.onError((error, c) => {
    if (error instanceof ApiError) {
      return c.json({ message: error.message }, error.status as never)
    }

    console.error(error)
    return c.json({ message: 'Internal Server Error' }, 500)
  })

  app.route('/skill-maps', skillMapRoutes)
  app.route('/skill-nodes', skillNodeRoutes)
  app.route('/skill-edges', skillEdgeRoutes)
  app.route('/progress', progressRoutes)
  app.route('/users', userRoutes)

  return app
}
