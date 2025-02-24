import { AppDataSource } from "../data-source";
import { ContentCalendar } from "../entities/ContentCalendar";
import { ArticleFormData } from "../types/article";

export const uploadToDatabaseService = {
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
            status: "draft"
        });

        await contentCalendarRepository.save(contentCalendar);
        return contentCalendar;
    }
}; 