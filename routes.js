async function routes(fastify) {
	fastify.get("/health", async (_request, reply) =>
		reply.send({ status: "ok" }),
	);

	fastify.get("/health/db", async (_request, reply) => {
		await fastify.mongo.db.command({ ping: 1 });
		return reply.code(200).send({ status: "ok" });
	});
}

export default routes;
