import { getCollection } from "./client.js";

async function insertSoldier(newSoldier) {
	await getCollection("soldiers").insertOne(newSoldier);
}

async function getSoldierByID(soldierID) {
	const soldier = await getCollection("soldiers").findOne({ _id: soldierID });

	return soldier;
}

async function getSoldiers(filter) {
	const soldiers =
		Object.keys(filter).length > 0 ? await getCollection("soldiers").find(filter).toArray() : [];

	return soldiers;
}

async function deleteSoldierByID(soldierID) {
	const deleteSoldierResult = await getCollection("soldiers").deleteOne({ _id: soldierID });

	return deleteSoldierResult;
}

async function updateSoldier(soldierID, updateToSoldier) {
	const updatedSoldier = await getCollection("soldiers").findOneAndUpdate(
		{ _id: soldierID },
		{ $set: updateToSoldier, $currentDate: { updatedAt: true } },
		{ returnDocument: "after" },
	);

	return updatedSoldier;
}

async function addLimitations(soldierID, newLimitations) {
	const updatedSoldier = await getCollection("soldiers").findOneAndUpdate(
		{ _id: soldierID },
		{
			$addToSet: { limitations: { $each: newLimitations.map((limit) => limit.toLowerCase()) } },
			$currentDate: { updatedAt: true },
		},
		{ returnDocument: "after" },
	);
	return updatedSoldier;
}

export {
	insertSoldier,
	getSoldierByID,
	getSoldiers,
	deleteSoldierByID,
	updateSoldier,
	addLimitations,
};
