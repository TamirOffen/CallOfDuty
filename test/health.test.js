import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createFastifyApp } from "../src/app.js";
import { closeDb, initDb } from "../src/db/client.js";

describe("Health check endpoints", () => {
	let fastify;
	let db;

	beforeAll(async () => {
		db = await initDb("HealthTestDB");
		fastify = await createFastifyApp();
	});

	afterAll(async () => {
		await closeDb();
	});

	it("GET /health should return status 200 with ok", async () => {
		const response = await fastify.inject({
			method: "GET",
			url: "/health",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ status: "ok" });
	});

	it("GET /health/db should return status 200 with ok", async () => {
		const response = await fastify.inject({
			method: "GET",
			url: "/health/db",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ status: "ok" });
	});

	it("GET /health/db should return status 500 when there is a database error", async () => {
		vi.spyOn(db, "command").mockRejectedValue(() => {
			throw new Error("MongoDB connection failed");
		});
		const response = await fastify.inject({
			method: "GET",
			url: "/health/db",
		});

		expect(response.statusCode).toBe(500);
	});
});
