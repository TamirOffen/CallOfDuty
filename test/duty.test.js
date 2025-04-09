import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { generateDuty, generatePostDuty } from "./data-factory.js";
import { createFastifyApp } from "./src/app.js";

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

		it("Add duty with minRank bigger than maxRank should return status 404", async () => {
			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: generatePostDuty({ minRank: 4, maxRank: 3 }),
			});
			expect(response.statusCode).toBe(404);
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

			expect(getDutyResponse.statusCode).toBe(200);
			expect(getDutyResponse.json()._id).toBe(duty1ID);
		});

		it("Should return status 404 if duty does not exist", async () => {
			const dutyDNEResponse = await fastify.inject({
				method: "GET",
				url: `/duties/${"".padStart(24, "0")}`,
			});

			expect(dutyDNEResponse.statusCode).toBe(404);
		});
	});

	describe("DELETE /duties/:id", () => {
		it("Should return status 200, if duty exists", async () => {
			const duty1 = generateDuty({});
			const duty2 = generateDuty({});
			await fastify.mongo.db.collection("duties").insertMany([duty1, duty2]);
			const duty1ID = duty1._id.toString();

			const deleteDutyResponse = await fastify.inject({
				method: "DELETE",
				url: `/duties/${duty1ID}`,
			});
			expect(deleteDutyResponse.statusCode).toBe(200);
		});

		it("Should return status 404 if duty does not exist", async () => {
			const dutyDNEResponse = await fastify.inject({
				method: "DELETE",
				url: `/duties/${"".padStart(24, "0")}`,
			});
			expect(dutyDNEResponse.statusCode).toBe(404);
		});
	});

	describe("PATCH /duties/:id", () => {
		const originalDuty = generateDuty({
			name: "Avtash",
			value: 1.25,
			constraints: ["gun"],
		});

		const updateToDuty = {
			name: "Hagnash",
			value: 2.5,
			constraints: ["gun", "officer"],
			soldiersRequired: 2,
		};

		it("Should return updated duty with status 200", async () => {
			await fastify.mongo.db.collection("duties").insertOne(originalDuty);

			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${originalDuty._id.toString()}`,
				payload: updateToDuty,
			});
			const updatedDuty = patchResponse.json();

			expect(patchResponse.statusCode).toBe(200);
			for (const key in updateToDuty) expect(updatedDuty[key]).toStrictEqual(updateToDuty[key]);
		});

		it("Should return status 404, if ID DNE", async () => {
			const updateDutyResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${"".padStart(24, "0")}`,
				payload: updateToDuty,
			});

			expect(updateDutyResponse.statusCode).toBe(404);
		});

		it("Should not be able to update scheduled duties", async () => {
			const scheduledDuty = generateDuty({ status: "scheduled" });
			await fastify.mongo.db.collection("duties").insertOne(scheduledDuty);

			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${scheduledDuty._id.toString()}`,
				payload: updateToDuty,
			});

			expect(patchResponse.statusCode).toBe(404);
		});

		it("Should not be able to alter the id of the duty", async () => {
			await fastify.mongo.db.collection("duties").insertOne(originalDuty);
			const idUpdate = { _id: 123456 };

			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${originalDuty._id.toString()}`,
				payload: idUpdate,
			});

			expect(patchResponse.statusCode).toBe(400);
			expect(originalDuty._id.toString()).not.toEqual(idUpdate._id);
		});

		it("Should not be able to add new properties to the duty", async () => {
			await fastify.mongo.db.collection("duties").insertOne(originalDuty);
			const newPropertyUpdate = { new_property: "property" };

			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${originalDuty._id.toString()}`,
				payload: newPropertyUpdate,
			});

			expect(patchResponse.statusCode).toBe(400);
			for (const newProp of Object.keys(newPropertyUpdate)) {
				expect(originalDuty).not.toHaveProperty(newProp);
			}
		});

		it("Should not be able to update duty to have minRank > maxRank", async () => {
			const duty = generateDuty({ minRank: 3 });
			await fastify.mongo.db.collection("duties").insertOne(duty);
			const newPropertyUpdate = { maxRank: 1 };

			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${duty._id.toString()}`,
				payload: newPropertyUpdate,
			});

			expect(patchResponse.statusCode).toBe(404);
		});
	});

});
