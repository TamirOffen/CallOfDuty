async function routes (fastify, options) {
    fastify.get('/health', async (request, reply) => {
        return reply.code(200).send({status: "ok"});
    });

    fastify.get('/health/db', async (request, reply) => {
        await fastify.mongo.db.command({ping:1});
        return reply.code(200).send({status: "ok"});
    });
};

export default routes;