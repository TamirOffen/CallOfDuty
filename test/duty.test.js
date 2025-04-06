import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createFastifyApp } from "../src/app.js";
import { closeDb, initDb } from "../src/db.js";
import { generateDuty, generatePostDuty, generateSoldier, getFutureDate } from "./data-factory.js";

describe("Test Duties Routes", () => {
	let fastify;
	let db;

	beforeAll(async () => {
		fastify = await createFastifyApp();
		db = await initDb("DutiesTestDB");
	});

	beforeEach(async () => {
		await db.collection("soldiers").drop();
		await db.collection("duties").drop();
	});

	afterEach(async () => {
		await db.collection("soldiers").drop();
		await db.collection("duties").drop();
	});

	afterAll(async () => {
		await closeDb();
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
			await db.collection("duties").insertMany([duty1, duty2, duty3]);
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
			await db.collection("duties").insertMany([duty1, duty2, duty3]);
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
			await db.collection("duties").insertMany([duty1, duty2]);
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
			await db.collection("duties").insertMany([duty1, duty2]);
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
			await db.collection("duties").insertOne(duty);
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
			await db.collection("duties").insertOne(originalDuty);

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
			await db.collection("duties").insertOne(scheduledDuty);

			const patchResponse = await fastify.inject({
				method: "PATCH",
				url: `/duties/${scheduledDuty._id.toString()}`,
				payload: updateToDuty,
			});

			expect(patchResponse.statusCode).toBe(400);
		});

		it("Cannot alter the id of the duty, should return status 400", async () => {
			await db.collection("duties").insertOne(originalDuty);
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
			await db.collection("duties").insertOne(originalDuty);
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
			await db.collection("duties").insertOne(duty);

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
			await db.collection("duties").insertOne(duty);

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
			await db.collection("duties").insertOne(duty);

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
			await db.collection("duties").insertOne(duty);

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

	describe("PUT /duties/:id/schedule", () => {
		// TODO: check (sortedSoldiers)

		it("Basic scheduling of 1 soldier to a duty, should succeed and return status 200", async () => {
			const duty = generateDuty({ soldiersRequired: 1 });
			const soldier = generateSoldier({});

			await db.collection("duties").insertOne(duty);
			await db.collection("soldiers").insertOne(soldier);

			const dutyScheduledResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty._id.toString()}/schedule`,
			});
			const dutyScheduled = dutyScheduledResponse.json();

			expect(dutyScheduledResponse.statusCode).toBe(200);
			expect(dutyScheduled.soldiers).toStrictEqual([soldier._id]);
			expect(dutyScheduled.status).toBe("scheduled");
		});

		it("Scheduling of a duty with constraints should take into account soldier limitations ", async () => {
			const soldier1 = generateSoldier({ limitations: ["gun"] });
			const soldier2 = generateSoldier({ limitations: ["standing"] });
			const soldier3 = generateSoldier({ limitations: ["gun", "running"] });

			const duty1 = generateDuty({ soldiersRequired: 1, constraints: ["gun", "running"] });
			const duty2 = generateDuty({ soldiersRequired: 1, constraints: ["running"] });
			const duty3 = generateDuty({ soldiersRequired: 1, constraints: ["gun"] });

			await db.collection("duties").insertMany([duty1, duty2, duty3]);
			await db.collection("soldiers").insertMany([soldier1, soldier2, soldier3]);

			const duty1ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty1._id.toString()}/schedule`,
			});
			const duty1Schedule = duty1ScheduleResponse.json();

			const duty2ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty2._id.toString()}/schedule`,
			});
			const duty2Schedule = duty2ScheduleResponse.json();

			const duty3ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty3._id.toString()}/schedule`,
			});

			expect(duty1ScheduleResponse.statusCode).toBe(200);
			expect(duty2ScheduleResponse.statusCode).toBe(200);
			expect(duty3ScheduleResponse.statusCode).toBe(400);
			expect(duty1Schedule.soldiers).toStrictEqual([soldier2._id]);
			expect(duty2Schedule.soldiers).toStrictEqual([soldier1._id]);
		});

		it("Scheduling of a duty should take into account soldier ranks, and duty minRank/maxRank", async () => {
			const soldier1 = generateSoldier({ rankValue: 3 });
			const soldier2 = generateSoldier({ rankValue: 5 });
			const soldier3 = generateSoldier({ rankValue: 2 });

			const duty1 = generateDuty({ soldiersRequired: 2, minRank: 3 });
			const duty2 = generateDuty({ soldiersRequired: 1, maxRank: 1 });
			const duty3 = generateDuty({ soldiersRequired: 1, minRank: 1 });

			await db.collection("duties").insertMany([duty1, duty2, duty3]);
			await db.collection("soldiers").insertMany([soldier1, soldier2, soldier3]);

			const duty1ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty1._id.toString()}/schedule`,
			});
			const duty1Schedule = duty1ScheduleResponse.json();

			const duty2ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty2._id.toString()}/schedule`,
			});

			const duty3ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty3._id.toString()}/schedule`,
			});
			const duty3Schedule = duty3ScheduleResponse.json();

			expect(duty1ScheduleResponse.statusCode).toBe(200);
			expect(duty2ScheduleResponse.statusCode).toBe(400);
			expect(duty3ScheduleResponse.statusCode).toBe(200);
			expect(duty1Schedule.soldiers).toStrictEqual([soldier1._id, soldier2._id]);
			expect(duty3Schedule.soldiers).toStrictEqual([soldier3._id]);
		});

		it("scheduling of a duty should take into account other duties that overlap in dates", async () => {
			const soldier1 = generateSoldier({});
			const soldier2 = generateSoldier({});
			const soldier3 = generateSoldier({});
			const soldier4 = generateSoldier({});

			const duty1 = generateDuty({
				soldiersRequired: 2,
				startTime: getFutureDate(2),
				endTime: getFutureDate(4),
			});
			const duty2 = generateDuty({
				soldiersRequired: 1,
				startTime: getFutureDate(5),
				endTime: getFutureDate(7),
			});
			const duty3 = generateDuty({
				soldiersRequired: 1,
				startTime: getFutureDate(3),
				endTime: getFutureDate(6),
			});
			const duty4 = generateDuty({
				soldiersRequired: 1,
				startTime: getFutureDate(1),
				endTime: getFutureDate(5),
			});

			await db.collection("duties").insertMany([duty1, duty2, duty3, duty4]);
			await db.collection("soldiers").insertMany([soldier1, soldier2, soldier3, soldier4]);

			const duty1ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty1._id.toString()}/schedule`,
			});
			const duty1Schedule = duty1ScheduleResponse.json();
			console.log(duty1Schedule);

			const duty2ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty2._id.toString()}/schedule`,
			});
			const duty2Schedule = duty2ScheduleResponse.json();
			console.log(duty2Schedule);

			const duty3ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty3._id.toString()}/schedule`,
			});
			const duty3Schedule = duty3ScheduleResponse.json();
			console.log(duty3Schedule);

			const duty4ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty4._id.toString()}/schedule`,
			});
			const duty4Schedule = duty4ScheduleResponse.json();
			console.log(duty4Schedule);

			expect(duty1ScheduleResponse.statusCode).toBe(200);
			expect(duty2ScheduleResponse.statusCode).toBe(200);
			expect(duty3ScheduleResponse.statusCode).toBe(200);
			expect(duty4ScheduleResponse.statusCode).toBe(200);
			expect(duty1Schedule.soldiers).toStrictEqual([soldier1._id, soldier2._id]);
			expect(duty2Schedule.soldiers).toStrictEqual([soldier3._id]);
			expect(duty3Schedule.soldiers).toStrictEqual([soldier4._id]);
			expect(duty4Schedule.soldiers).toStrictEqual([soldier3._id]);
		});

		it.only("Scheduling a duty should prioritize soldiers with lower justice board scores", async () => {
			// TODO make more interesting
			const soldier1 = generateSoldier({}); 3
			const soldier2 = generateSoldier({}); 3
			const soldier3 = generateSoldier({}); 5

			const duty1 = generateDuty({
				value: 1,
				soldiersRequired: 2,
				startTime: getFutureDate(2),
				endTime: getFutureDate(3),
			});
			const duty2 = generateDuty({
				value: 2,
				soldiersRequired: 1,
				startTime: getFutureDate(3),
				endTime: getFutureDate(4),
			});
			const duty3 = generateDuty({
				value: 3,
				soldiersRequired: 2,
				startTime: getFutureDate(4),
				endTime: getFutureDate(5),
			});
			const duty4 = generateDuty({
				value: 4,
				soldiersRequired: 1,
				startTime: getFutureDate(5),
				endTime: getFutureDate(6),
			});

			await db.collection("duties").insertMany([duty1, duty2, duty3, duty4]);
			await db.collection("soldiers").insertMany([soldier1, soldier2, soldier3]);

			const duty1ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty1._id.toString()}/schedule`,
			});
			const duty1Schedule = duty1ScheduleResponse.json();
			console.log(duty1Schedule);

			const duty2ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty2._id.toString()}/schedule`,
			});
			const duty2Schedule = duty2ScheduleResponse.json();
			console.log(duty2Schedule);

			const duty3ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty3._id.toString()}/schedule`,
			});
			const duty3Schedule = duty3ScheduleResponse.json();
			console.log(duty3Schedule);

			const duty4ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty4._id.toString()}/schedule`,
			});
			const duty4Schedule = duty4ScheduleResponse.json();
			console.log(duty4Schedule);

			expect(duty1ScheduleResponse.statusCode).toBe(200);
			expect(duty2ScheduleResponse.statusCode).toBe(200);
			expect(duty3ScheduleResponse.statusCode).toBe(200);
			expect(duty4ScheduleResponse.statusCode).toBe(200);
			expect(duty1Schedule.soldiers).toStrictEqual([soldier1._id, soldier2._id]);
			expect(duty2Schedule.soldiers).toStrictEqual([soldier3._id]);
			expect(duty3Schedule.soldiers).toStrictEqual([soldier1._id, soldier3._id]);
			expect(duty4Schedule.soldiers).toStrictEqual([soldier3._id]);
		});


		it("schedule test 1", async () => {
			const soldier1 = generateSoldier({ _id: "1234567", rankValue: 3 });
			const soldier2 = generateSoldier({ _id: "1234568", rankValue: 5 });
			const soldier3 = generateSoldier({ _id: "1234569", rankValue: 2 });

			const duty1 = generateDuty({
				value: 1,
				soldiersRequired: 2,
				minRank: 3,
				startTime: getFutureDate(2),
				endTime: getFutureDate(4),
			});
			const duty2 = generateDuty({
				value: 2,
				soldiersRequired: 1,
				startTime: getFutureDate(5),
				endTime: getFutureDate(7),
			});
			const duty3 = generateDuty({
				value: 3,
				soldiersRequired: 3,
				startTime: getFutureDate(3),
				endTime: getFutureDate(6),
			});

			await db.collection("duties").insertMany([duty1, duty2, duty3]);
			await db.collection("soldiers").insertMany([soldier1, soldier2, soldier3]);

			const duty1ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty1._id.toString()}/schedule`,
			});
			const duty1Schedule = duty1ScheduleResponse.json();
			console.log(duty1Schedule);

			const duty2ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty2._id.toString()}/schedule`,
			});
			const duty2Schedule = duty2ScheduleResponse.json();
			console.log(duty2Schedule);

			const duty3ScheduleResponse = await fastify.inject({
				method: "PUT",
				url: `/duties/${duty3._id.toString()}/schedule`,
			});
			const duty3Schedule = duty3ScheduleResponse.json();
			console.log(duty3Schedule);
		});

		/* TODO: add the following tests
🧠 1. Tie-breaker by rank (or another secondary criteria)
Scenario: Two or more soldiers have the same justice board score — who gets picked?

Add 3 soldiers with identical justice scores.

Give them different ranks (or constraints).

Schedule a duty that requires fewer soldiers than available.

Assert that your tie-breaker logic (e.g. lowest rank or first created) is respected.

🧠 2. Soldiers with lowest justice score are ineligible due to constraints
Scenario: Soldiers with the lowest justice score can't be assigned due to:

Already being scheduled in an overlapping duty

Failing rank or constraint requirements

Purpose: This tests that your logic correctly skips over the "best" candidate when they're not actually valid.

🧠 3. One soldier is eligible for every duty, others are only eligible for one
Scenario:

You have 3 duties and 3 soldiers.

Soldier A has the lowest justice score and is eligible for all 3 duties.

Soldiers B and C are only eligible for one specific duty each.

Goal: Ensure Soldier A is not greedily used in the first duty but smartly saved for where others can't fill in — this is "global fairness" vs. "greedy local optimization."

🧠 4. Dynamic justice board impact
Scenario: Soldiers' justice board scores change between duty assignments.

Schedule a duty.

Manually update a soldier’s justice score (e.g. penalize them).

Schedule another duty.

Check: Logic responds to updated score.

This simulates real-life adjustments (e.g. punishments, new performance evaluations).

🧠 5. Maxed out soldiers (justice abuse detection)
Scenario: A soldier has the best justice score but has been assigned to many high-value duties already.

Test whether your system has any protection against overusing them.

Could involve keeping a per-soldier cumulative duty value and balancing assignments.

Great for fairness systems — you might not implement this now, but it shows you're thinking big!

🧠 6. Scheduling chain-reaction
Scenario: Each scheduled duty causes fewer soldiers to be available for the next — does the system still pick the right one?

Set it up like dominoes and track the decision impact.
		*/
	});
});
