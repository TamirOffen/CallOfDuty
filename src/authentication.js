export const basicAuthenticator = async (request, reply) => {
	const authHeader = request.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Basic ")) {
		reply.status(401).send({
			error: "Unauthorized",
			message: "Missing or invalid authorization header",
		});
		return;
	}

	const base64Credentials = authHeader.split(" ")[1];
	const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
	const [username, password] = credentials.split(":");

	if (username !== "admin" || password !== "123") {
		reply.status(401).send({ error: "Unauthorized", message: "Invalid username or password" });
		return;
	}
};
