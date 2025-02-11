import { createFastifyApp } from './app.js';

const fastify = createFastifyApp();
const port = process.env.PORT ?? 3000;
fastify.listen({ port }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server started at ${address}`);
});
