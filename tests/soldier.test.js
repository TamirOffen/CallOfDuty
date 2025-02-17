import { describe, it, expect, beforeAll, vi, beforeEach, afterAll } from 'vitest';
import { createFastifyApp } from './app.js';

describe("Add Soldier", () => {
    let fastify;

    beforeAll(async () => {
        fastify = await createFastifyApp();
    });

    afterAll(async () => {
        await fastify.mongo.db.collection("soldiers").drop().catch();
    });

    beforeEach(async () => {
        await fastify.mongo.db.collection("soldiers").drop().catch();
    });
    
    it('POST /soldiers to add soldier by rankValue only should return status 201', async () => {
        const new_soldier = {
            _id: "1234567",
            name: "Soldier A",
            rankValue: 6,
            limitations: ["cannot run"]
        }

        const response = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldier
        });
        const body = response.json();
        expect(response.statusCode).toBe(201);
        expect(body.rank.name).toBe('colonel');
        expect(body._id).toBe(new_soldier._id);
        expect(body.name).toBe(new_soldier.name);

        const now = new Date();
        const createdAt = new Date(body.createdAt);
        const updatedAt = new Date(body.updatedAt);
        expect(Math.abs(now - createdAt)).toBeLessThan(100);
        expect(Math.abs(now - updatedAt)).toBeLessThan(100);
    });

    it('POST /soldiers to add soldier by rankName only should return status 201', async () => {
        const new_soldier = {
            _id: "1234567",
            name: "Soldier A",
            rankName: 'colonel',
            limitations: ["cannot run"]
        }

        const response = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldier
        });
        const body = response.json();
        expect(response.statusCode).toBe(201);
        expect(body.rank.value).toBe(6);
    });

    it('POST /soldiers to add soldier by rankValue with upper-case limitation should return status 201 and lower-case limitation', async () => {
        const new_soldier = {
            _id: "1234667",
            name: "Soldier A",
            rankValue: 6,
            limitations: ["CANNOT RUN", "LIFT LIMIT 20KG"]
        }

        const response = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldier
        });
        const body = response.json();
        expect(response.statusCode).toBe(201);
        expect(body.rank.name).toBe('colonel');
        expect(body.limitations[0]).toBe('cannot run');
        expect(body.limitations[1]).toBe('lift limit 20kg');
    });

    it('POST /soldiers to add soldier by both rankValue and rankName should return status 400', async () => {
        const new_soldier = {
            _id: "1234667",
            name: "Soldier A",
            rankValue: 6,
            rankName: "colonel",
            limitations: ["cannot run"]
        }

        const response = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldier
        });
        expect(response.statusCode).toBe(400);
    });

    it('POST /soldiers to add soldier without both rankValue or rankName should return status 400', async () => {
        const new_soldier = {
            _id: "1234667",
            name: "Soldier A",
            limitations: ["cannot run"]
        }

        const response = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldier
        });
        expect(response.statusCode).toBe(400);
    });

    it('POST /soldiers to add soldier with invalid rankName should return status 400', async () => {
        const new_soldier = {
            _id: "1234667",
            name: "Soldier A",
            limitations: ["cannot run"]
        }

        const response = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldier
        });
        expect(response.statusCode).toBe(400);
    });
    
    it('POST /soldiers to add soldier with id that is not 7 digits should return status 400', async () => {
        const new_soldierA = {
            _id: "12346678",
            name: "Soldier A",
            rankValue: 6,
            limitations: ["cannot run"]
        }

        const new_soldierB = {
            _id: "1234",
            name: "Soldier B",
            rankValue: 6,
            limitations: ["cannot run"]
        }

        const response1 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierA
        });
        expect(response1.statusCode).toBe(400);

        const response2 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierB
        });
        expect(response2.statusCode).toBe(400);
    });

    it('POST /soldiers to 2 soldiers with the same id should return status 200', async () => {
        const new_soldierA = {
            _id: "1234567",
            name: "Soldier A",
            rankValue: 6,
            limitations: ["cannot run"]
        }

        const new_soldierB = {
            _id: "1234567",
            name: "Soldier B",
            rankValue: 2,
            limitations: ["cannot run"]
        }

        const response1 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierA
        });
        expect(response1.statusCode).toBe(201);

        const response2 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierB
        });
        expect(response2.statusCode).toBe(200);
    });

});


describe("Getting a soldier by ID", () => {
    let fastify;
    beforeAll(async () => {
        fastify = createFastifyApp();
        await fastify.listen();
    });

    afterAll(async () => {
        await fastify.mongo.db.collection("soldiers").drop().catch();
    });

    beforeEach(async () => {
        await fastify.mongo.db.collection("soldiers").drop().catch();
    });

    it("GET /soldiers/:id should return the soldier by id and status 200", async () => {
        const new_soldierA = {
            _id: "1234567",
            name: "Soldier A",
            rankValue: 6,
            limitations: ["cannot run"]
        }
        const new_soldierB = {
            _id: "7654321",
            name: "Soldier B",
            rankValue: 4,
            limitations: ["cannot lift more than 20kg"]
        }

        const response1 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierA
        });
        expect(response1.statusCode).toBe(201);
        const response2 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierB
        });
        expect(response2.statusCode).toBe(201);

        const response3 = await fastify.inject({
            method: 'GET',
            url: '/soldiers/1234567',
        });
        expect(response3.statusCode).toBe(200);
        const returned_soldierA = response3.json();
        expect(returned_soldierA._id).toBe(new_soldierA._id);
        expect(returned_soldierA.name).toBe(new_soldierA.name);
        const response4 = await fastify.inject({
            method: 'GET',
            url: '/soldiers/7654321',
        });
        expect(response4.statusCode).toBe(200);
        const returned_soldierB = response4.json();
        expect(returned_soldierB._id).toBe(new_soldierB._id);
        expect(returned_soldierB.name).toBe(new_soldierB.name);
    });

    it("GET /soldiers/:id should return status 404 when soldier is not found", async () => {
        const new_soldierA = {
            _id: "1234567",
            name: "Soldier A",
            rankValue: 6,
            limitations: ["cannot run"]
        }
        const new_soldierB = {
            _id: "7654321",
            name: "Soldier B",
            rankValue: 4,
            limitations: ["cannot lift more than 20kg"]
        }

        const response1 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierA
        });
        expect(response1.statusCode).toBe(201);
        const response2 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierB
        });
        expect(response2.statusCode).toBe(201);

        const response3 = await fastify.inject({
            method: 'GET',
            url: '/soldiers/1234567',
        });
        expect(response3.statusCode).toBe(200);
        const returned_soldierA = response3.json();
        expect(returned_soldierA._id).toBe(new_soldierA._id);
        expect(returned_soldierA.name).toBe(new_soldierA.name);

        const response4 = await fastify.inject({
            method: 'GET',
            url: '/soldiers/4561239',
        });
        expect(response4.statusCode).toBe(404);

    });
    
});

describe("Deleting a soldier by ID", () => {
    let fastify;
    beforeAll(async () => {
        fastify = createFastifyApp();
        await fastify.listen();
    });

    afterAll(async () => {
        await fastify.mongo.db.collection("soldiers").drop().catch();
    });

    beforeEach(async () => {
        await fastify.mongo.db.collection("soldiers").drop().catch();
    });

    it("DELETE /soldier/:id should return status 204 if soldier is found", async () => {
        const new_soldierA = {
            _id: "1234567",
            name: "Soldier A",
            rankValue: 6,
            limitations: ["cannot run"]
        }
        const new_soldierB = {
            _id: "7654321",
            name: "Soldier B",
            rankValue: 4,
            limitations: ["cannot lift more than 20kg"]
        }

        const response1 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierA
        });
        expect(response1.statusCode).toBe(201);
        const response2 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierB
        });
        expect(response2.statusCode).toBe(201);

        const response_delA = await fastify.inject({
            method: 'DELETE',
            url: '/soldiers/1234567'
        });
        expect(response_delA.statusCode).toBe(204);

        const response_delB = await fastify.inject({
            method: 'DELETE',
            url: '/soldiers/7654321'
        });
        expect(response_delB.statusCode).toBe(204);

    })

    it("DELETE /soldier/:id should return status 404 if soldier is not found", async () => {
        const new_soldierA = {
            _id: "1234567",
            name: "Soldier A",
            rankValue: 6,
            limitations: ["cannot run"]
        }
        const new_soldierB = {
            _id: "7654321",
            name: "Soldier B",
            rankValue: 4,
            limitations: ["cannot lift more than 20kg"]
        }

        const response1 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierA
        });
        expect(response1.statusCode).toBe(201);
        const response2 = await fastify.inject({
            method: 'POST',
            url: '/soldiers',
            payload: new_soldierB
        });
        expect(response2.statusCode).toBe(201);

        const response_del = await fastify.inject({
            method: 'DELETE',
            url: '/soldiers/4562876'
        });
        expect(response_del.statusCode).toBe(404);
    });

});



