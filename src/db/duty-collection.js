import { ObjectId } from "mongodb";
import { getCollection } from "./client.js";

async function insertDuty(newDuty) {
	await getCollection("duties").insertOne(newDuty);
}

async function getDuties(filter) {
	const duties =
		Object.keys(filter).length > 0 ? await getCollection("duties").find(filter).toArray() : [];

	return duties;
}

async function getDutyByID(dutyID) {
	const duty = await getCollection("duties").findOne({ _id: ObjectId.createFromHexString(dutyID) });

	return duty;
}

async function deleteDutyByID(dutyID) {
	await getCollection("duties").deleteOne({
		_id: ObjectId.createFromHexString(dutyID),
	});
}

async function updateDuty(dutyID, update) {
	const updatedDuty = await getCollection("duties").findOneAndUpdate(
		{ _id: ObjectId.createFromHexString(dutyID) },
		{ $set: update, $currentDate: { updatedAt: true } },
		{ returnDocument: "after" },
	);

	return updatedDuty;
}

async function addConstraints(dutyID, newConstraints) {
	const updatedDuty = await getCollection("duties").findOneAndUpdate(
		{ _id: ObjectId.createFromHexString(dutyID) },
		{
			$addToSet: { constraints: { $each: newConstraints } },
			$currentDate: { updatedAt: true },
		},
		{ returnDocument: "after" },
	);

	return updatedDuty;
}

async function getOverlappingDutySoldiers(duty) {
	const overlappingSoldiers = await getCollection("duties")
		.aggregate([
			{
				$match: {
					_id: { $ne: duty._id },
					startTime: { $lt: duty.endTime },
					endTime: { $gt: duty.startTime },
				},
			},
			{ $unwind: "$soldiers" },
			{ $project: { _id: 0, soldierId: "$soldiers" } },
		])
		.toArray();

	return overlappingSoldiers;
}

async function getAvailableSoldiersForDuty(duty, soldierFilter) {
	const availableSoldiers = await getCollection("soldiers")
		.aggregate([
			{ $match: soldierFilter },
			{
				$lookup: {
					from: "duties",
					let: { soldierId: "$_id" },
					pipeline: [
						{
							$match: {
								_id: { $ne: duty._id },
								startTime: { $lt: duty.endTime },
								endTime: { $gt: duty.startTime },
							},
						},
						{
							$match: {
								$expr: {
									$in: ["$$soldierId", "$soldiers"],
								},
							},
						},
					],
					as: "conflictingDuties",
				},
			},
			{
				$match: {
					conflictingDuties: { $size: 0 },
				},
			},
		])
		.toArray();

	return availableSoldiers;
}

async function addSoldiersToDuty(dutyID, scheduledSoldiers) {
	const updatedDuty = await getCollection("duties").findOneAndUpdate(
		{ _id: ObjectId.createFromHexString(dutyID) },
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

	return updatedDuty;
}

async function updateDutyToCanceled(dutyID) {
	const updatedDuty = await getCollection("duties").findOneAndUpdate(
		{ _id: ObjectId.createFromHexString(dutyID) },
		{
			$set: { status: "canceled", soldiers: [] },
			$push: {
				statusHistory: {
					status: "canceled",
					date: new Date(),
				},
			},
			$currentDate: { updatedAt: true },
		},
		{ returnDocument: "after" },
	);

	return updatedDuty;
}

export {
	insertDuty,
	getDuties,
	getDutyByID,
	deleteDutyByID,
	updateDuty,
	addConstraints,
	addSoldiersToDuty,
	updateDutyToCanceled,
	getOverlappingDutySoldiers,
	getAvailableSoldiersForDuty,
};
