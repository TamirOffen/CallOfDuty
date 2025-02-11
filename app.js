import fastifyMongo from "@fastify/mongodb";
import Fastify from "fastify";
import { health_routes } from './routes/health-routes.js';
import { soldier_routes } from './routes/soldier-routes.js';

export function createFastifyApp() {
	const fastify = Fastify({
		logger: {
			level: process.env.NODE_ENV === "test" ? "silent" : "info",
		},
	});

	const db_uri = process.env.DB_URI ?? 'mongodb://localhost:27017/CallOfDuty_DB';

	fastify.register(fastifyMongo, {
		forceClose: true,
		url: db_uri,
	});

    fastify.register(health_routes, {prefix: '/health'});
    fastify.register(soldier_routes, {prefix: '/soldiers'});

    fastify.addHook('onClose', async (instance, done) => {
        try {
            await instance.mongo.client.close(); 
            fastify.log.info('MongoDB connection closed.');
        } catch(err) {
            fastify.log.error(`Error trying to close MongoDB connection: ${err}`);
        }
    });

    return fastify;
}
