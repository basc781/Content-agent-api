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
    },
    articleContext: async (storeList: Array<Record<string, string>>) => {
        try {
            console.log("Starting to scrape websites: ", storeList);
            const results = [];

            for (const store of storeList) {
                const [storeName, url] = Object.entries(store)[0];
                try {
                    console.log(`Scraping ${storeName} at ${url}`);
                    
                    const scrapeResult = await app.scrapeUrl(url, {
                        formats: ["markdown"]
                    });

                    console.log('Raw scrape result:', {
                        store: storeName,
                        resultType: typeof scrapeResult,
                        resultStructure: Object.keys(scrapeResult || {}),
                        rawResult: scrapeResult
                    });

                    const websiteContent = JSON.stringify(scrapeResult)
                    console.log('Processed content:', {
                        store: storeName,
                        contentLength: websiteContent.length,
                        contentPreview: websiteContent.substring(0, 200) + '...'
                    });

                    results.push({
                        [storeName]: {
                            url: url,
                            content: websiteContent
                        }
                    });

                    console.log(`Successfully scraped ${storeName}`);
                } catch (error) {
                    console.error(`Error scraping ${storeName}:`, {
                        error,
                        type: typeof error,
                        message: (error as Error).message,
                        stack: (error as Error).stack
                    });
                    results.push({
                        [storeName]: {
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
                totalStores: storeList.length,
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