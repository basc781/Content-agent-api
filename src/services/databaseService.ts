import { AppDataSource } from "../data-source.js";
import { ContentCalendar } from "../entities/ContentCalendar.js";
import { Article } from "../entities/Article.js";
import { OrgPreference } from "../entities/OrgPreferences.js";
import { Module } from "../entities/Module.js";
import { OrgModuleAccess } from "../entities/OrgModuleAccess.js";

export const databaseService = {

  deleteContentCalendar: async (id: number) => {
    const contentCalendarRepository = AppDataSource.getRepository(ContentCalendar);
    await contentCalendarRepository.delete(id);
    const articleRepository = AppDataSource.getRepository(Article);
    await articleRepository.delete({ contentCalendarId: id });
  },

  updateContentCalendarStatus: async () => {
    const contentCalendarRepository = AppDataSource.getRepository(ContentCalendar);
    const articleRepository = AppDataSource.getRepository(Article);

    // Get content calendars that are in "Writing...." status
    const contentCalendars = await contentCalendarRepository.find({
      where: { status: "Writing...." },
      relations: {
        articles: true,
      },
    });

    // Calculate the timestamp for 30 minutes ago
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Filter and update content calendars older than 30 minutes
    const failedCalendars = contentCalendars.filter(
      (calendar) => calendar.dateCreated < thirtyMinutesAgo
    );

    if (failedCalendars.length > 0) {
      // Update content calendars status to "Failed"
      await contentCalendarRepository.update(
        failedCalendars.map((calendar) => calendar.id),
        { status: "Failed" }
      );

      // Update associated articles status to "Failed"
      const articleIds = failedCalendars
        .flatMap((calendar) => calendar.articles)
        .map((article) => article.id);

      if (articleIds.length > 0) {
        await articleRepository.update(
          articleIds,
          { status: "Failed" }
        );
      }
    }
  },

  createContentCalendar: async (
    formData: any,
    orgId: string,
    titel: string,
    moduleId: number
  ): Promise<ContentCalendar> => {
    const contentCalendarRepository =
      AppDataSource.getRepository(ContentCalendar);

    const contentCalendar = contentCalendarRepository.create({
      title: titel,
      orgId: orgId,
      formData: formData,
      status: "Writing....",
      moduleId: moduleId,
    });

    await contentCalendarRepository.save(contentCalendar);
    return contentCalendar;
  },
  getPublishedArticles: async (): Promise<Article[]> => {
    const articleRepository = AppDataSource.getRepository(Article);

    // Find all articles that are linked to published content calendars
    const articles = await articleRepository
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.contentCalendar", "contentCalendar")
      .where("contentCalendar.status = :status", { status: "published" })
      .getMany();

    return articles;
  },
  getPublishedContentCalendarItems: async (
    orgId: string,
    moduleId: number
  ): Promise<ContentCalendar[]> => {
    const contentCalendarRepository =
      AppDataSource.getRepository(ContentCalendar);

    // Simple approach without complex selects
    const contentItems = await contentCalendarRepository.find({
      where: [
        { status: "Writing....", orgId: orgId, moduleId: moduleId },
        { status: "published", orgId: orgId, moduleId: moduleId },
        { status: "Failed", orgId: orgId, moduleId: moduleId },
      ],
      relations: {
        articles: true,
      },
    });

    return contentItems;
  },
  getUserPreferences: async (orgId: string): Promise<OrgPreference | null> => {
    const orgPreferenceRepository = AppDataSource.getRepository(OrgPreference);

    const orgPreference = await orgPreferenceRepository.findOne({
      where: { orgId },
    });

    return orgPreference;
  },

  getOrgModules: async (orgId: string): Promise<Module[]> => {
    const moduleRepository = AppDataSource.getRepository(Module);

    const modules = await moduleRepository
      .createQueryBuilder("module")
      .innerJoin("org_module_access", "access", "access.moduleId = module.id")
      .where("access.orgId = :orgId", { orgId })
      .getMany();

    return modules;
  },

  getModuleById: async (
    orgId: string,
    moduleId: number
  ): Promise<Module | null> => {
    const moduleRepository = AppDataSource.getRepository(Module);

    const module = await moduleRepository
      .createQueryBuilder("module")
      .innerJoin("org_module_access", "access", "access.moduleId = module.id")
      .where("access.orgId = :orgId", { orgId })
      .andWhere("module.id = :moduleId", { moduleId })
      .getOne();

    return module;
  },

  getPromptByModuleAndOrgId: async (
    moduleId: number,
    orgId: string
  ): Promise<string | null> => {
    const promptRepository = AppDataSource.getRepository(OrgModuleAccess);

    const prompt = await promptRepository.findOne({
      where: {
        moduleId,
        orgId,
      },
    });

    return prompt?.prompt ?? null;
  },

  getArticleBySlug: async (
    slug: string,
    orgId: string
  ): Promise<{
    title: string;
    text: string;
    createdAt: Date;
  } | null> => {
    try {
      const articleRepository = AppDataSource.getRepository(Article);
      const article = await articleRepository.findOne({
        where: {
          pagepath: slug,
          orgId,
        },
        relations: {
          contentCalendar: true,
        },
      });

      console.log(article);

      const object = article
        ? {
            title: article.contentCalendar?.title ?? "",
            text: article.text,
            createdAt: article.createdAt,
            outputFormat: article.outputFormat,
          }
        : null;

      console.log(object);
      return object;
    } catch (error) {
      console.error("Error getting article by slug:", error);
      throw error;
    }
  },
};
