import { ObjectId } from "@fastify/mongodb";
import { initDb } from "../db.js";
import { createDuty } from "../models/duty.js";
import {
	deleteDutySchema,
	getDutyByIDSchema,
	getDutyByQuerySchema,
	patchDutySchema,
	postDutySchema,
	putConstraintsSchema,
	scheduleDutySchema,
} from "../schemas/duty-schemas.js";

export async function dutyRoutes(fastify) {
	fastify.post("/", { schema: postDutySchema }, async (request, reply) => {
		const db = await initDb();

		try {
			const newDuty = createDuty(request.body);
			await db.collection("duties").insertOne(newDuty);
			request.log.info({ duty: newDuty }, "Duty created successfully");

			return reply.code(201).send(newDuty);
		} catch (err) {
			return reply.status(400).send({ message: err.message });
		}
	});

	fastify.get("/", { schema: getDutyByQuerySchema }, async (request, reply) => {
		const db = await initDb();

		const { constraints, ...otherProps } = request.query;
		const filter = otherProps;
		if (constraints?.length) filter.constraints = { $all: constraints.split(",") };
		request.log.info({ filter }, "Searching for duties by query");

		const duties =
			Object.keys(filter).length > 0 ? await db.collection("duties").find(filter).toArray() : [];
		if (duties.length) request.log.info("No duties found");
		else request.log.info({ duties }, "Duties found");

		return reply.status(200).send(duties);
	});

	fastify.get("/:id", { schema: getDutyByIDSchema }, async (request, reply) => {
		const db = await initDb();

		const { id } = request.params;
		request.log.info({ id }, "Looking for duty by ID");

		const duty = await db.collection("duties").findOne({ _id: ObjectId.createFromHexString(id) });

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}

		request.log.info({ id }, "Duty found");

		return reply.status(200).send(duty);
	});

	fastify.delete("/:id", { schema: deleteDutySchema }, async (request, reply) => {
		const db = await initDb();

		const { id } = request.params;
		const objectID = ObjectId.createFromHexString(id);
		const duty = await db.collection("duties").findOne({ _id: objectID });

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}
		if (duty.status === "scheduled") {
			request.log.info({ id }, "Scheduled duties cannot be deleted!");
			return reply.status(400).send({ message: "Scheduled duties cannot be deleted!" });
		}

		await db.collection("duties").deleteOne({ _id: objectID });
		request.log.info({ id }, "Duty deleted");

		return reply.status(204).send({ message: `Duty with ID ${id} deleted succesfully` });
	});

	fastify.patch("/:id", { schema: patchDutySchema }, async (request, reply) => {
		const db = await initDb();

		const { id } = request.params;
		const objectID = ObjectId.createFromHexString(id);
		const duty = await db.collection("duties").findOne({ _id: objectID });

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}
		if (duty.minRank && request.body.maxRank && duty.minRank > request.body.maxRank) {
			request.log.info(
				{ id },
				`Cannot update duty to have minRank ${duty.minRank} > maxRank ${request.body.maxRank}`,
			);
			return reply.status(400).send({
				message: `Cannot update duty to have minRank ${duty.minRank} > maxRank ${request.body.maxRank}`,
			});
		}
		if (duty?.status === "scheduled") {
			request.log.info({ id }, "Cannot update scheduled duty");
			return reply.status(400).send({ message: "Cannot update scheduled duty" });
		}

		const updatedDuty = await db
			.collection("duties")
			.findOneAndUpdate(
				{ _id: objectID },
				{ $set: request.body, $currentDate: { updatedAt: true } },
				{ returnDocument: "after" },
			);
		request.log.info({ updatedDuty }, "Duty updated");

		return reply.status(200).send(updatedDuty);
	});

	fastify.put("/:id/constraints", { schema: putConstraintsSchema }, async (request, reply) => {
		const db = await initDb();

		const { id } = request.params;
		const newConstraints = request.body;
		request.log.info({ newConstraints }, "constraints to be added");

		const updatedDuty = await db.collection("duties").findOneAndUpdate(
			{ _id: ObjectId.createFromHexString(id) },
			{
				$addToSet: { constraints: { $each: newConstraints } },
				$currentDate: { updatedAt: true },
			},
			{ returnDocument: "after" },
		);

		if (!updatedDuty) {
			return reply.status(404).send({
				message: `Duty not found with id ${id}`,
			});
		}
		request.log.info({ updatedDuty }, "Updated duty");

		return reply.status(200).send(updatedDuty);
	});

	fastify.put("/:id/schedule", { schema: scheduleDutySchema }, async (request, reply) => {
		const db = await initDb();

		const { id } = request.params;
		const dutyID = ObjectId.createFromHexString(id);
		const duty = await db.collection("duties").findOne({ _id: dutyID });

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		} else if (
			duty.status === "scheduled" ||
			duty.status === "canceled" ||
			new Date(duty.startTime) < new Date()
		) {
			request.log.info({ id }, "Cannot schedule duty");
			return reply.status(400).send({ message: "Cannot schedule duty" });
		}

		// get potential soldiers: start
		const query = {};
		if (duty.minRank || duty.maxRank) {
			const rankQuery = {};
			if (duty.minRank) rankQuery.$gte = duty.minRank;
			if (duty.maxRank) rankQuery.$lte = duty.maxRank;
			query["rank.value"] = rankQuery;
		}

		query["limitations"] = {
			$not: {
				$elemMatch: {
					$in: duty.constraints,
				},
			},
		};

		const notPossibleSoldiersAgg = await db
			.collection("duties")
			.aggregate([
				{
					$match: {
						_id: { $ne: duty._id },
						$or: [{ startTime: { $lt: duty.endTime }, endTime: { $gt: duty.startTime } }],
					},
				},
				{ $unwind: "$soldiers" },
				{
					$group: {
						_id: null, //not needed?
						soldierIds: { $addToSet: "$soldiers" },
					},
				},
				{
					$project: {
						_id: 0,
						soldierIds: 1,
					},
				},
			])
			.toArray();

		const notPossibleSoldiers = notPossibleSoldiersAgg[0]?.soldierIds || [];
		query._id = { $nin: notPossibleSoldiers };

		const potentialSoldiers = (
			await db.collection("soldiers").find(query).project({ _id: 1 }).toArray()
		).map((doc) => doc._id);
		// get potential soldiers: end

		if (potentialSoldiers.length < duty.soldiersRequired) {
			request.log.info(
				{
					potentialCount: potentialSoldiers.length,
					requiredCount: duty.soldiersRequired,
				},
				"Not enough soldiers can be scheduled",
			);
			return reply.status(400).send({ message: "Not enough soldiers can be scheduled" });
		}

		// get scoreMap: start
		const justiceBoardResponse = await fastify.inject({
			method: "GET",
			url: `/justice-board`,
		});
		const justiceBoard = justiceBoardResponse.json();
		const scoreMap = Object.fromEntries(justiceBoard.map(({ _id, score }) => [_id, score]));
		// get scoreMap: end

		const sortedSoldiers = potentialSoldiers.sort((a, b) => {
			return scoreMap[a] - scoreMap[b];
		});
		const scheduledSoldiers = sortedSoldiers.slice(0, duty.soldiersRequired);

		const updatedDuty = await db.collection("duties").findOneAndUpdate(
			{ _id: dutyID },
			{
				$addToSet: { soldiers: { $each: scheduledSoldiers } },
				$set: { status: "scheduled" },
				$push: {
					statusHistory: {
						status: "scheduled",
						date: new Date(),
					},
				},
				$currentDate: { updatedAt: true },
			},
			{ returnDocument: "after" },
		);

		return reply.status(200).send(updatedDuty);
	});
}
