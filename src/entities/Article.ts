import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ColumnTypeUndefinedError } from "typeorm"
import { ContentCalendar } from "./ContentCalendar"

@Entity()
export class Article {
    @PrimaryGeneratedColumn()
    id!: number

    @Column('text')
    text!: string

    @ManyToOne(() => ContentCalendar)
    @JoinColumn({ name: "contentCalendarId" })
    contentCalendar!: ContentCalendar

    @Column()
    contentCalendarId!: number
    
    @Column({ default: 'draft' })
    status!: string
    
    @Column()
    pagepath!: string

    @Column({ 
        type: 'datetime', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    createdAt!: Date
} 