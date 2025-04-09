import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createFastifyApp } from "../src/app.js";
import { generateDuty, generatePostDuty } from "./data-factory.js";

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

	describe("GET /duties?", () => {
		const dutyNames = ["Hagnash", "Avtash"];
		const dutyValues = [2.5, 3.14, 1.25];
		const constraints = ["gun", "officer"];
		const nonExistentDutyName = "Dalpak";

		const duty1 = generateDuty({
			name: dutyNames[0],
			value: dutyValues[0],
			constraints: constraints,
		});
		const duty2 = generateDuty({
			name: dutyNames[0],
			value: dutyValues[1],
			constraints: constraints,
		});
		const duty3 = generateDuty({
			name: dutyNames[1],
			value: dutyValues[2],
			constraints: constraints.slice(0, 1),
		});

		it("Should return the correct duties based on 1 query parameter", async () => {
			await fastify.mongo.db.collection("duties").insertMany([duty1, duty2, duty3]);
			const duty1ID = duty1._id.toString();
			const duty2ID = duty2._id.toString();
			const response = await fastify.inject({
				method: "GET",
				url: `/duties?name=${dutyNames[0]}`,
			});
			const returnedDuties = response.json();

			expect(returnedDuties[0]._id).toBe(duty1ID);
			expect(returnedDuties[1]._id).toBe(duty2ID);
		});

		it("Should return the correct duties based on 2 query parameters", async () => {
			await fastify.mongo.db.collection("duties").insertMany([duty1, duty2, duty3]);
			const duty1ID = duty1._id.toString();
			const duty2ID = duty2._id.toString();
			const response = await fastify.inject({
				method: "GET",
				url: `/duties?name=${dutyNames[0]}&constraints=${constraints[0]},${constraints[1]}`,
			});
			const returnedDuties = response.json();

			expect(returnedDuties[0]._id).toBe(duty1ID);
			expect(returnedDuties[1]._id).toBe(duty2ID);
		});

		it("Should return an empty array when no duties match the query", async () => {
			const noDutiesResponse = await fastify.inject({
				method: "GET",
				url: `/duties?name=${nonExistentDutyName}`,
			});

			expect(noDutiesResponse.json().length).toBe(0);
		});
	});

	describe("GET /duties/:id", () => {
		it("Should return corresponding duty and code 200", async () => {
			const duty1 = generateDuty({});
			const duty2 = generateDuty({});
			await fastify.mongo.db.collection("duties").insertMany([duty1, duty2]);
			const duty1ID = duty1._id.toString();

			const getDutyResponse = await fastify.inject({
				method: "GET",
				url: `/duties/${duty1ID}`,
			});
			const { _id, ...returnedDuty } = getDutyResponse.json();
			returnedDuty.createdAt = new Date(returnedDuty.createdAt);
			returnedDuty.endTime = new Date(returnedDuty.endTime);
			returnedDuty.startTime = new Date(returnedDuty.startTime);
			returnedDuty.updatedAt = new Date(returnedDuty.updatedAt);
			returnedDuty.statusHistory[0].date = new Date(returnedDuty.statusHistory[0].date);

			expect(getDutyResponse.statusCode).toBe(200);
			expect(_id).toBe(duty1ID);
			expect(duty1).toMatchObject(returnedDuty);
		});

		it("Should return status 404 if duty does not exist", async () => {
			const dutyDNEResponse = await fastify.inject({
				method: "GET",
				url: `/duties/${"".padStart(24, "0")}`,
			});

			expect(dutyDNEResponse.statusCode).toBe(404);
		});
	});
});
