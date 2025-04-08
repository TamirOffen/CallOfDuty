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
		it("Add duty should return status 201", async () => {
			const dutyPost = generatePostDuty({});
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

		it("Add duty with missing properties should return status 400", async () => {
			const missingPropsDuty = {
				name: "Duty with some missing properties",
				location: [32.07714, 34.79352],
				endTime: "2025-03-01T22:00:00Z",
				constraints: ["Night duty", "Perimeter security"],
				value: 1500.5,
				minRank: 2,
			};
			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: missingPropsDuty,
			});
			expect(response.statusCode).toBe(400);
		});

		it("Add duty duty with illegal GeoJSON location should return status 400", async () => {
			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: generatePostDuty({ location: [134.3, 124.4] }),
			});
			expect(response.statusCode).toBe(400);
		});

		it("Add duty with minRank bigger than maxRank should return status 400", async () => {
			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: generatePostDuty({ minRank: 4, maxRank: 3 }),
			});
			expect(response.statusCode).toBe(400);
		});
	});
});
