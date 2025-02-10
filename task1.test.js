import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFastifyApp } from './app.js';

/*
Tests:
1. /health checkpoint when server is open
2. /health checkpoint when server is closed
3. /health/db when server is open
*/
describe("Health check endpoints", () => {

    // setup fastify server before tests
    let fastify;
    beforeAll(async () => {
        fastify = createFastifyApp();
        await fastify.ready();
    });
    // teardown fastify server after tests
    afterAll(async () => {
        await fastify.close();
    });

    // test /health checkpoint
    it('GET /health should return status 200 with ok', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/health'
        });
        const body = JSON.parse(response.body);
        expect(response.statusCode).toBe(200);
        expect(body.status).toBe('ok');
    });

    // test /health checkpoint when server is closed
    it('GET /health should not return status 200 if server is stopped', async () => {
        await fastify.close();
        try {
            await fastify.inject({
                method: 'GET',
                url: '/health'
            });
        } catch (err) {
            expect(err.statusCode).toBe(500); // error code for FST_ERR_REOPENED_CLOSE_SERVER
        }
        
        // restart the server
        fastify = createFastifyApp();
        await fastify.ready();
    });

    // test /health/db checkpoint
    it('GET /health/db should return status 200 with ok', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/health/db'
        });
        const body = JSON.parse(response.body);
        expect(response.statusCode).toBe(200);
        expect(body.status).toBe('ok');
    });

})

