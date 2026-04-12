import {
  apiErrorResponseSchema,
  progressMutationResponseSchema,
  progressRemovalResponseSchema,
  skillMapSummaryListSchema,
  skillMapValidationSchema,
  userSkillMapBundleSchema,
  userSummaryListSchema,
} from './contracts'
import type {
  ProgressMutationRequest,
  ProgressMutationResponse,
  ProgressRemovalResponse,
  SkillMapSummary,
  SkillMapValidation,
  UserSkillMapBundle,
  UserSummary,
} from './contracts'

type Schema<TData> = {
  safeParse: (input: unknown) =>
    | {
        success: true
        data: TData
      }
    | {
        success: false
        error: {
          issues: Array<{
            path: PropertyKey[]
            message: string
          }>
        }
      }
}

const DEFAULT_API_BASE_URL = 'http://localhost:8787'

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, '')

export async function listUsers(): Promise<UserSummary[]> {
  return request('/users', {
    schema: userSummaryListSchema,
  })
}

export async function listSkillMaps(): Promise<SkillMapSummary[]> {
  return request('/skill-maps', {
    schema: skillMapSummaryListSchema,
  })
}

export async function getUserSkillMapBundle(
  userId: string,
  skillMapId: string,
): Promise<UserSkillMapBundle> {
  return request(`/users/${userId}/skill-maps/${skillMapId}`, {
    schema: userSkillMapBundleSchema,
  })
}

export async function getSkillMapValidation(
  skillMapId: string,
): Promise<SkillMapValidation> {
  return request(`/skill-maps/${skillMapId}/validate`, {
    method: 'POST',
    schema: skillMapValidationSchema,
  })
}

export async function completeSkillNode(input: {
  skillNodeId: string
  body: ProgressMutationRequest
}): Promise<ProgressMutationResponse> {
  return request(`/progress/${input.skillNodeId}/complete`, {
    method: 'POST',
    body: input.body,
    schema: progressMutationResponseSchema,
  })
}

export async function resetSkillNodeCompletion(input: {
  skillNodeId: string
  body: ProgressMutationRequest
}): Promise<ProgressRemovalResponse> {
  return request(`/progress/${input.skillNodeId}/complete`, {
    method: 'DELETE',
    body: input.body,
    schema: progressRemovalResponseSchema,
  })
}

async function request<TData>(
  path: string,
  options: {
    body?: unknown
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    schema: Schema<TData>
  },
) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await readJsonPayload(response)

  if (!response.ok) {
    const parsedError = apiErrorResponseSchema.safeParse(payload)
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : `API request failed with status ${response.status}.`,
    )
  }

  const parsed = options.schema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(formatSchemaIssues(parsed.error.issues))
  }

  return parsed.data
}

async function readJsonPayload(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function formatSchemaIssues(
  issues: Array<{
    path: PropertyKey[]
    message: string
  }>,
) {
  return issues
    .map((issue) => {
      const path =
        issue.path.length > 0
          ? issue.path.map((segment) => String(segment)).join('.')
          : 'response'
      return `${path}: ${issue.message}`
    })
    .join('; ')
}
