import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Article } from "./Article.js";
import { Module } from "./Module.js";

@Entity()
export class ContentCalendar {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { nullable: false })
  orgId!: string;

  @Column()
  title!: string;

  @Column("json")
  formData!: JSON;

  @Column()
  status!: string;

  @ManyToOne(() => Module, { lazy: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "moduleId" })
  module!: Module;

  @Column({ nullable: true })
  moduleId!: number;

  @Column({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  dateCreated!: Date;

  @Column({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  dateLastUpdated!: Date;

  @OneToMany(() => Article, (article) => article.contentCalendar)
  articles!: Article[];
}
