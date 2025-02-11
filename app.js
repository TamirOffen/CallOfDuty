import Fastify from 'fastify';
import routes from './routes.js';
import fastifyMongo from '@fastify/mongodb'

export function createFastifyApp() {

    const fastify = Fastify( {logger: true} );
    // name of db is Soldiers_DB
    const db_uri = process.env.DB_URI ?? 'mongodb://localhost:27017/Soldiers_DB';

    // connect to mongo db 
    fastify.register(fastifyMongo, {
        forceClose: true, // closes MongoDB on server closing
        url: db_uri
    });

    fastify.register(routes);

    // add logs when the server stops listening/closed
    fastify.addHook('onClose', async (instance, done) => {
        try {
            await instance.mongo.client.close(); 
            console.log('MongoDB connection closed.');
        } catch(err) {
            console.error(`Error trying to close MongoDB connection: ${err}`);
        }
        done();
    });

    return fastify;
}
