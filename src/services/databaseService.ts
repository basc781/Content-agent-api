import { AppDataSource } from "../data-source";
import { ContentCalendar } from "../entities/ContentCalendar";
import { Article } from "../entities/Article";
import { ArticleFormData } from "../types/article";

export const databaseService = {
    createContentCalendar: async (formData: ArticleFormData): Promise<ContentCalendar> => {
        const contentCalendarRepository = AppDataSource.getRepository(ContentCalendar);
        
        const contentCalendar = contentCalendarRepository.create({
            title: formData.titel,
            event: formData.event,
            description: formData.beschrijving,
            potential_keywords: formData.potentialKeywords,
            search_potential: "medium", // default value
            winkel_voorbeelden: formData.winkelvoorbeelden,
            date: formData.datum,
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
    getPublishedContentCalendarItems: async (): Promise<Article[]> => {
        const articleRepository = AppDataSource.getRepository(Article);
        const articles = await articleRepository.find({ 
            where: { status: "published" },
            relations: {
                contentCalendar: true
            },
            select: {
                id: true,
                text: true,
                status: true,
                createdAt: true,
                pagepath: true,
                contentCalendar: {
                    id: true,
                    title: true,
                    event: true,
                    date: true
                }
            }
        });
        return articles;
    }
}; 