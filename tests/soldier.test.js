import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createFastifyApp } from "./app.js";
import Bob from './test-data/soldier-bob.json';
import David from './test-data/soldier-david.json';

describe("Add Soldier", () => {
	let fastify;

	beforeAll(async () => {
		fastify = await createFastifyApp();
	});

	afterAll(async () => {
		await fastify.mongo.db.collection("soldiers").drop().catch();
	});

	beforeEach(async () => {
		await fastify.mongo.db.collection("soldiers").drop().catch();
	});

	it("POST /soldiers to add soldier by rankValue only should return status 201", async () => {
		const new_soldier = {
			_id: "1234567",
			name: "Soldier A",
			rankValue: 6,
			limitations: ["cannot run"],
		};

		const response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldier,
		});
		const body = response.json();
		expect(response.statusCode).toBe(201);
		expect(body.rank.name).toBe("colonel");
		expect(body._id).toBe(new_soldier._id);
		expect(body.name).toBe(new_soldier.name);

		const now = new Date();
		const createdAt = new Date(body.createdAt);
		const updatedAt = new Date(body.updatedAt);
		expect(Math.abs(now - createdAt)).toBeLessThan(100);
		expect(Math.abs(now - updatedAt)).toBeLessThan(100);
	});

	it("POST /soldiers to add soldier by rankName only should return status 201", async () => {
		const new_soldier = {
			_id: "1234567",
			name: "Soldier A",
			rankName: "colonel",
			limitations: ["cannot run"],
		};

		const response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldier,
		});
		const body = response.json();
		expect(response.statusCode).toBe(201);
		expect(body.rank.value).toBe(6);
	});

	it("POST /soldiers to add soldier by rankValue with upper-case limitation should return status 201 and lower-case limitation", async () => {
		const new_soldier = {
			_id: "1234667",
			name: "Soldier A",
			rankValue: 6,
			limitations: ["CANNOT RUN", "LIFT LIMIT 20KG"],
		};

		const response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldier,
		});
		const body = response.json();
		expect(response.statusCode).toBe(201);
		expect(body.rank.name).toBe("colonel");
		expect(body.limitations[0]).toBe("cannot run");
		expect(body.limitations[1]).toBe("lift limit 20kg");
	});

	it("POST /soldiers to add soldier by both rankValue and rankName should return status 400", async () => {
		const new_soldier = {
			_id: "1234667",
			name: "Soldier A",
			rankValue: 6,
			rankName: "colonel",
			limitations: ["cannot run"],
		};

		const response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldier,
		});
		expect(response.statusCode).toBe(400);
	});

	it("POST /soldiers to add soldier without both rankValue or rankName should return status 400", async () => {
		const new_soldier = {
			_id: "1234667",
			name: "Soldier A",
			limitations: ["cannot run"],
		};

		const response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldier,
		});
		expect(response.statusCode).toBe(400);
	});

	it("POST /soldiers to add soldier with invalid rankName should return status 400", async () => {
		const new_soldier = {
			_id: "1234667",
			name: "Soldier A",
			limitations: ["cannot run"],
		};

		const response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldier,
		});
		expect(response.statusCode).toBe(400);
	});

	it("POST /soldiers to add soldier with id that is not 7 digits should return status 400", async () => {
		const new_soldierA = {
			_id: "12346678",
			name: "Soldier A",
			rankValue: 6,
			limitations: ["cannot run"],
		};

		const new_soldierB = {
			_id: "1234",
			name: "Soldier B",
			rankValue: 6,
			limitations: ["cannot run"],
		};

		const response1 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierA,
		});
		expect(response1.statusCode).toBe(400);

		const response2 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierB,
		});
		expect(response2.statusCode).toBe(400);
	});

	it("POST /soldiers to 2 soldiers with the same id should return status 200", async () => {
		const new_soldierA = {
			_id: "1234567",
			name: "Soldier A",
			rankValue: 6,
			limitations: ["cannot run"],
		};

		const new_soldierB = {
			_id: "1234567",
			name: "Soldier B",
			rankValue: 2,
			limitations: ["cannot run"],
		};

		const response1 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierA,
		});
		expect(response1.statusCode).toBe(201);

		const response2 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierB,
		});
		expect(response2.statusCode).toBe(200);
	});
});

describe("Getting a soldier by ID", () => {
	let fastify;
	beforeAll(async () => {
		fastify = createFastifyApp();
		await fastify.listen();
	});

	afterAll(async () => {
		await fastify.mongo.db.collection("soldiers").drop().catch();
	});

	beforeEach(async () => {
		await fastify.mongo.db.collection("soldiers").drop().catch();
	});

	it("GET /soldiers/:id should return the soldier by id and status 200", async () => {
		const new_soldierA = {
			_id: "1234567",
			name: "Soldier A",
			rankValue: 6,
			limitations: ["cannot run"],
		};
		const new_soldierB = {
			_id: "7654321",
			name: "Soldier B",
			rankValue: 4,
			limitations: ["cannot lift more than 20kg"],
		};

		const response1 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierA,
		});
		expect(response1.statusCode).toBe(201);
		const response2 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierB,
		});
		expect(response2.statusCode).toBe(201);

		const response3 = await fastify.inject({
			method: "GET",
			url: "/soldiers/1234567",
		});
		expect(response3.statusCode).toBe(200);
		const returned_soldierA = response3.json();
		expect(returned_soldierA._id).toBe(new_soldierA._id);
		expect(returned_soldierA.name).toBe(new_soldierA.name);
		const response4 = await fastify.inject({
			method: "GET",
			url: "/soldiers/7654321",
		});
		expect(response4.statusCode).toBe(200);
		const returned_soldierB = response4.json();
		expect(returned_soldierB._id).toBe(new_soldierB._id);
		expect(returned_soldierB.name).toBe(new_soldierB.name);
	});

	it("GET /soldiers/:id should return status 404 when soldier is not found", async () => {
		const new_soldierA = {
			_id: "1234567",
			name: "Soldier A",
			rankValue: 6,
			limitations: ["cannot run"],
		};
		const new_soldierB = {
			_id: "7654321",
			name: "Soldier B",
			rankValue: 4,
			limitations: ["cannot lift more than 20kg"],
		};

		const response1 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierA,
		});
		expect(response1.statusCode).toBe(201);
		const response2 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierB,
		});
		expect(response2.statusCode).toBe(201);

		const response3 = await fastify.inject({
			method: "GET",
			url: "/soldiers/1234567",
		});
		expect(response3.statusCode).toBe(200);
		const returned_soldierA = response3.json();
		expect(returned_soldierA._id).toBe(new_soldierA._id);
		expect(returned_soldierA.name).toBe(new_soldierA.name);

		const response4 = await fastify.inject({
			method: "GET",
			url: "/soldiers/4561239",
		});
		expect(response4.statusCode).toBe(404);
	});
});

describe("Deleting a soldier by ID", () => {
	let fastify;
	beforeAll(async () => {
		fastify = createFastifyApp();
		await fastify.listen();
	});

	afterAll(async () => {
		await fastify.mongo.db.collection("soldiers").drop().catch();
	});

	beforeEach(async () => {
		await fastify.mongo.db.collection("soldiers").drop().catch();
	});

	it("DELETE /soldier/:id should return status 204 if soldier is found", async () => {
		const new_soldierA = {
			_id: "1234567",
			name: "Soldier A",
			rankValue: 6,
			limitations: ["cannot run"],
		};
		const new_soldierB = {
			_id: "7654321",
			name: "Soldier B",
			rankValue: 4,
			limitations: ["cannot lift more than 20kg"],
		};

		const response1 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierA,
		});
		expect(response1.statusCode).toBe(201);
		const response2 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierB,
		});
		expect(response2.statusCode).toBe(201);

		const response_delA = await fastify.inject({
			method: "DELETE",
			url: "/soldiers/1234567",
		});
		expect(response_delA.statusCode).toBe(204);

		const response_delB = await fastify.inject({
			method: "DELETE",
			url: "/soldiers/7654321",
		});
		expect(response_delB.statusCode).toBe(204);
	});

	it("DELETE /soldier/:id should return status 404 if soldier is not found", async () => {
		const new_soldierA = {
			_id: "1234567",
			name: "Soldier A",
			rankValue: 6,
			limitations: ["cannot run"],
		};
		const new_soldierB = {
			_id: "7654321",
			name: "Soldier B",
			rankValue: 4,
			limitations: ["cannot lift more than 20kg"],
		};

		const response1 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierA,
		});
		expect(response1.statusCode).toBe(201);
		const response2 = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldierB,
		});
		expect(response2.statusCode).toBe(201);

		const response_del = await fastify.inject({
			method: "DELETE",
			url: "/soldiers/4562876",
		});
		expect(response_del.statusCode).toBe(404);
	});
});

describe("Update a soldier", () => {
	let fastify;
	beforeAll(async () => {
		fastify = createFastifyApp();
		await fastify.listen();
	});
	afterAll(async () => {
		await fastify.mongo.db.collection("soldiers").drop().catch();
	});
	beforeEach(async () => {
		await fastify.mongo.db.collection("soldiers").drop().catch();
	});

	it("PATCH /soldiers/:id should return updated soldier with status 200", async () => {
		const new_soldier = {
			_id: "1234567",
			name: "Bob Dylan",
			rankValue: 3,
			limitations: ["cannot RUN"],
		};

		const add_soldier_response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldier,
		});
		expect(add_soldier_response.statusCode).toBe(201);

		const update_to_soldier = {
			name: "Robert Zimmerman",
			rankName: "major",
			limitations: ['has to sleep atleast 7 hours per day']
		};

		const update_soldier_response = await fastify.inject({
			method: "PATCH",
			url: "/soldiers/1234567",
			payload: update_to_soldier
		});
		expect(update_soldier_response.statusCode).toBe(200);

		const updated_soldier = update_soldier_response.json();
		expect(updated_soldier.name).toBe('Robert Zimmerman');
		expect(updated_soldier.rank).toStrictEqual({ name: 'major', value: 5 });
		expect(updated_soldier.limitations[0]).toBe('has to sleep atleast 7 hours per day' );
		expect(updated_soldier.createdAt < updated_soldier.updatedAt).toBe(true);
	});

	it("PATCH /soldiers/:id with unwanted properties should be igored", async () => {
		const new_soldier = {
			_id: "1234567",
			name: "Bob Dylan",
			rankValue: 3,
			limitations: ["cannot RUN"],
		};

		const add_soldier_response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldier,
		});
		expect(add_soldier_response.statusCode).toBe(201);

		const update_to_soldier = {
			_id: "4567892",
			name: "Robert Zimmerman",
			rankName: "major",
			limitations: ['has to sleep atleast 7 hours per day'],
			fathers_name: "Abram Zimmerman"
		};

		const update_soldier_response = await fastify.inject({
			method: "PATCH",
			url: "/soldiers/1234567",
			payload: update_to_soldier
		});
		expect(update_soldier_response.statusCode).toBe(200);

		const updated_soldier = update_soldier_response.json();
		expect(updated_soldier.name).toBe('Robert Zimmerman');
		expect(updated_soldier.rank).toStrictEqual({ name: 'major', value: 5 });
		expect(updated_soldier.limitations[0]).toBe('has to sleep atleast 7 hours per day' );
		expect(updated_soldier._id).toBe("1234567");
		expect(updated_soldier.createdAt < updated_soldier.updatedAt).toBe(true);
		expect('fathers_name' in updated_soldier).toBe(false);
	});

	it("PATCH /soldiers/:id should return 404 if id is not found ", async () => {
		const new_soldier = {
			_id: "1234567",
			name: "Bob Dylan",
			rankValue: 3,
			limitations: ["cannot RUN"],
		};

		const add_soldier_response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: new_soldier,
		});
		expect(add_soldier_response.statusCode).toBe(201);

		const update_to_soldier = {
			name: "Robert Zimmerman",
			rankName: "major",
			limitations: ['has to sleep atleast 7 hours per day']
		};

		const update_soldier_response = await fastify.inject({
			method: "PATCH",
			url: "/soldiers/9874563",
			payload: update_to_soldier
		});
		expect(update_soldier_response.statusCode).toBe(404);
	});

});

describe("Getting soldiers by query", () => {
	let fastify;
	beforeAll(async () => {
		fastify = createFastifyApp();
		await fastify.listen();

		const soldier_bob = Bob
		const soldier_bob_response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: soldier_bob,
		});
		expect(soldier_bob_response.statusCode).toBe(201);

		const soldier_david1 = {
			_id: "2345678",
			name: "david",
			rankValue: 2,
			limitations: ["standing"],
		};
		const soldier_david1_response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: soldier_david1,
		});
		expect(soldier_david1_response.statusCode).toBe(201);

		const soldier_david2 = {
			_id: "3456789",
			name: "david 2",
			rankValue: 1,
			limitations: ["food", "standing"],
		};
		const soldier_david2_response = await fastify.inject({
			method: "POST",
			url: "/soldiers",
			payload: soldier_david2,
		});
		expect(soldier_david2_response.statusCode).toBe(201);
	});

	afterAll(async () => {
		await fastify.mongo.db.collection("soldiers").drop().catch();
	});

	it.only("GET /soldiers?name=david should return 2 soldiers named david", async () => {
		const david_soldiers_response = await fastify.inject({
			method: "GET",
			url: "/soldiers?name=david"
		});
		const david_soldiers = david_soldiers_response.json();
		const right_soldiers = david_soldiers.some((soldier) => soldier._id === "2345678" ) && david_soldiers.some((soldier) => soldier._id === "3456789" )
		expect(david_soldiers.length).toBe(2);
		expect(right_soldiers).toBe(true)
	});

	it("GET /soldiers?limitations=food,standing should return 1 soldier with the limitations 'food' and 'standing'", async () => {
		const food_standing_soldiers_response = await fastify.inject({
			method: "GET",
			url: "/soldiers?limitations=food,standing"
		});
		const food_standing_soldiers = food_standing_soldiers_response.json();
		expect(food_standing_soldiers.length).toBe(1);
		expect(food_standing_soldiers[0]._id).toBe("3456789");
	});

	it("GET /soldiers?limitations=food should return 2 soldiers with the limitations 'food'", async () => {
		const food_soldiers_response = await fastify.inject({
			method: "GET",
			url: "/soldiers?limitations=food"
		}); 
		const food_soldiers = food_soldiers_response.json();
		expect(food_soldiers.length).toBe(2);
		expect(food_soldiers[0]._id).toBe("1234567");
		expect(food_soldiers[1]._id).toBe("3456789");
	});

	it("GET /soldiers should return all 3 soldiers", async () => {
		const all_soldiers_response = await fastify.inject({
			method: "GET",
			url: "/soldiers?sort=_id"
		}); 
		const all_soldiers = all_soldiers_response.json();
		expect(all_soldiers.length).toBe(3);
		expect(all_soldiers[0]._id).toBe("1234567");
		expect(all_soldiers[1]._id).toBe("2345678");
		expect(all_soldiers[2]._id).toBe("3456789");
	});


});

