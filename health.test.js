import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createFastifyApp } from './app.js';

describe("Health check endpoints, when server is running", () => {
    let fastify;
    beforeAll(async () => {
        fastify = createFastifyApp();
    });

    it('GET /health should return status 200 with ok', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/health'
        });
        const body = response.json();
        expect(response.statusCode).toBe(200);
        expect(body.status).toBe('ok');
    });

    it('GET /health/db should return status 200 with ok', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/health/db'
        });
        const body = response.json();
        expect(response.statusCode).toBe(200);
        expect(body.status).toBe('ok');
    });

    it('GET /health/db should return status 500 when db is down', async () => {
        vi.spyOn(fastify.mongo.db, 'command').mockRejectedValue(() => {
            throw new Error('MongoDB connection failed');
        });
        const response = await fastify.inject({
            method: 'GET',
            url: '/health/db'
        }); 
        expect(response.statusCode).toBe(500);
    });

})

