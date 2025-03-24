import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, initDb } from "../src/db.js";
import { generateDuty, generateSoldier } from "./data-factory.js";
import { createFastifyApp } from "./src/app.js";

describe("Test Justice Board Routes", () => {
	let fastify;
	let db;

	const duty1 = generateDuty({ value: 1 });
	const duty2 = generateDuty({ value: 2 });
	const duty3 = generateDuty({ value: 3 });

	const soldier1 = generateSoldier({ _id: "1234566" });
	const soldier2 = generateSoldier({ _id: "1234567" });
	const soldier3 = generateSoldier({ _id: "1234568" });
	const soldier4 = generateSoldier({ _id: "1234569" });

	duty1.soldiers.push(soldier1._id);
	duty1.soldiers.push(soldier2._id);

	duty2.soldiers.push(soldier3._id);

	duty3.soldiers.push(soldier1._id);
	duty3.soldiers.push(soldier2._id);
	duty3.soldiers.push(soldier3._id);

	beforeAll(async () => {
		fastify = await createFastifyApp();
		db = await initDb("JusticeBoardTestDB");
	});

	afterAll(async () => {
		await closeDb();
	});

	afterEach(async () => {
		await db.collection("soldiers").drop();
		await db.collection("duties").drop();
	});

	describe("GET /justice-board", () => {
		it("Should return justice board and status code 200", async () => {
			await db.collection("duties").insertMany([duty1, duty2, duty3]);
			await db.collection("soldiers").insertMany([soldier1, soldier2, soldier3, soldier4]);

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
		});
	});

	describe("GET /justice-board/:id", async () => {
		it("Should return soldier's score and status code 200", async () => {
			await db.collection("duties").insertMany([duty1, duty2, duty3]);
			await db.collection("soldiers").insertMany([soldier1, soldier2, soldier3, soldier4]);

			const soldier1ScoreResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier1._id}`,
			});
			const soldier1Score = soldier1ScoreResponse.json();

			const soldier2ScoreResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier2._id}`,
			});
			const soldier2Score = soldier2ScoreResponse.json();

			const soldier3ScoreResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier3._id}`,
			});
			const soldier3Score = soldier3ScoreResponse.json();

			const soldier4ScoreResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier4._id}`,
			});
			const soldier4Score = soldier4ScoreResponse.json();

			expect(soldier1Score).toBe(duty1.value + duty3.value);
			expect(soldier2Score).toBe(duty1.value + duty3.value);
			expect(soldier3Score).toBe(duty2.value + duty3.value);
			expect(soldier4Score).toBe(0);
		});

		it("Should return status 400, if ID does not have length=7", async () => {
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

		it("Should return status 404, if the soldier ID does not exist", async () => {
			const soldier = generateSoldier({});

			const justiceBoardResponse = await fastify.inject({
				method: "GET",
				url: `/justice-board/${soldier._id}`,
			});

			expect(justiceBoardResponse.statusCode).toBe(404);
		});
	});
});
