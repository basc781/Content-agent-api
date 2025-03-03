import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("user_preference")
export class UserPreference {
    @PrimaryColumn("varchar")
    userId!: string;

    @Column("text", { nullable: true })
    checkFormDataPrompt!: string;

    @Column("text", { nullable: true })
    generateContentPrompt!: string;

    @Column("text", { nullable: true })
    tools!: string;

    @Column({ 
        type: 'datetime', 
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
    })
    updatedAt!: Date;

    @Column({ 
        type: 'datetime', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    createdAt!: Date;
} 