import { ObjectId } from "@fastify/mongodb";
import { z } from "zod";

const ObjectIdSchema = z.instanceof(ObjectId);
const ObjectIDStringSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Object ID format");
const soldierIDSchema = z.string().regex(/^[0-9]{7}$/, "Invalid Soldier ID format");
const nameSchema = z.string().min(3).max(50);
const locationSchema = z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]);
const rankSchema = z.number().min(0).max(6);
const datetimeSchema = z.coerce.date();

const statusSchema = z.object({
	status: z.string(),
	date: datetimeSchema,
});

const dutySchema = z
	.object({
		_id: ObjectIdSchema,
		name: nameSchema,
		description: z.string(),
		location: locationSchema,
		startTime: datetimeSchema,
		endTime: datetimeSchema,
		minRank: rankSchema.optional(),
		maxRank: rankSchema.optional(),
		constraints: z.array(z.string()),
		soldiersRequired: z.number().int().min(1),
		value: z.number().positive(),
		soldiers: z.array(soldierIDSchema),
		status: z.string(),
		statusHistory: z.array(statusSchema),
		createdAt: datetimeSchema,
		updatedAt: datetimeSchema,
	})
	.strict();

const messageSchema = z.object({
	message: z.string(),
});

const postDutySchema = {
	body: dutySchema.omit({
		_id: true,
		soldiers: true,
		status: true,
		statusHistory: true,
		createdAt: true,
		updatedAt: true,
	}),
	response: {
		201: dutySchema,
		404: messageSchema,
	},
};

const getDutyByQuerySchema = {
	querystring: dutySchema
		.omit({
			_id: true,
			constraints: true,
			soldiers: true,
			statusHistory: true,
			createdAt: true,
			updatedAt: true,
		})
		.extend({
			constraints: z.string(),
		})
		.partial(),
	response: {
		200: z.array(dutySchema),
	},
};

const getDutyByIDSchema = {
	params: z
		.object({
			id: ObjectIDStringSchema,
		})
		.strict(),
	response: {
		200: dutySchema,
		404: messageSchema,
	},
};

export { postDutySchema, getDutyByQuerySchema, getDutyByIDSchema };
