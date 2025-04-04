import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import type { FormSchema as FormSchemaType } from "../types/types.js";

@Entity("form_schema")
export class FormSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { nullable: false })
  name!: string;

  @Column("json", { nullable: false })
  schema!: FormSchemaType;

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