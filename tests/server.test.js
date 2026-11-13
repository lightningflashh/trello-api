import { describe, beforeEach, it, expect } from '@jest/globals'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'

import { createApp } from '~/server'

describe('Server Tests', () => {
  let app = createApp()
  describe('createApp()', () => {
    beforeEach(() => {
      app = createApp()
    })

    it('should set Cache-Control header to no-store', async () => {
      const res = await request(app).get('/health')

      expect(res.headers['cache-control']).toContain('no-store')
      expect(res.headers['cache-control']).toContain('no-cache')
      expect(res.headers['cache-control']).toContain('must-revalidate')
      expect(res.headers['pragma']).toBe('no-cache')
      expect(res.headers['expires']).toBe('0')
    })
  })

  it('should return 403 for CORS requests from disallowed origins', async () => {
    const res = await request(app)
      .get('/v1/some-endpoint')
      .set('Origin', 'http://disallowed-origin.com')

    expect(res.status).toBe(StatusCodes.NOT_FOUND)
  })
})
