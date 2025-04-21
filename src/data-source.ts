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
  type: "postgres",
  username: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: true,
  logging: false,
  entities: [Article, ContentCalendar, OrgPreference, Module, OrgModuleAccess, FormSchema, Image],
  migrations: [],
  subscribers: [],
  extra: {
    options: `-c search_path=public,pgvector`
  }
});
