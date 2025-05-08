import { ObjectId } from "mongodb";
import { createDuty } from "../models/duty.js";
import { getCollection } from "./client.js";
import { sortSoliersAccordingToScore } from "./justice-board-collection.js";

async function insertDuty(dutyData) {
	const newDuty = createDuty(dutyData);
	await getCollection("duties").insertOne(newDuty);
	return newDuty;
}

async function getDuties(query) {
	const { constraints, ...otherProps } = query;
	const filter = otherProps;
	if (constraints?.length) filter.constraints = { $all: constraints.split(",") };

	const duties =
		Object.keys(filter).length > 0 ? await getCollection("duties").find(filter).toArray() : [];

	return duties;
}

async function getDuty(dutyID) {
	const duty = await getCollection("duties").findOne({ _id: ObjectId.createFromHexString(dutyID) });

	return duty;
}

async function deleteDuty(dutyID) {
	const duty = await getDuty(dutyID);
	if (!duty || duty.status === "scheduled") return duty;

	const deleteDutyResult = await getCollection("duties").deleteOne({
		_id: ObjectId.createFromHexString(dutyID),
	});

	return deleteDutyResult;
}

async function patchDuty(dutyID, update) {
	const duty = await getDuty(dutyID);

	if (
		!duty ||
		(duty.minRank && update.maxRank && duty.minRank > update.maxRank) ||
		duty.status === "scheduled"
	)
		return duty;

	const updatedDuty = await getCollection("duties").findOneAndUpdate(
		{ _id: ObjectId.createFromHexString(dutyID) },
		{ $set: update, $currentDate: { updatedAt: true } },
		{ returnDocument: "after" },
	);

	return updatedDuty;
}

async function putConstraints(dutyID, newConstraints) {
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

async function canScheduleDuty(dutyID) {
	const duty = await getDuty(dutyID);

	const isUnscheduable =
		duty.status === "scheduled" ||
		duty.status === "canceled" ||
		new Date(duty.startTime) < new Date();

	return isUnscheduable ? false : duty;
}

async function canCancelDuty(dutyID) {
	const duty = await getDuty(dutyID);
	const cantCancel = duty?.status === "canceled" || new Date(duty?.startTime) < new Date();

	return cantCancel ? false : duty;
}

async function getScheduableSoldiersToDuty(dutyID) {
	const duty = await getDuty(dutyID);
	if (!duty) return null;

	const query = {};
	if (duty.minRank || duty.maxRank) {
		const rankQuery = {};
		if (duty.minRank) rankQuery.$gte = duty.minRank;
		if (duty.maxRank) rankQuery.$lte = duty.maxRank;
		query["rank.value"] = rankQuery;
	}

	query.limitations = {
		$not: {
			$elemMatch: {
				$in: duty.constraints,
			},
		},
	};

	const notPossibleSoldiersAgg = await getCollection("duties")
		.aggregate([
			{
				$match: {
					_id: { $ne: duty._id },
					$or: [{ startTime: { $lt: duty.endTime }, endTime: { $gt: duty.startTime } }],
				},
			},
			{ $unwind: "$soldiers" },
			{ $project: { _id: 0, soldierId: "$soldiers" } },
		])
		.toArray();

	const notPossibleSoldiers = [
		...new Set(notPossibleSoldiersAgg.map((soldier) => soldier.soldierId)),
	];

	query._id = { $nin: notPossibleSoldiers };

	let potentialSoldiers = (
		await getCollection("soldiers").find(query).project({ _id: 1 }).toArray()
	).map((soldier) => soldier._id);

	if (potentialSoldiers.length < duty.soldiersRequired) return [];

	potentialSoldiers = await sortSoliersAccordingToScore(potentialSoldiers);

	return potentialSoldiers.slice(0, duty.soldiersRequired);
}

async function addSoldiersToDuty(dutyID, scheduledSoldiers) {
	const duty = await getDuty(dutyID);
	if (!duty) return null;

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

async function cancelDuty(dutyID) {
	const duty = await getDuty(dutyID);
	if (!duty) return null;

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
	getDuty,
	deleteDuty,
	patchDuty,
	putConstraints,
	canScheduleDuty,
	getScheduableSoldiersToDuty,
	addSoldiersToDuty,
	canCancelDuty,
	cancelDuty,
};
