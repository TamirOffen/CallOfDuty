import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createFastifyApp } from "../src/app.js";
import { closeDb, initDb } from "../src/db.js";
import { getSoldierRank } from "../src/models/soldier.js";
import { generatePostSoldier, generateSoldier } from "./data-factory.js";

describe("Test Soldier Routes", () => {
	let fastify;
	let db;

	beforeAll(async () => {
		db = await initDb("SoldiersTestDB");
		fastify = await createFastifyApp();
	});

	beforeEach(async () => {
		await db.collection("soldiers").drop();
	});

	afterEach(async () => {
		await db.collection("soldiers").drop();
	});

	afterAll(async () => {
		await closeDb();
	});

	describe("POST /soldiers", () => {
		it("Add soldier with rankValue only should return status 201", async () => {
			const newSoldierPost = generatePostSoldier({ rankValue: 3 });
			const response = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: newSoldierPost,
			});
			const { rankValue, ...soldierCompare } = newSoldierPost;
			const soldierInDB = response.json();

			expect(response.statusCode).toBe(201);
			expect(soldierInDB).toMatchObject(soldierCompare);
			expect(soldierInDB.rank).toStrictEqual(
				getSoldierRank(newSoldierPost.rankName, newSoldierPost.rankValue),
			);
			expect(soldierInDB.createdAt).toBeDefined();
			expect(soldierInDB.updatedAt).toBeDefined();
		});

		it("Add soldier with rankName only should return status 201", async () => {
			const soldierRank = getSoldierRank("major");
			const newSoldier = generatePostSoldier({ rankName: soldierRank.name });
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
			const upperCaseLimitations = ["NO RUNNING", "DiEt"];
			const newSoldier = generatePostSoldier({ limitations: upperCaseLimitations });
			const response = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: newSoldier,
			});
			const soldierInDB = response.json();

			expect(response.statusCode).toBe(201);
			expect(soldierInDB.limitations).toStrictEqual(
				upperCaseLimitations.map((item) => item.toLowerCase()),
			);
		});

		it("Add soldier with both rankValue and rankName should return status 400", async () => {
			const response = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generatePostSoldier({ rankName: "private", rankValue: 6 }),
			});

			expect(response.statusCode).toBe(400);
		});

		it("Add soldier without rankValue or rankName should return status 400", async () => {
			const { rankName, rankValue, ...badSoldier } = generatePostSoldier();
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
				payload: generatePostSoldier({ rankName: "ceo" }),
			});

			expect(response.statusCode).toBe(400);
		});

		it("Add soldier with id that is not 7 digits should return status 400", async () => {
			const response1 = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generatePostSoldier({ _id: "12345678" }),
			});

			expect(response1.statusCode).toBe(400);

			const response2 = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generatePostSoldier({ _id: "123456" }),
			});

			expect(response2.statusCode).toBe(400);
		});

		it("Adding a soldier with an ID that already exists in the DB, should return status 500", async () => {
			const soldierID = "1234567";
			const response1 = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generatePostSoldier({ _id: soldierID }),
			});

			const response2 = await fastify.inject({
				method: "POST",
				url: "/soldiers",
				payload: generatePostSoldier({ _id: soldierID }),
			});

			expect(response1.statusCode).toBe(201);
			expect(response2.statusCode).toBe(500);
		});
	});

	describe("GET /soldiers/:id", () => {
		it("Should return the soldier by id and status 200", async () => {
			const soldier1 = generateSoldier();

			await db.collection("soldiers").insertMany([soldier1, generateSoldier()]);

			const response = await fastify.inject({
				method: "GET",
				url: `/soldiers/${soldier1._id}`,
			});
			const returnedSoldier = response.json();

			expect(response.statusCode).toBe(200);
			expect(returnedSoldier._id).toBe(soldier1._id);
		});

		it("Should return status 404 when soldier is not found", async () => {
			const nonExistentSoldierID = generateSoldier()._id;

			const response = await fastify.inject({
				method: "GET",
				url: `/soldiers/${nonExistentSoldierID}`,
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe("DELETE /soldiers/:id", () => {
		it("Delete soldier should return status 204 if soldier is found", async () => {
			const soldier = generateSoldier();

			await db.collection("soldiers").insertMany([soldier, generateSoldier()]);

			const responseDelBob = await fastify.inject({
				method: "DELETE",
				url: `/soldiers/${soldier._id}`,
			});

			const responseGetSoldier = await fastify.inject({
				method: "GET",
				url: `/soldiers/${soldier._id}`,
			});

			expect(responseDelBob.statusCode).toBe(204);
			expect(responseGetSoldier.statusCode).toBe(404);
		});

		it("Delete soldier should return status 404 if soldier is not found", async () => {
			const nonExistentSoldierID = generateSoldier()._id;

			const responseDel = await fastify.inject({
				method: "DELETE",
				url: `/soldiers/${nonExistentSoldierID}`,
			});

			expect(responseDel.statusCode).toBe(404);
		});
	});

	describe("PATCH /soldiers/:id", () => {
		it("Should return updated soldier with status 200", async () => {
			const soldier = generateSoldier();
			await db.collection("soldiers").insertOne(soldier);

			const updateToSoldier = {
				name: "Robert Zimmerman",
				rankName: "major",
				limitations: ["has to sleep atleast 7 hours per day"],
			};
			const { rankName, ...soldierCompare } = updateToSoldier;
			soldierCompare.rank = getSoldierRank(updateToSoldier.rankName);

			const updateSoldierResponse = await fastify.inject({
				method: "PATCH",
				url: `/soldiers/${soldier._id}`,
				payload: updateToSoldier,
			});
			const updatedSoldier = updateSoldierResponse.json();

			expect(updateSoldierResponse.statusCode).toBe(200);
			expect(updatedSoldier).toMatchObject(soldierCompare);
			expect(updatedSoldier.createdAt < updatedSoldier.updatedAt).toBe(true);
		});

		it("Update with unwanted properties should be igored", async () => {
			const soldier = generateSoldier();
			await db.collection("soldiers").insertOne(soldier);

			const updateToSoldier = {
				_id: "4567892",
				name: "Robert Zimmerman",
				rankName: "major",
				limitations: ["has to sleep atleast 7 hours per day"],
				fathers_name: "Abram Zimmerman",
			};
			const { _id, rankName, fathers_name, ...soldierCompare } = updateToSoldier;
			soldierCompare.rank = getSoldierRank(updateToSoldier.rankName);

			const updateSoldierResponse = await fastify.inject({
				method: "PATCH",
				url: `/soldiers/${soldier._id}`,
				payload: updateToSoldier,
			});
			const updatedSoldier = updateSoldierResponse.json();

			expect(updateSoldierResponse.statusCode).toBe(200);
			expect(updatedSoldier).toMatchObject(soldierCompare);
			expect(updatedSoldier.createdAt < updatedSoldier.updatedAt).toBe(true);
			expect(updatedSoldier._id).toBe(soldier._id);
			expect(updatedSoldier).not.toHaveProperty(updateToSoldier.fathers_name);
		});

		it("Should reject with status 404 if id is not found ", async () => {
			const updateToSoldier = {
				name: "Robert Zimmerman",
			};
			const soldier = generateSoldier();

			const updateSoldierResponse = await fastify.inject({
				method: "PATCH",
				url: `/soldiers/${soldier._id}`,
				payload: updateToSoldier,
			});

			expect(updateSoldierResponse.statusCode).toBe(404);
		});

		it("Should reject with status 400 if both rankValue and rankName are present", async () => {
			const soldier = generateSoldier();

			await db.collection("soldiers").insertOne(soldier);

			const updateToSoldier = {
				rankName: "major",
				rankValue: 5,
			};

			const updateSoldierResponse = await fastify.inject({
				method: "PATCH",
				url: `/soldiers/${soldier._id}`,
				payload: updateToSoldier,
			});

			expect(updateSoldierResponse.statusCode).toBe(400);
		});
	});

	describe("GET /soldiers by query", () => {
		it("Should return the correct soldiers based on one search parameter", async () => {
			const name = "tamir";
			const soldier1 = generateSoldier({ name: name });
			const soldier2 = generateSoldier({ name: name });
			const soldier3 = generateSoldier();

			await db.collection("soldiers").insertMany([soldier1, soldier2, soldier3]);

			const getSoldiersResp = await fastify.inject({
				method: "GET",
				url: `/soldiers?name=${name}`,
			});

			const returnedSoldiers = getSoldiersResp.json();

			expect(returnedSoldiers.length).toBe(2);
			expect(returnedSoldiers[0]._id).toBe(soldier1._id);
			expect(returnedSoldiers[1]._id).toBe(soldier2._id);
		});

		it("Should return the correct soldiers based on two search parameters", async () => {
			const name = "tamir";
			const limitations = ["food", "sleeping"];
			const soldier1 = generateSoldier({ name: name });
			const soldier2 = generateSoldier({ name: name, limitations: limitations });
			const soldier3 = generateSoldier({ limitations: limitations });

			await db.collection("soldiers").insertMany([soldier1, soldier2, soldier3]);

			const getSoldiersResp = await fastify.inject({
				method: "GET",
				url: `/soldiers?name=${name}&limitations=${limitations[0]},${limitations[1]}`,
			});

			const returnedSoldiers = getSoldiersResp.json();

			expect(returnedSoldiers.length).toBe(1);
			expect(returnedSoldiers[0]._id).toBe(soldier2._id);
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

	describe("PUT /soldiers/:id/limitations", () => {
		const soldierID = "1234567";
		const nonExistentSoldierID = "9876543";
		const limitations = ["food", "walking", "sleeping"];

		it("Should add the limitations to the soldier and return status 200", async () => {
			await db
				.collection("soldiers")
				.insertOne(generateSoldier({ _id: soldierID, limitations: limitations.slice(0, 1) }));

			const response = await fastify.inject({
				method: "PUT",
				url: `/soldiers/${soldierID}/limitations`,
				payload: limitations.slice(1),
			});
			const updatedSoldier = response.json();
			const updatedLimitations = updatedSoldier.limitations;

			expect(updatedSoldier.createdAt < updatedSoldier.updatedAt).toBe(true);
			expect(updatedLimitations).toStrictEqual(limitations);
		});

		it("Should return status 404 if soldier not found", async () => {
			const response = await fastify.inject({
				method: "PUT",
				url: `/soldiers/${nonExistentSoldierID}/limitations`,
				payload: limitations,
			});

			expect(response.statusCode).toBe(404);
		});

		it("PUT /soldiers/:id/limitations should not have duplicate limitations", async () => {
			await db
				.collection("soldiers")
				.insertOne(generateSoldier({ _id: soldierID, limitations: limitations.slice(0, 2) }));

			const response = await fastify.inject({
				method: "PUT",
				url: `/soldiers/${soldierID}/limitations`,
				payload: limitations.slice(1),
			});
			const updatedSoldier = response.json();
			const updatedLimitations = updatedSoldier.limitations;

			expect(updatedLimitations).toStrictEqual(limitations);
		});

		it("Should make limitations lower-case", async () => {
			const upperCaseLimitations = limitations.slice(1).map((item) => item.toUpperCase());

			await db
				.collection("soldiers")
				.insertOne(generateSoldier({ _id: soldierID, limitations: limitations.slice(0, 1) }));

			const response = await fastify.inject({
				method: "PUT",
				url: `/soldiers/${soldierID}/limitations`,
				payload: upperCaseLimitations,
			});
			const updatedSoldier = response.json();
			const updatedLimitations = updatedSoldier.limitations;

			expect(updatedLimitations.length).toBe(3);
			expect(updatedLimitations).toStrictEqual(limitations);
		});
	});
});
