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

		it("Cannot add duty with endTime before startTime, and should return status 400", async () => {
			const now = new Date();
			const earlyEndTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: generatePostDuty({ startTime: now, endTime: earlyEndTime }),
			});
			expect(response.statusCode).toBe(400);
		});

		it("Cannot add duty with startTime in the past, and should return status 400", async () => {
			const now = new Date();
			const earlyStartTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

			const response = await fastify.inject({
				method: "POST",
				url: "/duties",
				payload: generatePostDuty({ startTime: earlyStartTime }),
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
		it("Should return the corresponding duty and status 200", async () => {
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

	describe("DELETE /duties/:id", () => {
		it("Delete duty should return status code 204 if duty is found, and delete duty from DB", async () => {
			const duty1 = generateDuty({});
			const duty2 = generateDuty({});
			await fastify.mongo.db.collection("duties").insertMany([duty1, duty2]);
			const duty1ID = duty1._id.toString();

			const deleteDutyResponse = await fastify.inject({
				method: "DELETE",
				url: `/duties/${duty1ID}`,
			});
			const getDutyResponse = await fastify.inject({
				method: "GET",
				url: `/duties/${duty1ID}`,
			});

			expect(deleteDutyResponse.statusCode).toBe(204);
			expect(getDutyResponse.statusCode).toBe(404);
		});

		it("Should return status 404 if duty does not exist", async () => {
			const dutyDNEResponse = await fastify.inject({
				method: "DELETE",
				url: `/duties/${"".padStart(24, "0")}`,
			});
			expect(dutyDNEResponse.statusCode).toBe(404);
		});

		it("Cannot not delete a scheduled duty, and should return status code 400", async () => {
			const duty = generateDuty({});
			duty.status = "scheduled";
			await fastify.mongo.db.collection("duties").insertOne(duty);
			const dutyID = duty._id.toString();

			const dutyDNEResponse = await fastify.inject({
				method: "DELETE",
				url: `/duties/${dutyID}`,
			});
			const getDutyResponse = await fastify.inject({
				method: "GET",
				url: `/duties/${dutyID}`,
			});

			expect(dutyDNEResponse.statusCode).toBe(400);
			expect(getDutyResponse.statusCode).toBe(200);
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
			expect(updatedDuty).toMatchObject(updateToDuty);
		});

		it("Should return status 404, if ID does not exist", async () => {
			const updateDutyResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${"".padStart(24, "0")}`,
				payload: updateToDuty,
			});

			expect(updateDutyResponse.statusCode).toBe(404);
		});

		it("Cannot update scheduled duties, should return status 400", async () => {
			const scheduledDuty = generateDuty({});
			scheduledDuty.status = "scheduled";
			await fastify.mongo.db.collection("duties").insertOne(scheduledDuty);

			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${scheduledDuty._id.toString()}`,
				payload: updateToDuty,
			});

			expect(patchResponse.statusCode).toBe(400);
		});

		it("Cannot alter the id of the duty, should return status 400", async () => {
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

		it("Cannot add new properties to the duty, should return status 400", async () => {
			await fastify.mongo.db.collection("duties").insertOne(originalDuty);
			const newPropertyUpdate = { new_property: "property" };

			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${originalDuty._id.toString()}`,
				payload: newPropertyUpdate,
			});

			expect(patchResponse.statusCode).toBe(400);
			expect(originalDuty).not.toMatchObject(newPropertyUpdate);
		});

		it("Cannot update duty to have minRank > maxRank, should return status 400", async () => {
			const duty = generateDuty({ minRank: 5 });
			await fastify.mongo.db.collection("duties").insertOne(duty);

			const newPropertyUpdate = { maxRank: 3 };
			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${duty._id.toString()}`,
				payload: newPropertyUpdate,
			});

			expect(patchResponse.statusCode).toBe(400);
		});

		it("Cannot update duty to have startTime be in the past, should return status 400", async () => {
			const duty = generateDuty({});
			await fastify.mongo.db.collection("duties").insertOne(duty);

			const now = new Date();
			const earlyStartTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
			const newPropertyUpdate = { startTime: earlyStartTime };

			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${duty._id.toString()}`,
				payload: newPropertyUpdate,
			});

			expect(patchResponse.statusCode).toBe(400);
		});
	});

	describe("PUT /duties/:id/constraints", () => {
		it("Should return the duty with the updated constraints and status 200", async () => {
			const originalConstraints = ["Aleph", "Bet"];
			const newConstraints = ["A", "B", "C"];
			const duty = generateDuty({ constraints: originalConstraints });
			await fastify.mongo.db.collection("duties").insertOne(duty);

			const putResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty._id.toString()}/constraints`,
				payload: newConstraints,
			});
			const updatedDuty = putResponse.json();

			expect(putResponse.statusCode).toBe(200);
			expect(updatedDuty.constraints).toStrictEqual([...originalConstraints, ...newConstraints]);
			expect(new Date(updatedDuty.createdAt)).lessThan(new Date(updatedDuty.updatedAt));
		});

		it("Should return status 404, if ID does not exist", async () => {
			const putDutyResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${"".padStart(24, "0")}/constraints`,
				payload: [],
			});

			expect(putDutyResponse.statusCode).toBe(404);
		});

		it("Cannot not have duplicate constraints", async () => {
			const originalConstraints = ["Aleph", "Bet"];
			const newConstraints = ["Aleph", "Bet", "C"];
			const duty = generateDuty({ constraints: originalConstraints });
			await fastify.mongo.db.collection("duties").insertOne(duty);

			const putResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty._id.toString()}/constraints`,
				payload: newConstraints,
			});
			const updatedDuty = putResponse.json();

			expect(putResponse.statusCode).toBe(200);
			expect(updatedDuty.constraints).toStrictEqual([
				...new Set([...originalConstraints, ...newConstraints]),
			]);
			expect(new Date(updatedDuty.createdAt)).lessThan(new Date(updatedDuty.updatedAt));
		});
	});
});
