import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { ContentCalendar } from "./ContentCalendar.js" 

@Entity()
export class Article {
    @PrimaryGeneratedColumn()
    id!: number

    @Column("varchar", { nullable: false })
    userId!: string;

    @Column('text')
    text!: string

    @ManyToOne(() => ContentCalendar, contentCalendar => contentCalendar.articles)
    @JoinColumn({ name: "contentCalendarId" })
    contentCalendar!: ContentCalendar

    @Column()
    contentCalendarId!: number
    
    @Column({ default: 'draft' })
    status!: string

    //column with the type of formatting of the article, this can be json or markdown for now
    @Column({ type: "enum", enum: ['markdown', 'json'], nullable: false })
    outputFormat!: string;
    
    @Column()
    pagepath!: string

    @Column({ 
        type: 'datetime', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    createdAt!: Date
} 