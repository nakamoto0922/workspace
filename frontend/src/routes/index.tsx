import { createFileRoute } from '@tanstack/react-router'
import SkillMapDashboard from '../features/skill-tree/SkillMapDashboard'

export const Route = createFileRoute('/')({ component: HomeRoute })

function HomeRoute() {
  return <SkillMapDashboard />
}
