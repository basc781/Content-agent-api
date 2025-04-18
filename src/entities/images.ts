import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { OrgModuleAccess } from "./OrgModuleAccess.js";

@Entity("images")
export class Image {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { nullable: false })
  filename!: string;

  @Column("text", { nullable: false })
  uniqueFilename!: string;

  @Column("text", { nullable: false })
  authenticatedUrl!: string;
  
  @Column("text", { nullable: false })
  description!: string;

  @Column("text", { nullable: false })
  contentType!: string;

  @Column("int", { nullable: false })
  orgModuleAccessId!: number;

  @ManyToOne(() => OrgModuleAccess, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orgModuleAccessId", referencedColumnName: "id" })
  orgModuleAccess!: OrgModuleAccess;

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