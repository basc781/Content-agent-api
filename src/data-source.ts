import "reflect-metadata";
import { DataSource } from "typeorm";
import { Article } from "./entities/Article.js";
import { ContentCalendar } from "./entities/ContentCalendar.js";
import { OrgPreference } from "./entities/OrgPreferences.js";
import { Module } from "./entities/Module.js";
import { OrgModuleAccess } from "./entities/OrgModuleAccess.js";
import { FormSchema } from "./entities/FormSchema.js";
import { Image } from "./entities/images.js";
export const AppDataSource = new DataSource({
  type: "mysql",
  username: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [Article, ContentCalendar, OrgPreference, Module, OrgModuleAccess, FormSchema, Image],
  migrations: [],
  subscribers: [],
});
