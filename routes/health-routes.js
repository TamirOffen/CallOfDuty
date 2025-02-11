export async function health_routes (fastify, options) {
    fastify.get('/', async (request, reply) => {
        reply.code(200);
        return {status: "ok"}
    });

    fastify.get('/db', async (request, reply) => {
        await fastify.mongo.db.admin().ping();
        reply.code(200);
        return {status: "ok"};
    });
}