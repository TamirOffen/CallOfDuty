async function routes (fastify, options) {

    // health checkpoint
    fastify.get('/health', async (request, reply) => {
        reply.code(200);
        return {status: "ok"}
    });
};

export default routes;
