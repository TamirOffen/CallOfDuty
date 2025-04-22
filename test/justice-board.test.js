import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createFastifyApp } from "../src/app.js";
import { closeDb, initDb } from "../src/db.js";
import { generateDuty, generateSoldier } from "./data-factory.js";

describe("Test Justice Board Routes", () => {
	let fastify;
	let db;

	beforeAll(async () => {
		fastify = await createFastifyApp();
		db = await initDb("JusticeBoardTestDB");
	});

	afterAll(async () => {
		await closeDb();
	});

	afterEach(async () => {
		await db.dropDatabase();
	});

	beforeEach(async () => {
		await db.dropDatabase();
	});

	describe("GET /justice-board", () => {
		it("should return score of the duty a soldier is assigned to, when soldier is assigned to 1 duty", async () => {
			const soldier = generateSoldier();
			const duty = generateDuty({ soldiers: [soldier._id] });

			await Promise.all([
				db.collection("soldiers").insertOne(soldier),
				db.collection("duties").insertOne(duty),
			]);

			const justiceBoardResponse = await fastify.inject({
				method: "GET",
				url: "/justice-board",
			});
			const justiceBoard = justiceBoardResponse.json();
			const score = justiceBoard.find((item) => item._id === soldier._id)?.score;

			expect(score).toBe(duty.value);
			expect(justiceBoardResponse.statusCode).toBe(200);
		});

		it("should return score of 0 and status 200 when soldier is not assigned to any duty", async () => {
			const soldier = generateSoldier();
			const duty = generateDuty();

			await Promise.all([
				db.collection("soldiers").insertOne(soldier),
				db.collection("duties").insertOne(duty),
			]);

			const justiceBoardResponse = await fastify.inject({
				method: "GET",
				url: "/justice-board",
			});
			const justiceBoard = justiceBoardResponse.json();
			const score = justiceBoard.find((item) => item._id === soldier._id)?.score;

			expect(score).toBe(0);
			expect(justiceBoardResponse.statusCode).toBe(200);
		});

		it("should return scores of the duties a soldier is assigned to, when soldier is assigned to multiple duties", async () => {
			const soldier = generateSoldier();
			const duty1 = generateDuty({ soldiers: [soldier._id] });
			const duty2 = generateDuty({ soldiers: [soldier._id] });
			const duty3 = generateDuty({ soldiers: [soldier._id] });

			await Promise.all([
				db.collection("soldiers").insertOne(soldier),
				db.collection("duties").insertMany([duty1, duty2, duty3]),
			]);

			const justiceBoardResponse = await fastify.inject({
				method: "GET",
				url: "/justice-board",
			});
			const justiceBoard = justiceBoardResponse.json();
			const score = justiceBoard.find((item) => item._id === soldier._id)?.score;

			expect(score).toBe(duty1.value + duty2.value + duty3.value);
			expect(justiceBoardResponse.statusCode).toBe(200);
		});

		it("should calculate justice board scores correctly for multiple soldiers with assigned duties", async () => {
			const soldier1 = generateSoldier();
			const soldier2 = generateSoldier();
			const soldier3 = generateSoldier();
			const soldier4 = generateSoldier();

			const duty1 = generateDuty({ soldiers: [soldier1._id, soldier2._id] });
			const duty2 = generateDuty({ soldiers: [soldier3._id] });
			const duty3 = generateDuty({ soldiers: [soldier1._id, soldier2._id, soldier3._id] });

			await Promise.all([
				db.collection("duties").insertMany([duty1, duty2, duty3]),
				db.collection("soldiers").insertMany([soldier1, soldier2, soldier3, soldier4]),
			]);

			const justiceBoardResponse = await fastify.inject({
				method: "GET",
				url: "/justice-board",
			});
			const justiceBoardAgg = justiceBoardResponse.json();

			const justiceBoardDict = {};
			for (const idAndScore of justiceBoardAgg) {
				justiceBoardDict[idAndScore._id] = idAndScore.score;
			}

			expect(justiceBoardDict[soldier1._id]).toBe(duty1.value + duty3.value);
			expect(justiceBoardDict[soldier2._id]).toBe(duty1.value + duty3.value);
			expect(justiceBoardDict[soldier3._id]).toBe(duty2.value + duty3.value);
			expect(justiceBoardDict[soldier4._id]).toBe(0);
			expect(justiceBoardResponse.statusCode).toBe(200);
		});
	});

	describe("GET /justice-board/:id", async () => {
		it("should return score of the duty a soldier is assigned to, when soldier is assigned to 1 duty", async () => {
			const soldier = generateSoldier();
			const duty = generateDuty({ soldiers: [soldier._id] });

			await Promise.all([
				db.collection("soldiers").insertOne(soldier),
				db.collection("duties").insertOne(duty),
			]);

			const justiceBoardResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier._id}`,
			});
			const justiceBoardScore = justiceBoardResponse.json();

			expect(justiceBoardScore).toBe(duty.value);
			expect(justiceBoardResponse.statusCode).toBe(200);
		});

		it("should return score of 0 and status 200 when soldier is not assigned to any duty", async () => {
			const soldier = generateSoldier();
			const duty = generateDuty();

			await Promise.all([
				db.collection("soldiers").insertOne(soldier),
				db.collection("duties").insertOne(duty),
			]);

			const justiceBoardResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier._id}`,
			});
			const justiceBoardScore = justiceBoardResponse.json();

			expect(justiceBoardScore).toBe(0);
			expect(justiceBoardResponse.statusCode).toBe(200);
		});

		it("should return scores of the duties a soldier is assigned to, when soldier is assigned to multiple duties", async () => {
			const soldier = generateSoldier();
			const duty1 = generateDuty({ soldiers: [soldier._id] });
			const duty2 = generateDuty({ soldiers: [soldier._id] });
			const duty3 = generateDuty({ soldiers: [soldier._id] });

			await Promise.all([
				db.collection("soldiers").insertOne(soldier),
				db.collection("duties").insertMany([duty1, duty2, duty3]),
			]);

			const justiceBoardResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier._id}`,
			});
			const justiceBoardScore = justiceBoardResponse.json();

			expect(justiceBoardScore).toBe(duty1.value + duty2.value + duty3.value);
			expect(justiceBoardResponse.statusCode).toBe(200);
		});

		it("should return soldier's justice board score when there are multiple soldiers and duties in the db", async () => {
			const soldier1 = generateSoldier();
			const soldier2 = generateSoldier();
			const soldier3 = generateSoldier();
			const soldier4 = generateSoldier();

			const duty1 = generateDuty({ soldiers: [soldier1._id, soldier2._id] });
			const duty2 = generateDuty({ soldiers: [soldier3._id] });
			const duty3 = generateDuty({ soldiers: [soldier1._id, soldier2._id, soldier3._id] });

			await Promise.all([
				db.collection("duties").insertMany([duty1, duty2, duty3]),
				db.collection("soldiers").insertMany([soldier1, soldier2, soldier3, soldier4]),
			]);

			const soldier3ScoreResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier3._id}`,
			});
			const soldier3Score = soldier3ScoreResponse.json();

			expect(soldier3Score).toBe(duty2.value + duty3.value);
			expect(soldier3ScoreResponse.statusCode).toBe(200);
		});

		it("should return status 400, if ID does not have 7 digits", async () => {
			const shortSoldierID = "123456";
			const longSoldierID = "12345678";

			const shortSoldierIDResp = await fastify.inject({
				method: "GET",
				url: `/justice-board/${shortSoldierID}`,
			});

			const longSoldierIDResp = await fastify.inject({
				method: "GET",
				url: `/justice-board/${longSoldierID}`,
			});

			expect(shortSoldierIDResp.statusCode).toBe(400);
			expect(longSoldierIDResp.statusCode).toBe(400);
		});

		it("should return status 404, if the soldier ID does not exist", async () => {
			const soldier = generateSoldier();

			const justiceBoardResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier._id}`,
			});

			expect(justiceBoardResponse.statusCode).toBe(404);
		});
	});
});
