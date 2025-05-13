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
  console.log("Clerk middleware and checkAuth middleware applied");
}

const initializeDatabase = async () => {
  try {
    console.log("=== Starting Database Initialization ===");
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    console.log("Initializing vector extension...");
    await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log("Vector extension initialized");

    app.use("/api", routes);
    console.log("Routes setup complete");

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("=== Database Error ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    process.exit(1);
  }
};

initializeDatabase().catch(error => {
  console.error("Application startup failed:", error);
  process.exit(1);
});
