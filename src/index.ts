import dotenv from "dotenv";
dotenv.config();
//new node version
import express, { Express } from "express";
import cors from "cors";
import { routes } from "./routes/index.js";
import { AppDataSource } from "./data-source.js";

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

app.use(express.json());
app.use(clerkMiddleware());
app.use(checkAuth);

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");

    app.use("/api", routes);

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((error) => console.log("Database connection error:", error));
