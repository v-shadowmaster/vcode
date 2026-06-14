import "dotenv/config";
import app from "./app";
import { Server } from "http";
import Logger from "./utils/logger";


async function bootServer(port: number): Promise<Server> {
    try {
        Logger.info(`Starting server version ${process.env["VERSION"]}`);
        Logger.info(`Starting server in ${process.env["MODE"]} mode`);
    } catch (error) {
        Logger.error("Failed to boot server");
        console.error(error);
        return process.exit(1);
    }

    return app.listen(port, () => {
        Logger.success(`API server listening on port ${port}`);
    });
}

const PORT = parseInt(process.env["PORT"] ?? "5005", 10);

void bootServer(PORT);