import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import { routes } from './routes';
import { AppDataSource } from "./data-source"

const app: Express = express();
const port = 3000;

console.log(process.env.DB_HOST)
console.log(process.env.DB_PORT)
console.log(process.env.DB_USERNAME)
console.log(process.env.DB_PASSWORD)
console.log(process.env.DB_NAME)

app.use(express.json());

AppDataSource.initialize()
    .then(() => {
        console.log("Database connected")
        
        app.use('/api', routes);

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch((error) => console.log("Database connection error:", error))
