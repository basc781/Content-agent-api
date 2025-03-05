import dotenv from 'dotenv';
dotenv.config();
//new node version
import express, { Express } from 'express';
import cors from 'cors';
import { routes } from './routes/index.js';
import { AppDataSource } from "./data-source.js";

const app: Express = express();
const port = 3000;

// Add CORS middleware
app.use(cors());

// For more specific settings, you can use:
app.use(cors({
    origin: ['http://localhost:5173/', 'https://content-agent.nl/'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
