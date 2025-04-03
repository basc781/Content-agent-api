import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("org_preference")
export class OrgPreference {
  @PrimaryColumn("varchar")
  orgId!: string;

  @Column("text", { nullable: true })
  checkFormDataPrompt!: string;

  @Column("text", { nullable: true })
  organizationPrompt!: string;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}
