import Fastify from 'fastify';
export function createFastifyApp() {

    const fastify = Fastify( {logger: true} );
    return fastify;
}
