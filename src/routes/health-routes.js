import { getDB } from "../db/client.js";

export async function healthRoutes(fastify) {
	fastify.get("/", async (_request, reply) => reply.send({ status: "ok" }));

	fastify.get("/db", async (_request, reply) => {
		await getDB().command({ ping: 1 });
		return reply.code(200).send({ status: "ok" });
	});
}
