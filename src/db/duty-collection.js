import { ObjectId } from "mongodb";
import { createDuty } from "../models/duty.js";
import { getCollection } from "./client.js";

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

export { insertDuty, getDuties, getDuty, deleteDuty, patchDuty, putConstraints };
