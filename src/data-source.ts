import "reflect-metadata"
import { DataSource } from "typeorm"
import { Article } from "./entities/Article.js"
import { ContentCalendar } from "./entities/ContentCalendar.js"
import { UserPreference } from "./entities/UserPreference.js"

export const AppDataSource = new DataSource({
    type: "mysql",
    username: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: parseInt(process.env.PORT || "3306"),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [Article, ContentCalendar, UserPreference],
    migrations: [],
    subscribers: [],
}) 
