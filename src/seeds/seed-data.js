import { generatePostDuty, generatePostSoldier, getFutureDate } from "../../test/data-factory.js";

export const soldiers = [
	generatePostSoldier({ _id: "1234567", name: "joey", rankValue: 4 }),
	generatePostSoldier({ _id: "9876543", limitations: ["little sun exposure"] }),
];

export const duties = [
	generatePostDuty({
		name: "Perimeter Patrol",
		description: "Routine perimeter security check",
		location: [34.05, -118.25],
		constraints: ["No radio silence", "Stay in pairs"],
		soldiersRequired: 4,
		value: 80,
		minRank: 2,
		maxRank: 6,
		status: "pending",
	}),
	generatePostDuty({
		name: "Night Watch",
		description: "Guard the main gate during night hours",
		location: [40.7128, -74.006],
		startTime: getFutureDate(1),
		endTime: getFutureDate(2),
		constraints: ["Night duty", "Cold weather gear"],
		soldiersRequired: 3,
		value: 120,
		minRank: 1,
		maxRank: 5,
		status: "scheduled",
	}),
	generatePostDuty({
		name: "Recon Mission",
		description: "Reconnaissance in Zone 7",
		location: [51.5074, -0.1278],
		constraints: ["Silence protocol", "Camouflage required"],
		soldiersRequired: 5,
		value: 200,
		minRank: 3,
		maxRank: 7,
		status: "active",
	}),
];
