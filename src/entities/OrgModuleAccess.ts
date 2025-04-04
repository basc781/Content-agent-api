import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { OrgPreference } from "./OrgPreferences.js";
import { Module } from "./Module.js";
import { FormSchema } from "./FormSchema.js";

@Entity("org_module_access")
export class OrgModuleAccess {
  @PrimaryColumn("varchar")
  orgId!: string;

  @PrimaryColumn("int")
  moduleId!: number;

  @Column("text", { nullable: true })
  prompt!: string;

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
