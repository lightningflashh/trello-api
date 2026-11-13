import express from 'express'
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { StatusCodes } from 'http-status-codes'
import cors from 'cors'

import { WHITELIST_DOMAINS } from '~/utils/constants'
import { corsOptions } from '~/config/cors'
import { env } from '~/config/environment'

describe('CORS Configuration Tests', () => {
  const createAppTest = () => {
    const app = express()
    app.use(cors(corsOptions))
    app.get('/test', (_req, res) => res.json({ ok: true }))
    return app
  }

  it('should allow requests from whitelisted domains', async () => {
    const allowedDomain = WHITELIST_DOMAINS[1]
    const app = createAppTest()

    const res = await request(app).get('/test').set('Origin', allowedDomain)

    expect(res.status).toBe(StatusCodes.OK)
    expect(res.body).toEqual({ ok: true })
  })

  it('should allow requests when origin is undefined (e.g., Postman)', async () => {
    const app = createAppTest()
    const res = await request(app).get('/test')

    expect(res.status).toBe(StatusCodes.OK)
    expect(res.body).toEqual({ ok: true })
  })

  describe('CORS Policy Enforcement', () => {
    const originalBuildMode = env.BUILD_MODE

    beforeAll(() => {
      env.BUILD_MODE = 'production'
    })

    afterAll(() => {
      env.BUILD_MODE = originalBuildMode
    })

    it('should reject requests from non-whitelisted domains', async () => {
      const disallowedDomain = 'http://disallowed-origin.com'
      const app = createAppTest()

      const res = await request(app)
        .get('/test')
        .set('Origin', disallowedDomain)

      expect(res.status).toBe(StatusCodes.FORBIDDEN)
    })
  })
})
