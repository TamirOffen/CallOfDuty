import { createSoldierSchema, soldierSearchSchema } from '../schemas/soldier-schemas.js';
import { createSoldier } from '../models/soldier.js';

export async function soldier_routes (fastify, options) {
    fastify.post('/', {schema: {body: createSoldierSchema}}, async (request, reply) => {

        let {_id, name, rankValue, rankName, limitations} = request.body;
        const newSoldier = createSoldier(_id, name, rankValue, rankName, limitations);

        try {
            await fastify.mongo.db.collection('soldiers').insertOne(newSoldier);
            return reply.code(201).send(newSoldier);
        } catch(err) {
            console.error(`Error occured when trying to add soldier to db: ${err}`);
        }

    });

    fastify.get('/:id', {schema: { params: soldierSearchSchema }}, async (request, reply) => {
        const {id} = request.params;
        const soldier = await fastify.mongo.db.collection('soldiers').findOne({_id: id});
        if(!soldier) {
            reply.status(404).send({ message: `Soldier not found with id=${id}` });
        } else {
            reply.status(200).send(soldier);
        }
    })
}