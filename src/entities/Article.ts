import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
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

    @Column({ 
        type: 'datetime', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    createdAt!: Date
} 