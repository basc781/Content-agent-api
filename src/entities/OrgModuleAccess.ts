import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { OrgPreference } from "./OrgPreferences.js";
import { Module } from "./Module.js";

@Entity("org_module_access")
export class OrgModuleAccess {
  @PrimaryColumn("varchar")
  orgId!: string;

  @PrimaryColumn("int")
  moduleId!: number;

  @ManyToOne(() => OrgPreference, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orgId", referencedColumnName: "orgId" })
  org!: OrgPreference;

  @ManyToOne(() => Module, { onDelete: "CASCADE" })
  @JoinColumn({ name: "moduleId", referencedColumnName: "id" })
  module!: Module;
}
