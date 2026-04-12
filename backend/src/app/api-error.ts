import type { Context } from 'hono'
import { ZodError, type ZodType } from 'zod'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, message)
    this.name = 'BadRequestError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message)
    this.name = 'ConflictError'
  }
}

export async function readJsonBody<TSchema extends ZodType>(
  c: Context,
  schema: TSchema,
) {
  let body: unknown

  try {
    body = await c.req.json()
  } catch {
    throw new BadRequestError('Request body must be valid JSON.')
  }

  return parseWithSchema(schema, body)
}

export function parseWithSchema<TSchema extends ZodType>(
  schema: TSchema,
  input: unknown,
) {
  try {
    return schema.parse(input)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestError(formatZodError(error))
    }

    throw error
  }
}

function formatZodError(error: ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'request'
      return `${path}: ${issue.message}`
    })
    .join('; ')
}
