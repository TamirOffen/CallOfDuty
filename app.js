import Fastify from 'fastify';
import routes from './routes.js';
export function createFastifyApp() {

    const fastify = Fastify( {logger: true} );
    fastify.register(routes);
    return fastify;
}
