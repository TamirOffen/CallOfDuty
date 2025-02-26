const _idSchema = { type: "string", pattern: "^[0-9]{7}$" };
const nameSchema = { type: "string", minLength: 3, maxLength: 50 };
const limitationsSchema = { type: "array", items: { type: "string" } };

const rankSchema = {
	type: "object",
	properties: {
		name: { type: "string" },
		value: { type: "integer", minimum: 0, maximum: 6 },
	},
	required: ["name", "value"],
};

const messageSchema = {
	type: "object",
	properties: {
		message: { type: "string" },
	},
};

const soldierSchema = {
	type: "object",
	properties: {
		_id: _idSchema,
		name: nameSchema,
		rank: rankSchema,
		limitations: limitationsSchema,
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
	required: ["_id", "name", "rank", "limitations"],
	additionalProperties: false,
};

const postSoldierSchema = {
	body: {
		type: "object",
		properties: {
			_id: _idSchema,
			name: nameSchema,
			rankValue: { type: "integer", minimum: 0, maximum: 6 },
			rankName: {
				type: "string",
				enum: ["private", "corporal", "sergeant", "lieutenant", "captain", "major", "colonel"],
			},
			limitations: limitationsSchema,
		},
		required: ["_id", "name", "limitations"],
		oneOf: [
			{ required: ["rankValue"], not: { required: ["rankName"] } },
			{ required: ["rankName"], not: { required: ["rankValue"] } },
		],
		additionalProperties: false,
	},
	response: {
		201: soldierSchema,
	},
};

const getSoldierByIDSchema = {
	params: {
		type: "object",
		properties: {
			id: _idSchema,
		},
		required: ["id"],
	},
	response: {
		200: soldierSchema,
		404: messageSchema,
	},
};

export { postSoldierSchema, getSoldierByIDSchema };
