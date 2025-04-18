import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { OrgPreference } from "./OrgPreferences.js";
import { Module } from "./Module.js";
import { FormSchema } from "./FormSchema.js";

@Entity("org_module_access")
export class OrgModuleAccess {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index()
  @Column("varchar")
  orgId!: string;

  @Index()
  @Column("int")
  moduleId!: number;

  @Column("text", { nullable: true })
  prompt!: string;

  @Column("text", { nullable: true })
  summaryPrompt!: string;

  @Column("int", { nullable: true })
  formSchemaId!: number;

  @ManyToOne(() => OrgPreference, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orgId", referencedColumnName: "orgId" })
  org!: OrgPreference;

  @ManyToOne(() => Module, { onDelete: "CASCADE" })
  @JoinColumn({ name: "moduleId", referencedColumnName: "id" })
  module!: Module;

  @ManyToOne(() => FormSchema, { onDelete: "SET NULL" })
  @JoinColumn({ name: "formSchemaId" })
  formSchema!: FormSchema;
}
