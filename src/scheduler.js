import fp from "fastify-plugin";
import { AsyncTask } from "toad-scheduler";
import { scheduleAllDuties } from "./services/schedule-services.js";

const scheduleDutyTaskId = "auto schedule duties";

const schedulerPlugin = fp(async function scheduler(fastify) {
	const scheduleDutiesTask = new AsyncTask(
		scheduleDutyTaskId,
		async () => {
			const schedulingResults = await scheduleAllDuties();
			fastify.log.info({ schedulingResults }, "Auto scheduling complete.");
		},
		(err) => {
			fastify.log.error({ err }, "Auto scheduling failed:");
		},
	);

	fastify.decorate("scheduleDutiesTask", scheduleDutiesTask);
});

export { schedulerPlugin, scheduleDutyTaskId };
