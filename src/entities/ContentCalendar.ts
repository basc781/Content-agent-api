import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Article } from "./Article.js"

@Entity()
export class ContentCalendar {
    @PrimaryGeneratedColumn()
    id!: number

    @Column("varchar", { nullable: false })
    userId!: string;

    @Column()
    title!: string

    @Column('json')
    formData!: JSON
    
    @Column()
    status!: string
    @Column({ 
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP'
    })
    dateCreated!: Date

    @Column({ 
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
    })
    dateLastUpdated!: Date

    @OneToMany(() => Article, article => article.contentCalendar)
    articles!: Article[]
}
