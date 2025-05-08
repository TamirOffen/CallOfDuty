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

export { insertDuty, getDuties, getDutyByID, deleteDutyByID, updateDuty, addConstraints };
