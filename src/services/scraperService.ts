import FireCrawlApp from '@mendable/firecrawl-js';

const app = new FireCrawlApp({apiKey: process.env.FIRECRAWL_API_KEY});

export const scraperService = {
    companyContext: async (url: string) => {
        try {
            console.log("Starting to scrape website: ", url);
            const scrapeResult = await app.scrapeUrl(url, {
                formats: ["markdown"]
            });
            console.log("Scrape result: ", scrapeResult);
            return scrapeResult;
        } catch (error) {
            console.error("Scraping error:", error);
            throw error;
        }
    }
};  