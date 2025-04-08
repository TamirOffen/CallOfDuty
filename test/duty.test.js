import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createFastifyApp } from "../src/app.js";
import { generatePostDuty } from "./data-factory.js";

describe("Test Duties Routes", () => {
	let fastify;

	beforeAll(async () => {
		fastify = await createFastifyApp();
	});

	beforeEach(async () => {
		await fastify.mongo.db.collection("duties").drop();
	});

	afterEach(async () => {
		await fastify.mongo.db.collection("duties").drop();
	});

	describe("POST /duties", () => {
		it("should add duty and return status code 201", async () => {
			const dutyPost = generatePostDuty();
			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: dutyPost,
			});
			const returnedDuty = response.json();

			expect(response.statusCode).toBe(201);
			expect(returnedDuty).toMatchObject(dutyPost);
			expect(returnedDuty._id).toBeDefined();
			expect(returnedDuty.createdAt).toBeDefined();
			expect(returnedDuty.updatedAt).toBeDefined();
			expect(returnedDuty.statusHistory).toBeDefined();
		});

		it("should not add a duty with missing properties, and return status code 400", async () => {
			const { value, ...missingPropsDuty } = generatePostDuty();
			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: missingPropsDuty,
			});

			expect(response.statusCode).toBe(400);
		});

		it("should not add a duty with illegal GeoJSON location, and return status code 400", async () => {
			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: generatePostDuty({ location: [134.3, 124.4] }),
			});

			expect(response.statusCode).toBe(400);
		});

		it("should not add a duty with minRank bigger than maxRank, and return status code 500", async () => {
			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: generatePostDuty({ minRank: 4, maxRank: 3 }),
			});

			expect(response.statusCode).toBe(500);
		});
	});
});
