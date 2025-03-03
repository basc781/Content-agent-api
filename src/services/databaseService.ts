import { AppDataSource } from "../data-source";
import { ContentCalendar } from "../entities/ContentCalendar";
import { Article } from "../entities/Article";
import { UserPreference } from '../entities/UserPreference';
// import { ArticleFormData } from "../types/types";

export const databaseService = {
    createContentCalendar: async (formData: any, userId: string, titel: string): Promise<ContentCalendar> => {
        const contentCalendarRepository = AppDataSource.getRepository(ContentCalendar);
        
        const contentCalendar = contentCalendarRepository.create({
            title: titel,
            userId: userId,
            formData: formData,
            status: "Writing...."
        });

        await contentCalendarRepository.save(contentCalendar);
        return contentCalendar;
    },
    getPublishedArticles: async (): Promise<Article[]> => {
        const articleRepository = AppDataSource.getRepository(Article);
        
        // Find all articles that are linked to published content calendars
        const articles = await articleRepository
            .createQueryBuilder('article')
            .leftJoinAndSelect('article.contentCalendar', 'contentCalendar')
            .where('contentCalendar.status = :status', { status: 'published' })
            .getMany();

        return articles;
    },
    getPublishedContentCalendarItems: async (userId: string): Promise<ContentCalendar[]> => {
        const contentCalendarRepository = AppDataSource.getRepository(ContentCalendar);
        
        // Simple approach without complex selects
        const contentItems = await contentCalendarRepository.find({
            where: [
                { status: "Writing....", userId: userId },
                { status: "published", userId: userId }
            ],
            relations: {
                articles: true
            }
        });
        
        return contentItems;
    },
    getUserPreferences: async (userId: string): Promise<UserPreference | null> => {
        const userPreferenceRepository = AppDataSource.getRepository(UserPreference);
        
        const userPreference = await userPreferenceRepository.findOne({
            where: { userId }
        });
        
        return userPreference;
    }
}; 