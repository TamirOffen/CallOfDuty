import { initDb } from "../db.js";
import {
	getJusticeBoardByIDSchema,
	getJusticeBoardSchema,
} from "../schemas/justice-board-schemas.js";

export async function justiceBoardRoute(fastify) {
	fastify.get("/", { schema: getJusticeBoardSchema }, async (_, reply) => {
		const db = await initDb();

		const justiceBoard = await db
			.collection("soldiers")
			.aggregate([
				{
					$lookup: {
						from: "duties",
						localField: "_id",
						foreignField: "soldiers",
						as: "duty_details",
					},
				},
				{
					$unwind: {
						path: "$duty_details",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$group: {
						_id: "$_id",
						score: { $sum: "$duty_details.value" },
					},
				},
			])
			.toArray();

		return reply.status(200).send(justiceBoard);
	});

	fastify.get("/:id", { schema: getJusticeBoardByIDSchema }, async (request, reply) => {
		const db = await initDb();

		const { id } = request.params;
		const soldierExists = await db.collection("soldiers").findOne({ _id: id });

		if (!soldierExists) {
			return reply.status(404).send({ message: `Soldier not found with id ${id}` });
		}

		const justiceBoardScore = await db
			.collection("duties")
			.aggregate([
				{ $unwind: "$soldiers" },
				{ $match: { soldiers: id } },
				{
					$group: {
						_id: "$soldiers",
						score: { $sum: "$value" },
					},
				},
				{
					$project: { _id: 0, score: 1 },
				},
			])
			.toArray();
		const score = justiceBoardScore[0]?.score ?? 0;

		return reply.status(200).send(score);
	});
}
