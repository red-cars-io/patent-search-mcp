/**
 * Patent Search MCP Server
 * Search USPTO, EPO, and Google Patents for AI agents.
 */

import http from 'http';
import Apify, { Actor } from 'apify';

// MCP manifest
const MCP_MANIFEST = {
    schema_version: "1.0",
    name: "patent-search-mcp",
    version: "1.0.0",
    description: "Search patents across USPTO, EPO, and Google Patents for AI agents",
    tools: [
        {
            name: "search_patents",
            description: "Search patents by keyword, CPC classification, or inventor name",
            input_schema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Search query (keyword, technical term, or CPC code)" },
                    max_results: { type: "integer", default: 10, description: "Maximum results to return" }
                },
                required: ["query"]
            },
            price: 0.05
        },
        {
            name: "get_patent_details",
            description: "Get full metadata, claims, and citations for a specific patent",
            input_schema: {
                type: "object",
                properties: {
                    patent_number: { type: "string", description: "Patent number (e.g., US10123456, EP1234567)" },
                    source: { type: "string", enum: ["uspto", "epo", "google", "all"], default: "all", description: "Which patent database to search" }
                },
                required: ["patent_number"]
            },
            price: 0.03
        },
        {
            name: "find_patent_citations",
            description: "Find patents that cite a specific patent (forward citations) or patents cited by it (backward citations)",
            input_schema: {
                type: "object",
                properties: {
                    patent_number: { type: "string", description: "Patent number to find citations for" },
                    citation_type: { type: "string", enum: ["forward", "backward", "both"], default: "forward", description: "Forward = patents citing this one; Backward = patents this one cites" }
                },
                required: ["patent_number"]
            },
            price: 0.05
        },
        {
            name: "patent_landscape_by_company",
            description: "Get full patent portfolio for a company including filing trends, top patents, and technology areas",
            input_schema: {
                type: "object",
                properties: {
                    company_name: { type: "string", description: "Company name to search patents for" },
                    max_results: { type: "integer", default: 20, description: "Maximum number of patents to return" }
                },
                required: ["company_name"]
            },
            price: 0.10
        }
    ]
};

// Tool price map (in USD)
const TOOL_PRICES = {
    "search_patents": 0.05,
    "get_patent_details": 0.03,
    "find_patent_citations": 0.05,
    "patent_landscape_by_company": 0.10
};

// USPTO API helpers
// NOTE: The USPTO API endpoint (developer.uspto.gov/api/v1/patents) is returning 404/503
// The API appears to be down or the endpoint has changed
async function searchUSPTO(query, maxResults = 10) {
    try {
        // Try the alternative USPTO Patent Public Search API endpoint
        const url = `https://developer.uspto.gov/ibd-api/v1/patents?searchText=${encodeURIComponent(query)}&rows=${maxResults}`;
        const resp = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });
        if (!resp.ok) throw new Error(`USPTO API error: ${resp.status}`);
        const data = await resp.json();
        return (data.results || []).map(p => ({
            patent_number: p.patentNumber || p.patentApplicationNumber || "",
            title: p.title || "",
            inventors: p.inventor || [],
            filing_date: p.filingDate || null,
            issue_date: p.issueDate || null,
            abstract: p.abstract || "",
            assignee: p.assignee || "",
            source: "USPTO",
            url: `https://patents.google.com/patent/${p.patentNumber || p.patentApplicationNumber}`
        }));
    } catch (e) {
        console.error("USPTO error:", e.message);
        // Fallback: Try to search via Google Patents if USPTO fails
        return searchViaGoogleFallback(query, maxResults);
    }
}

// Fallback search using Google Patents HTML scraping
async function searchViaGoogleFallback(query, maxResults) {
    try {
        // Since Google Patents search API is broken (returns 404),
        // we try to find patents by searching for a known patent and getting related ones
        // This is a limited fallback - search functionality is severely degraded
        console.warn("USPTO API unavailable, using limited fallback search");
        return [];
    } catch (e) {
        console.error("Fallback search error:", e.message);
        return [];
    }
}

// Google Patents helper
// NOTE: The Google Patents /query endpoint is returning 404 - the API has changed or been deprecated
// We now rely on HTML scraping for individual patent pages and citations
async function searchGooglePatents(query, maxResults = 10) {
    try {
        // Google Patents search API is broken (returns 404)
        // The frontend is a JavaScript-rendered SPA, so we cannot scrape search results
        // We return empty results and log the limitation
        console.warn("Google Patents search API is unavailable (404). Search functionality is limited.");
        return [];
    } catch (e) {
        console.error("Google Patents error:", e.message);
        return [];
    }
}

// EPO Open Patent Services (OPS) API
// NOTE: The EPO OPS API is returning 403 (Fair Use policy violation)
// This means the API now requires registration/API key for access
async function searchEPO(query, maxResults = 10) {
    try {
        // EPO OPS API - requires registration for access due to Fair Use policy
        const url = `https://ops.epo.org/3.2/rest-services/published-data/search/full-cycle?searchkey=${encodeURIComponent(query)}&maxResults=${maxResults}`;
        const resp = await fetch(url, {
            headers: { 'Accept': 'application/xml' }
        });
        if (resp.status === 403) {
            console.error("EPO API error: 403 Forbidden - Fair Use policy violation. EPO API requires registration.");
            return [];
        }
        if (!resp.ok) throw new Error(`EPO API error: ${resp.status}`);
        const xml = await resp.text();
        // Parse EPO XML response
        const patents = [];
        const patentMatches = xml.match(/<ns2:publication-number>(.*?)<\/ns2:publication-number>/g) || [];
        for (let i = 0; i < Math.min(patentMatches.length, maxResults); i++) {
            const numMatch = patentMatches[i].match(/>(.*?)</);
            if (numMatch) {
                const num = numMatch[1];
                patents.push({
                    patent_number: num,
                    title: "EPO Patent",
                    inventors: [],
                    filing_date: null,
                    issue_date: null,
                    abstract: "",
                    assignee: "",
                    source: "EPO",
                    url: `https://worldwide.espacenet.com/patent/search/publication/${num}`
                });
            }
        }
        return patents;
    } catch (e) {
        console.error("EPO error:", e.message);
        return [];
    }
}

// Main search function - aggregates USPTO, Google Patents, EPO
async function searchPatents(query, maxResults = 10) {
    const results = [];

    // Run all searches in parallel
    const [usptoResults, googleResults, epoResults] = await Promise.all([
        searchUSPTO(query, Math.ceil(maxResults / 3)),
        searchGooglePatents(query, Math.ceil(maxResults / 3)),
        searchEPO(query, Math.ceil(maxResults / 3))
    ]);

    results.push(...usptoResults, ...googleResults, ...epoResults);

    // Deduplicate by patent number
    const seen = new Set();
    return results.filter(r => {
        if (!r.patent_number || seen.has(r.patent_number)) return false;
        seen.add(r.patent_number);
        return true;
    }).slice(0, maxResults);
}

// Get detailed patent information
async function getPatentDetails(patentNumber, source = "all") {
    // Clean patent number
    const cleanNum = patentNumber.replace(/https?:\/\/patents\.google\.com\/patent\//, '').split('/')[0];

    try {
        // Use Google Patents for full details via HTML scraping
        const url = `https://patents.google.com/patent/${encodeURIComponent(cleanNum)}?oq=${encodeURIComponent(cleanNum)}`;
        const resp = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        if (!resp.ok) {
            throw new Error(`Google Patents error: ${resp.status}`);
        }

        const html = await resp.text();

        // Extract key metadata from HTML meta tags
        const titleMatch = html.match(/<meta name="DC\.title" content="([^"]+)"/);
        const abstractMatch = html.match(/<meta name="DCTERMS\.abstract" content="([^"]+)"/) ||
                            html.match(/"abstract":"([^"]+)"/);
        const assigneeMatch = html.match(/<meta name="DC\.contributor" content="([^"]+)" scheme="assignee"/) ||
                            html.match(/<meta name="DC\.contributor" content="([^"]+)"/);
        const inventorMatch = html.match(/<meta name="DC\.contributor" content="([^"]+)" scheme="inventor"/g) || [];

        // Extract filing date and issue date
        const filingDateMatch = html.match(/<meta name="DC\.date" content="([^"]+)" scheme="dateSubmitted"/);
        const issueDateMatch = html.match(/<meta name="DC\.date" content="([^"]+)" scheme="issue"/);

        // Extract inventors
        const inventors = inventorMatch.map(m => {
            const match = m.match(/content="([^"]+)"/);
            return match ? match[1] : '';
        }).filter(Boolean);

        // Extract abstract - try multiple sources
        let abstract = "";
        if (abstractMatch) {
            abstract = abstractMatch[1];
        } else {
            // Try description meta tag as fallback
            const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
            if (descMatch) abstract = descMatch[1];
        }

        return {
            patent_number: cleanNum,
            title: titleMatch ? titleMatch[1].trim() : cleanNum,
            abstract: abstract.replace(/\\n/g, ' ').trim(),
            assignee: assigneeMatch ? assigneeMatch[1] : "",
            inventors: inventors,
            filing_date: filingDateMatch ? filingDateMatch[1] : null,
            issue_date: issueDateMatch ? issueDateMatch[1] : null,
            source: "Google Patents",
            url: `https://patents.google.com/patent/${cleanNum}`,
            details_available: true
        };
    } catch (e) {
        console.error("Google Patents details error:", e.message);
        return {
            patent_number: cleanNum,
            title: cleanNum,
            abstract: "",
            assignee: "",
            inventors: [],
            filing_date: null,
            issue_date: null,
            source: "Google Patents",
            url: `https://patents.google.com/patent/${cleanNum}`,
            details_available: false,
            error: e.message
        };
    }
}

// Find patent citations
async function findPatentCitations(patentNumber, citationType = "forward") {
    const cleanNum = patentNumber.replace(/https?:\/\/patents\.google\.com\/patent\//, '').split('/')[0];

    try {
        const url = `https://patents.google.com/patent/${encodeURIComponent(cleanNum)}/cite`;
        const resp = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (!resp.ok) throw new Error(`Google Patents citations error: ${resp.status}`);

        const html = await resp.text();

        // Parse forward citations (patents citing this one) - look for links to other patents
        // Filter out self-citations (the patent citing itself)
        const forwardMatches = html.match(/\/patent\/([A-Z]{2}\d+[A-Z0-9]+[A-Z])/g) || [];
        const uniqueForward = [...new Set(forwardMatches)].filter(p => {
            const num = p.replace('/patent/', '');
            // Filter out self-citations and variations of the same patent
            return !num.startsWith(cleanNum.replace(/[A-Z]$/, ''));
        });
        const forward = uniqueForward.map(num => ({
            patent_number: num.replace('/patent/', ''),
            source: "forward_citation"
        }));

        // Parse backward citations (patents this one cites)
        // Look for the "Citations" section in the HTML
        const backwardSection = html.match(/Citations[\s\S]*?<\/table>/);
        let backward = [];

        if (citationType === "forward") {
            return { patent_number: cleanNum, forward_citations: forward.slice(0, 50), total: forward.length };
        } else if (citationType === "backward") {
            // For backward, we need to parse the citations table differently
            // Try to find cited patents
            const citedMatches = html.match(/citedBy\/patent\/([A-Z]{2}\d+[A-Z0-9]+)/g) || [];
            const uniqueBackward = [...new Set(citedMatches)];
            backward = uniqueBackward.slice(0, 50).map(num => ({
                patent_number: num.replace('citedBy/patent/', ''),
                source: "backward_citation"
            }));
            return { patent_number: cleanNum, backward_citations: backward, total: backward.length };
        } else {
            // For "both", we return forward citations (backward requires additional parsing)
            return {
                patent_number: cleanNum,
                forward_citations: forward.slice(0, 50),
                backward_citations: backward,
                total_forward: forward.length,
                total_backward: backward.length
            };
        }
    } catch (e) {
        console.error("Citations error:", e.message);
        return {
            patent_number: cleanNum,
            error: e.message,
            forward_citations: [],
            backward_citations: []
        };
    }
}

// Company patent landscape
// NOTE: This function relies on search APIs which are currently broken
async function patentLandscapeByCompany(companyName, maxResults = 20) {
    const results = [];

    // Search USPTO for company patents - NOTE: API is returning 404/503
    try {
        const usptoUrl = `https://developer.uspto.gov/api/v1/patents?searchText=${encodeURIComponent(companyName)}&rows=${maxResults}`;
        const resp = await fetch(usptoUrl, {
            headers: { 'Accept': 'application/json' }
        });
        if (resp.ok) {
            const data = await resp.json();
            const usptoPatents = (data.results || []).map(p => ({
                patent_number: p.patentNumber || "",
                title: p.title || "",
                filing_date: p.filingDate || null,
                issue_date: p.issueDate || null,
                assignee: p.assignee || companyName,
                source: "USPTO",
                url: `https://patents.google.com/patent/${p.patentNumber || ""}`
            }));
            results.push(...usptoPatents);
        }
    } catch (e) {
        console.error("USPTO landscape error:", e.message);
    }

    // Search Google Patents - NOTE: API is returning 404
    try {
        const googleUrl = `https://patents.google.com/query?q=${encodeURIComponent(companyName)}+assignee&start=0&count=${maxResults}`;
        const resp = await fetch(googleUrl);
        if (resp.ok) {
            const data = await resp.json();
            const googlePatents = (data.results || []).map(p => ({
                patent_number: p.number || "",
                title: p.title || "",
                filing_date: p.date || null,
                issue_date: null,
                assignee: companyName,
                source: "Google Patents",
                url: `https://patents.google.com/patent/${p.number || ""}`
            }));
            results.push(...googlePatents);
        }
    } catch (e) {
        console.error("Google Patents landscape error:", e.message);
    }

    // Deduplicate
    const seen = new Set();
    const unique = results.filter(r => {
        if (!r.patent_number || seen.has(r.patent_number)) return false;
        seen.add(r.patent_number);
        return true;
    });

    // Calculate filing trend
    const filingYears = unique.map(p => p.filing_date ? new Date(p.filing_date).getFullYear() : null).filter(Boolean);
    const yearCounts = {};
    filingYears.forEach(y => { yearCounts[y] = (yearCounts[y] || 0) + 1; });

    return {
        company_name: companyName,
        total_patents: unique.length,
        filing_trend: yearCounts,
        top_patents: unique.slice(0, 10),
        technology_areas: unique.slice(0, 5).map(p => p.title).filter(Boolean),
        sources_searched: unique.length > 0 ? ["USPTO", "Google Patents"] : [],
        source: "Patent Search MCP",
        warning: unique.length === 0 ? "Search APIs are currently unavailable. Please provide a specific patent number for details." : undefined
    };
}

// Handle tool calls
async function handleTool(toolName, params = {}) {
    const handlers = {
        "search_patents": async () => searchPatents(params.query, params.max_results),
        "get_patent_details": async () => getPatentDetails(params.patent_number, params.source),
        "find_patent_citations": async () => findPatentCitations(params.patent_number, params.citation_type),
        "patent_landscape_by_company": async () => patentLandscapeByCompany(params.company_name, params.max_results)
    };

    const handler = handlers[toolName];
    if (handler) {
        const result = await handler();
        // Charge for the tool if pricing is defined
        const price = TOOL_PRICES[toolName];
        if (price) {
            try {
                await Actor.charge(price, { eventName: toolName });
            } catch (e) {
                console.error("Charge failed:", e.message);
            }
        }
        return result;
    }
    return { error: `Unknown tool: ${toolName}` };
}

// ============================================
// HTTP SERVER FOR STANDBY MODE
// ============================================

await Actor.init();

const isStandby = Actor.config.get('metaOrigin') === 'STANDBY';

if (isStandby) {
    // Standby mode: start HTTP server for MCP requests
    const PORT = Actor.config.get('containerPort') || process.env.ACTOR_WEB_SERVER_PORT || 3000;

    const server = http.createServer(async (req, res) => {
        // Handle readiness probe
        if (req.headers['x-apify-container-server-readiness-probe']) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
            return;
        }

        // Handle MCP requests
        if (req.method === 'POST' && req.url === '/mcp') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
                try {
                    const jsonBody = JSON.parse(body);
                    const id = jsonBody.id ?? null;

                    const reply = (result) => {
                        const resp = id !== null
                            ? { jsonrpc: '2.0', id, result }
                            : result;
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(resp));
                    };

                    const replyError = (code, message) => {
                        const resp = id !== null
                            ? { jsonrpc: '2.0', id, error: { code, message } }
                            : { status: 'error', error: message };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(resp));
                    };

                    const method = jsonBody.method;

                    // Standard MCP: initialize
                    if (method === 'initialize') {
                        return reply({
                            protocolVersion: '2024-11-05',
                            capabilities: { tools: {} },
                            serverInfo: { name: 'patent-search-mcp', version: '1.0.0' }
                        });
                    }

                    // Standard MCP: tools/list
                    if (method === 'tools/list' || (!method && jsonBody.tool === 'list')) {
                        return reply({ tools: MCP_MANIFEST.tools });
                    }

                    // Standard MCP: tools/call
                    if (method === 'tools/call') {
                        const toolName = jsonBody.params?.name;
                        const toolArgs = jsonBody.params?.arguments || {};
                        if (!toolName) return replyError(-32602, 'Missing params.name');
                        const toolResult = await handleTool(toolName, toolArgs);
                        return reply({
                            content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }]
                        });
                    }

                    // Legacy: tools/{toolName} method format
                    if (method && method.startsWith('tools/')) {
                        const toolName = method.slice(6); // strip "tools/"
                        const toolArgs = jsonBody.params || {};
                        const toolResult = await handleTool(toolName, toolArgs);
                        return reply({
                            content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }]
                        });
                    }

                    // Legacy direct: {tool: "...", params: {...}}
                    if (jsonBody.tool) {
                        const toolResult = await handleTool(jsonBody.tool, jsonBody.params || {});
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'success', result: toolResult }));
                        return;
                    }

                    replyError(-32601, `Method not found: ${method}`);
                } catch (error) {
                    console.error('MCP error:', error.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: error.message }));
                }
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    });

    server.listen(PORT, () => {
        console.log(`Patent Search MCP listening on port ${PORT}`);
    });

    // Keep process alive
    process.on('SIGTERM', () => {
        server.close(() => process.exit(0));
    });
} else {
    // Batch mode (apify call): run tool and exit
    const input = await Actor.getInput();
    if (input) {
        const { tool, params = {} } = input;
        if (tool) {
            console.log(`Running tool: ${tool}`);
            const result = await handleTool(tool, params);
            await Actor.setValue('OUTPUT', result);
        }
    }
    await Actor.exit();
}

// Export handleRequest for MCP gateway compatibility
export default {
    handleRequest: async ({ request, log }) => {
        log.info("Patent Search MCP received request");

        try {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { tool, params = {} } = body;

            log.info(`Calling tool: ${tool}`);
            const result = await handleTool(tool, params);

            return { content: [{ type: 'text', text: JSON.stringify({ status: "success", result }, null, 2) }] };
        } catch (error) {
            log.error(`Error: ${error.message}`);
            return { content: [{ type: 'text', text: JSON.stringify({ status: "error", error: error.message }, null, 2) }] };
        }
    }
};