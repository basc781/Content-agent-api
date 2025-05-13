import FireCrawlApp, { ScrapeResponse }  from '@mendable/firecrawl-js';
import { scrapedWebPages } from '../types/types';

const app = new FireCrawlApp({apiKey: process.env.FIRECRAWL_API_KEY});

export const scraperService = {
    companyContext: async (url: string): Promise<string> => {
        try {
            const scrapeResult = await app.scrapeUrl(url, {formats: ["markdown"]}) as ScrapeResponse;
            if (!scrapeResult.markdown) {
                throw new Error("No markdown found in scrape result");
            }
            return scrapeResult.markdown;
        } catch (error) {
            console.error("Scraping error:", error);
            throw error;
        }
    },
    articleContext: async (storeListUrls: string[]): Promise<scrapedWebPages[]> => {
        try {
            console.log("Starting to scrape websites: ", storeListUrls);
            const results = [];

            for (const store of storeListUrls) {
                const [webpageName, url] = Object.entries(store)[0];
                try {
                    console.log(`Scraping ${webpageName} at ${url}`);
                    
                    const scrapeResult = await app.scrapeUrl(url, {
                        formats: ["markdown"]
                    });

                    const websiteContent = JSON.stringify(scrapeResult) 

                    results.push({
                        [webpageName]: {
                            url: url,
                            content: websiteContent
                        }
                    });

                } catch (error) {
                    console.error(`Error scraping ${webpageName}:`, {
                        error,
                        type: typeof error,
                        message: (error as Error).message,
                        stack: (error as Error).stack
                    });
                    results.push({
                        [webpageName]: {
                            url: url,
                            error: `Failed to scrape: ${(error as Error).message}`
                        }
                    });
                }

                // Wait 6 seconds between requests to stay under 10 requests/minute
                console.log('Waiting 6 seconds before next request...');
                await new Promise(resolve => setTimeout(resolve, 6000));
            }

            console.log("Final results summary:", {
                totalStores: storeListUrls.length,
                successfulScrapes: results.filter(r => !Object.values(r)[0].error).length,
                failedScrapes: results.filter(r => Object.values(r)[0].error).length
            });
            return results;
        } catch (error) {
            console.error("Global scraping error:", error);
            throw error;
        }
    }
};  