async function routes (fastify, options) {

    // health checkpoint
    fastify.get('/health', async (request, reply) => {
        reply.code(200);
        return {status: "ok"}
    });

    // health db checkpoint
    fastify.get('/health/db', async (request, reply) => {
        // check if connected to db
        await fastify.mongo.db.admin().ping();
        // connection to db is succesful
        reply.code(200);
        return {status: "ok"};

    });
};

export default routes;
