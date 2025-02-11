import { createFastifyApp } from './app.js';

const fastify = createFastifyApp();
const port = process.env.PORT ?? 3000;

// SIGINT is ctrl + c
process.on('SIGINT', async () => {
    console.log('\nStarting to shut down server...');
    await fastify.close();
    process.exit(0);
});

fastify.listen({ port }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server started at ${address}`);
});
