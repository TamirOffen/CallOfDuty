import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createFastifyApp } from "../src/app.js";
import { generateTestSoldier } from "./data-factory.js";
import { getSoldierRank } from "../src/models/soldier.js";

describe("Test Soldier Routes", () => {
	describe("POST /soldiers", () => {
		let fastify;

		beforeAll(async () => {
			fastify = await createFastifyApp();
		});

		afterEach(async () => {
			await fastify.mongo.db.collection("soldiers").drop();
		});

		it("Add soldier with rankValue only should return status 201", async () => {
			const newSoldier = generateTestSoldier({ rankValue: 3 });
			const response = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: newSoldier,
			});
			const body = response.json();

			expect(response.statusCode).toBe(201);
			expect(body._id).toBe(newSoldier._id);
			expect(body.name).toBe(newSoldier.name);
			expect(body.rank.name).toBe("lieutenant");
			expect(body.rank.value).toBe(3);
			expect(body.createdAt).toBeDefined();
			expect(body.updatedAt).toBeDefined();
		});

		it("Add soldier with rankName only should return status 201", async () => {
			const soldierRank = getSoldierRank("major");
			const newSoldier = generateTestSoldier({ rankName: soldierRank.name });
			const response = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: newSoldier,
			});
			const soldierInDB = response.json();

			expect(response.statusCode).toBe(201);
			expect(soldierInDB.rank.value).toBe(soldierRank.value);
		});

		it("Add soldier with upper-case limitations should return status 201 and lower-case limitations", async () => {
			const newSoldier = generateTestSoldier({ limitations: ["NO RUNNING", "DiEt"] });
			const response = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: newSoldier,
			});
			const soldierInDB = response.json();

			expect(response.statusCode).toBe(201);
			expect(soldierInDB.limitations).toStrictEqual(["no running", "diet"]);
		});

		it("Add soldier with both rankValue and rankName should return status 400", async () => {
			const response = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ rankName: "private", rankValue: 6 }),
			});

			expect(response.statusCode).toBe(400);
		});

		it("Add soldier without rankValue or rankName should return status 400", async () => {
			const { rankName, rankValue, ...badSoldier } = generateTestSoldier({});
			const response = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: badSoldier,
			});

			expect(response.statusCode).toBe(400);
		});

		it("Add soldier with invalid rankName should return status 400", async () => {
			const response = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ rankName: "ceo" }),
			});

			expect(response.statusCode).toBe(400);
		});

		it("Add soldier with id that is not 7 digits should return status 400", async () => {
			const response1 = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ _id: "12345678" }),
			});

			const response2 = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ _id: "123456" }),
			});

			expect(response1.statusCode).toBe(400);
			expect(response2.statusCode).toBe(400);
		});

		it("Adding a soldier with an ID that already exists in the DB, should return status 500", async () => {
			const response1 = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ _id: "1234567" }),
			});

			const response2 = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ _id: "1234567" }),
			});

			expect(response1.statusCode).toBe(201);
			expect(response2.statusCode).toBe(500);
		});
	});

	describe("GET /soldiers/:id", () => {
		let fastify;
		beforeAll(async () => {
			fastify = await createFastifyApp();
			await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ _id: "1234567", name: "Bob" }),
			});
			await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ _id: "9876543" }),
			});
		});

		afterAll(async () => {
			await fastify.mongo.db.collection("soldiers").drop();
		});

		it("Should return the soldier by id and status 200", async () => {
			const bobResponse = await fastify.inject({
				method: "GET",
				url: "/soldiers/1234567",
			});
			const returnedBob = bobResponse.json();

			expect(bobResponse.statusCode).toBe(200);
			expect(returnedBob._id).toBe("1234567");
			expect(returnedBob.name).toBe("Bob");
		});

		it("Should return status 404 when soldier is not found", async () => {
			const response = await fastify.inject({
				method: "GET",
				url: "/soldiers/8568742",
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe("GET /soldiers by query", () => {
		let fastify;

		beforeAll(async () => {
			fastify = await createFastifyApp();
			await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ name: "Bob", _id: "1346792", limitations: ["food"] }),
			});

			await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({ name: "David", _id: "1234567", limitations: ["standing"] }),
			});

			await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generateTestSoldier({
					name: "David",
					_id: "9876543",
					limitations: ["food", "standing"],
				}),
			});
		});

		afterAll(async () => {
			await fastify.mongo.db.collection("soldiers").drop();
		});

		it("Should return the correct soldiers based on query parameters", async () => {
			const davidSoldiersResponse = await fastify.inject({
				method: "GET",
				url: "/soldiers?name=David",
			});
			const davidSoldiers = davidSoldiersResponse.json();

			const foodStandingSoldiersResponse = await fastify.inject({
				method: "GET",
				url: "/soldiers?limitations=food,standing",
			});
			const foodStandingSoldiers = foodStandingSoldiersResponse.json();

			const foodSoldiersResponse = await fastify.inject({
				method: "GET",
				url: "/soldiers?limitations=food",
			});
			const foodSoldiers = foodSoldiersResponse.json();

			expect(davidSoldiers.length).toBe(2);
			expect(davidSoldiers[0]._id).toBe("1234567");
			expect(davidSoldiers[1]._id).toBe("9876543");

			expect(foodStandingSoldiers.length).toBe(1);
			expect(foodStandingSoldiers[0]._id).toBe("9876543");

			expect(foodSoldiers.length).toBe(2);
			expect(foodSoldiers[0]._id).toBe("1346792");
			expect(foodSoldiers[1]._id).toBe("9876543");
		});

		it("Empty query should not return any soldiers", async () => {
			const allSoldiersResponse = await fastify.inject({
				method: "GET",
				url: "/soldiers",
			});
			const allSoldiers = allSoldiersResponse.json();

			expect(allSoldiers.length).toBe(0);
		});
	});
});
