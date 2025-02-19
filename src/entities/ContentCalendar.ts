import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class ContentCalendar {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    title!: string

    @Column()
    event!: string  // e.g., "Valentine's Day", "Black Friday"

    @Column('text')
    description!: string

    @Column({ default: 'draft' })
    status!: string  // draft, published, etc.

    @Column()
    potential_keywords!: string

    @Column()
    search_potential!: string

    @Column()
    winkel_voorbeelden!: string

    @Column()
    date!: string

}
