export async function health_routes (fastify, options) {
    fastify.get('/', async (request, reply) => {
        return reply.code(200).send({status: "ok"});
    });

    fastify.get('/db', async (request, reply) => {
        await fastify.mongo.db.command({ping:1});
        return reply.code(200).send({status: "ok"});
    });
}