import cors from "cors";
import helmet from "helmet";
import express, { urlencoded, json } from "express";

function buildApp(): express.Application {
    const app = express();
    app.use(urlencoded({ extended: true }));
    app.use(json());
    app.use(cors({ origin: "*" }));
    app.use(helmet());

    app.set("trust proxy", 1);

    return app;
}

export default buildApp();