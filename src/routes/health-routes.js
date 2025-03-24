import { initDb } from "../db.js";

export async function healthRoutes(fastify) {
	fastify.get("/", async (_request, reply) => reply.send({ status: "ok" }));

	fastify.get("/db", async (_request, reply) => {
		const db = await initDb();

		await db.command({ ping: 1 });
		return reply.code(200).send({ status: "ok" });
	});
}
