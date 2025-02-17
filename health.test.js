import { beforeAll, describe, expect, it, vi } from "vitest";
import { createFastifyApp } from "./app.js";

describe("Health check endpoints", () => {
	let fastify;
	
	beforeAll(() => {
		fastify = createFastifyApp();
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
		vi.spyOn(fastify.mongo.db, "command").mockRejectedValue(() => {
			throw new Error("MongoDB connection failed");
		});
		const response = await fastify.inject({
			method: "GET",
			url: "/health/db",
		});

		expect(response.statusCode).toBe(500);
	});
});
