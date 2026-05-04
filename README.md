# Patent Lookup MCP Server

> Look up patents BY NUMBER — get full details and citation chains for AI agents.

**[View on Apify](https://apify.com/red.cars/patent-search-mcp)** | **[MCP Endpoint](https://patent-search-mcp.apify.actor/mcp)**

---

## What It Does

Give AI agents the ability to look up specific patents by number, retrieve full metadata and claims, and trace citation chains.

- **Patent lookup by number** — get full details for a specific patent
- **Claims and metadata** — abstracts, inventors, assignees, filing dates
- **Citation tracking** — forward and backward citation chains
- **Google Patents** — aggregated patent data with citations

---

## Comparison

- [Comparison: vs Google Patents, USPTO](COMPARISON.md)

---

## Known Limitations

**Keyword search is currently unavailable.** The USPTO, EPO, and Google Patents search APIs are returning errors (404/503/403). To use this MCP, you must already know the patent number you want to look up.

Working features:
- `get_patent_details` — look up a specific patent by number
- `find_patent_citations` — trace citation chains for a known patent

Non-operational:
- `search_patents` — keyword search unavailable (APIs down)
- `patent_landscape_by_company` — company search unavailable (APIs down)

---

## Quick Start

Add to your AI agent:

```json
{
  "mcpServers": {
    "patent-search-mcp": {
      "url": "https://patent-search-mcp.apify.actor/mcp"
    }
  }
}
```

Or with authentication:

```json
{
  "mcpServers": {
    "patent-search-mcp": {
      "url": "https://patent-search-mcp.apify.actor/mcp?token=YOUR_APIFY_TOKEN"
    }
  }
}
```

---

## Tool parameters

### get_patent_details

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| patent_number | string | Yes | Patent number (e.g., US10123456, EP3456789) |
| source | string | No | Source: uspto, epo, google, all (default: all) |

**When to call:** Persona: IP lawyer or due diligence analyst. Scenario: Getting full metadata, claims, and assignee information for a specific patent being evaluated in a transaction.

**Example AI prompt:** "Get full details for patent US10712345 including the abstract, claims, and assignee information."

---

### find_patent_citations

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| patent_number | string | Yes | Patent number to find citations for |
| citation_type | string | No | forward, backward, or both (default: both) |

**When to call:** Persona: Patent strategist or innovation analyst. Scenario: Tracing citation chains to understand a patent's influence or find potentially infringing downstream patents.

**Example AI prompt:** "Find all forward citations for the original transformer patent US10967890 — show who has cited this patent."

---

### search_patents

> **UNAVAILABLE** — Keyword search is currently broken (USPTO/EPO/Google APIs returning errors).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query (keyword, CPC code, inventor name) |
| max_results | integer | No | Maximum results (default: 10) |

**When to call:** Only when keyword search is restored. For now, use `get_patent_details` with a known patent number.

**Example AI prompt:** "Search for patents related to neural network attention mechanisms filed between 2020-2025, show 20 results."

---

### patent_landscape_by_company

> **UNAVAILABLE** — Company search is currently broken (APIs returning errors).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| company_name | string | Yes | Company name to get patent landscape for |
| max_results | integer | No | Maximum patents to return (default: 50) |

**When to call:** Only when company search is restored.

---

## Connection examples

### cURL

```bash
curl -X POST "https://patent-search-mcp.apify.actor/mcp" \
  -H "Authorization: Bearer YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_patent_details", "params": {"patent_number": "US10123456"}}'
```

### Node.js

```javascript
const response = await fetch('https://patent-search-mcp.apify.actor/mcp', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_APIFY_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'get_patent_details',
    params: { patent_number: 'US10123456' }
  })
});
const data = await response.json();
console.log(data.result.title);
```

---

## How It Works

**Phase 1: Patent Lookup**
- Accepts a specific patent number (e.g., US10123456)
- Fetches data from Google Patents HTML pages

**Phase 2: Citation Tracing**
- Parses the /cite page for forward and backward citations
- Returns structured citation chains

**Phase 3: Aggregation**
- Returns structured JSON with source attribution
- Includes direct URLs to patent records

---

## Data Sources

| Source | Coverage | Status |
|--------|----------|--------|
| Google Patents | Aggregated | Working — HTML scraping for details/citations |
| USPTO | 12M+ US patents | Search unavailable (API returning 404/503) |
| EPO | 100M+ worldwide | Search unavailable (API returning 403) |

---

## Use Cases

### Due Diligence
*"What's in patent US10712345 — abstract, claims, assignee?"*
→ AI calls `get_patent_details` with patent number → Returns full metadata

### Citation Analysis
*"Who has cited the original transformer patent US10967890?"*
→ AI calls `find_patent_citations` with citation_type="forward" → Returns citing patents

### Prior Art Research (when search is restored)
*"Find patents from MIT researchers in the AI space"*
→ AI would call `search_patents` with MIT inventor query → Returns MIT patent portfolio

### Company Landscape (when search is restored)
*"What's Apple's patent strategy in electric vehicles?"*
→ AI would call `patent_landscape_by_company` → Returns filing trends, top patents

---

## Pricing

| Tool | Price | Status |
|------|-------|--------|
| `get_patent_details` | $0.03/call | Working |
| `find_patent_citations` | $0.05/call | Working |
| `search_patents` | $0.05/call | Unavailable |
| `patent_landscape_by_company` | $0.10/call | Unavailable |

No subscription required. Pay per use via Apify PPE.

---

## Cross-Sell Triggers

This MCP complements the research intelligence cluster:

- `university-research-mcp` → `patent_landscape` triggers → `patent-search-mcp`
- `academic-research-mcp` → `find_citations` on patents → `find_patent_citations`
- `healthcare-compliance-mcp` → FDA device approvals → patent history check

---

## Connect to AI Agents

### Claude Desktop
```json
{
  "mcpServers": {
    "patent-search-mcp": {
      "url": "https://patent-search-mcp.apify.actor/mcp"
    }
  }
}
```

### Cursor / Windsurf
Add the same JSON to your AI client config.

### cURL Example
```bash
curl -X POST "https://patent-search-mcp.apify.actor/mcp" \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_patent_details", "params": {"patent_number": "US10123456"}}'
```

---

## Output Schema

All tools return JSON. Each result includes:
- `patent_number` — unique identifier
- `title` — patent title
- `source` — which database
- `url` — direct link to record

---

## SEO Keywords

Patent lookup by number, USPTO patent lookup, EPO patent lookup, Google Patents lookup, patent details API, patent citations API, patent claims lookup, AI agent patent tools, MCP server, IP intelligence for AI agents, patent due diligence automation, Google Patents alternative, USPTO patent comparison.

---

## API Status

- **Health**: Running
- **Lookup by number**: Working
- **Keyword search**: Unavailable (USPTO/EPO/Google APIs returning errors)
- **Company search**: Unavailable (APIs returning errors)
- **Rate Limits**: Respect upstream API limits
- **Support**: Open issue on GitHub