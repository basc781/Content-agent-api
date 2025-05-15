import dotenv from "dotenv";
dotenv.config();
//new node version
import express, { Express } from "express";
import cors from "cors";
import { routes } from "./routes/index.js";
import { AppDataSource } from "./data-source.js";
import bodyParser from 'body-parser';

import { clerkMiddleware } from "@clerk/express";
import checkAuth from "./middleware/check-auth.js";

const app: Express = express();
const port = 3000;

// Update the specific CORS settings
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://content-agent.nl",
      "https://content-agent-beta.trezma.com",
    ], // Remove trailing slashes
    methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

if (process.env.ENVIRONMENT !== "localhost") {
  app.use(clerkMiddleware());
  app.use(checkAuth);
}

const initializeDatabase = async () => {
  try {
    
    await AppDataSource.initialize();
    await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS vector');

    app.use("/api", routes)
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

initializeDatabase().catch(error => {
  console.error("Application startup failed:", error);
  process.exit(1);
});
