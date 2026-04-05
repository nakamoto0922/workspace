import { Hono } from 'hono'
import { skillMapRoutes } from '../features/skill-map/api/skill-map-routes.js'
import { progressRoutes } from '../features/progress/api/progress-routes.js'

export function createApp() {
  const app = new Hono()

  app.get('/health', (c) =>
    c.json({
      status: 'ok',
    }),
  )

  app.route('/skill-maps', skillMapRoutes)
  app.route('/progress', progressRoutes)

  return app
}
