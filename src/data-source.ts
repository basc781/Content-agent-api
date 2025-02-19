import "reflect-metadata"
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "mysql",
    username: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: parseInt(process.env.PORT || "3306"),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: true,
    entities: ["src/entities/**/*.ts"],
    migrations: [],
    subscribers: [],
}) 
