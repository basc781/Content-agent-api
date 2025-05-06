import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import type { OrgModuleAccess } from "./OrgModuleAccess.js";

@Entity("module")
export class Module {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("text", { nullable: true })
  name!: string;

  @Column("text", { nullable: true })
  slug!: string;

  @Column("text", { nullable: true })
  title!: string;

  @Column("text", { nullable: true })
  description!: string;

  @Column("text", { nullable: true })
  purpose!: string;

  @Column("boolean", { nullable: true })
  webScraper!: boolean;

  @Column("boolean", { nullable: true })
  images!: boolean;

  @Column("boolean", { nullable: true })
  assetLibrary!: boolean;

  @Column("boolean", { nullable: true })
  productAPI!: boolean;

  @Column("boolean", { nullable: true })
  internetSearch!: boolean;

  @Column({ type: "enum", enum: ["markdown", "json","emailHTML"], nullable: false })
  outputFormat!: string;
  
  @Column("text", { nullable: true })
  promptTemplate!: string;

  @OneToMany("OrgModuleAccess", (access: OrgModuleAccess) => access.module)
  orgModuleAccess!: OrgModuleAccess[];

  @Column({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  @Column({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}
