import Fastify from 'fastify';
import routes from './routes.js';
import fastifyMongo from '@fastify/mongodb'

export function createFastifyApp() {

    const fastify = Fastify( 
    {
        logger: {
            level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
        }
    });

    const db_uri = process.env.DB_URI ?? 'mongodb://localhost:27017/Soldiers_DB';

    fastify.register(fastifyMongo, {
        forceClose: true,
        url: db_uri
    });

    fastify.register(routes);

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