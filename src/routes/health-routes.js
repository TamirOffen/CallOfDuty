export async function healthRoutes(fastify) {
	fastify.get("/", async (_request, reply) => reply.send({ status: "ok" }));

	fastify.get("/db", async (_request, reply) => {
		await fastify.mongo.db.command({ ping: 1 });
		return reply.code(200).send({ status: "ok" });
	});
}
