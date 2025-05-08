import { createSoldier, getSoldierRank } from "../models/soldier.js";
import { getCollection } from "./client.js";

async function insertSoldier(soldierData) {
	const newSoldier = createSoldier(soldierData);
	await getCollection("soldiers").insertOne(newSoldier);

	return newSoldier;
}

async function getSoldier(soldierID) {
	const soldier = await getCollection("soldiers").findOne({ _id: soldierID });

	return soldier;
}

async function getSoldiers(query) {
	const { name, limitations, rankValue, rankName } = query;
	const filter = {
		...(name && { name }),
		...(limitations?.length > 0 && { limitations: { $all: limitations.split(",") } }),
		...((rankValue ?? rankName) && { rank: getSoldierRank(rankName, rankValue) }),
	};
	const soldiers =
		Object.keys(filter).length > 0 ? await getCollection("soldiers").find(filter).toArray() : [];

	return soldiers;
}

async function deleteSoldier(soldierID) {
	const deleteSoldierResult = await getCollection("soldiers").deleteOne({ _id: soldierID });

	return deleteSoldierResult;
}

async function patchSoldier(soldierID, update) {
	const { name, limitations, rankValue, rankName } = update;
	const updateToSoldier = {
		...(name && { name }),
		...(limitations?.length > 0 && {
			limitations: limitations.map((limit) => limit.toLowerCase()),
		}),
		...((rankValue ?? rankName) && { rank: getSoldierRank(rankName, rankValue) }),
	};
	const updatedSoldier = await getCollection("soldiers").findOneAndUpdate(
		{ _id: soldierID },
		{ $set: updateToSoldier, $currentDate: { updatedAt: true } },
		{ returnDocument: "after" },
	);

	return updatedSoldier;
}

async function putSoldierLimitations(soldierID, newLimitations) {
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
	getSoldier,
	getSoldiers,
	deleteSoldier,
	patchSoldier,
	putSoldierLimitations,
};
