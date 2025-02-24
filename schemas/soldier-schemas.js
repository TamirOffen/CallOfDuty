const createSoldierSchema = {
	type: "object",
	properties: {
		_id: { type: "string", pattern: "^[0-9]{7}$" },
		name: { type: "string", minLength: 3, maxLength: 50 },
		rankValue: { type: "integer", minimum: 0, maximum: 6 },
		rankName: {
			type: "string",
			enum: [
				"private",
				"corporal",
				"sergeant",
				"lieutenant",
				"captain",
				"major",
				"colonel",
			],
		},
		limitations: { type: "array", items: { type: "string" } },
	},
	required: ["_id", "name", "limitations"],
	oneOf: [
		{ required: ["rankValue"], not: { required: ["rankName"] } },
		{ required: ["rankName"], not: { required: ["rankValue"] } },
	],
	additionalProperties: false,
};

const soldierSearchSchema = {
	type: "object",
	properties: {
		id: { type: "string" },
	},
	required: ["id"],
};

const patchSoldierSchema = {
	params: soldierSearchSchema,
	body: {
		type: "object",
		properties: {
			name: { type: "string", minLength: 3, maxLength: 50 },
			rankValue: { type: "integer", minimum: 0, maximum: 6 },
			rankName: {
				type: "string",
				enum: [
					"private",
					"corporal",
					"sergeant",
					"lieutenant",
					"captain",
					"major",
					"colonel",
				],
			},
			limitations: { type: "array", items: { type: "string" } },
		},
		// TODO: fix
		// oneOf: [
		//     {
		//         required: ['rankValue'],
		//         not: { required: ['rankName'] }
		//     },
		//     {
		//         required: ['rankName'],
		//         not: { required: ['rankValue'] }
		//     },
		//     {
		//         not: { required: ['rankValue'] },
		//         not: { required: ['rankName'] }
		//     }
		// ],
		additionalProperties: false,
	},
};

const soldiersQuerySchema = {
	type: "object",
	properties: {
		name: { type: "string", minLength: 3, maxLength: 50 },
		rankValue: { type: "integer", minimum: 0, maximum: 6 },
		rankName: {
			type: "string",
			enum: [
				"private",
				"corporal",
				"sergeant",
				"lieutenant",
				"captain",
				"major",
				"colonel",
			],
		},
		limitations: { type: "array", items: { type: "string" } },
	},
	additionalProperties: false,
};

const soldierLimitationsSchema = {
	params: soldierSearchSchema,
	body: {
		type: "array",
		items: {
			type: "string"
		},
	}
};

export { createSoldierSchema, soldierSearchSchema, patchSoldierSchema, soldiersQuerySchema, soldierLimitationsSchema };
