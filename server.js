import { createFastifyApp } from './app.js';

const app = createFastifyApp();
const port = Number(process.env.PORT ?? 3000);

process.on('SIGINT', async () => {
    app.log.info('\nStarting to shut down server...')
    await app.close();
    process.exit(0);
});

const startServer = async () => {
    try {
        await app.listen({ port });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

startServer();