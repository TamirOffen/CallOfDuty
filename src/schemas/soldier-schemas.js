import { rankNames } from "../models/soldier.js";

const _idSchema = { type: "string", pattern: "^[0-9]{7}$" };
const nameSchema = { type: "string", minLength: 3, maxLength: 50 };
const limitationsSchema = { type: "array", items: { type: "string" } };
const dateSchema = { type: "string", format: "date-time" };
const rankValueSchema = { type: "integer", minimum: 0, maximum: 6 };
const rankNameSchema = {
	type: "string",
	enum: rankNames,
};

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
		createdAt: dateSchema,
		updatedAt: dateSchema,
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
			rankValue: rankValueSchema,
			rankName: rankNameSchema,
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

const patchSoldierSchema = {
	params: {
		type: "object",
		properties: {
			id: _idSchema,
		},
		required: ["id"],
	},
	body: {
		type: "object",
		properties: {
			name: nameSchema,
			rankValue: rankValueSchema,
			rankName: rankNameSchema,
			limitations: limitationsSchema,
		},
		anyOf: [
			{ required: ["rankValue"], not: { required: ["rankName"] } },
			{ required: ["rankName"], not: { required: ["rankValue"] } },
			{ required: ["name"] },
			{ required: ["limitations"] },
		],
		additionalProperties: false,
	},
	response: {
		200: soldierSchema,
		404: messageSchema,
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

const getSoldierByQuerySchema = {
	querystring: {
		type: "object",
		properties: {
			name: nameSchema,
			rankValue: rankValueSchema,
			rankName: rankNameSchema,
			limitations: { type: "string", minLength: 1 },
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: "array",
			items: soldierSchema,
		},
	},
};

const deleteSoldierSchema = {
	params: {
		type: "object",
		properties: {
			id: _idSchema,
		},
		required: ["id"],
	},
	response: {
		204: messageSchema,
		404: messageSchema,
	},
};

export {
	postSoldierSchema,
	getSoldierByIDSchema,
	getSoldierByQuerySchema,
	deleteSoldierSchema,
	patchSoldierSchema,
};
