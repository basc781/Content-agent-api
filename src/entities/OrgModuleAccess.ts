import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { OrgPreference } from "./OrgPreferences.js";
import { Module } from "./Module.js";

@Entity("org_module_access")
export class OrgModuleAccess {
  @PrimaryColumn("varchar")
  orgId!: string;

  @PrimaryColumn("int")
  moduleId!: number;

  @Column("text", { nullable: true })
  prompt!: string;

  @ManyToOne(() => OrgPreference, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orgId", referencedColumnName: "orgId" })
  org!: OrgPreference;

  @ManyToOne(() => Module, { onDelete: "CASCADE" })
  @JoinColumn({ name: "moduleId", referencedColumnName: "id" })
  module!: Module;
}
