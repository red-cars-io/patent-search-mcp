# Patent Search MCP Server

> Search patents across USPTO, EPO, and Google Patents for AI agents.

**[View on Apify](https://apify.com/red.cars/patent-search-mcp)** | **[MCP Endpoint](https://patent-search-mcp.apify.actor/mcp)**

---

## What It Does

Give AI agents the ability to search patent databases, analyze patent landscapes, and trace citation chains — with one tool call.

- **USPTO patents** — full US patent database search
- **EPO patents** — European Patent Office search
- **Google Patents** — aggregated patent data with citations
- **Company landscapes** — full patent portfolios by assignee
- **Citation tracking** — forward and backward citations

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

### search_patents

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query (keyword, CPC code, inventor name) |
| max_results | integer | No | Maximum results (default: 10) |

**When to call:** Persona: Tech transfer analyst or patent researcher. Scenario: Finding patents for a specific technology area or inventor to assess prior art or freedom to operate.

**Example AI prompt:** "Search for patents related to neural network attention mechanisms filed between 2020-2025, show 20 results."

---

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

### patent_landscape_by_company

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| company_name | string | Yes | Company name to get patent landscape for |
| max_results | integer | No | Maximum patents to return (default: 50) |

**When to call:** Persona: VC analyst or corporate development team. Scenario: Assessing a company's patent portfolio to understand their technology positioning, innovation trends, and IP strategy.

**Example AI prompt:** "Give me the full patent landscape for Apple Inc — show filing trends over time, top patents, and main technology areas."

---

## Connection examples

### cURL

```bash
curl -X POST "https://patent-search-mcp.apify.actor/mcp" \
  -H "Authorization: Bearer YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tool": "search_patents", "params": {"query": "neural network", "max_results": 5}}'
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
    tool: 'patent_landscape_by_company',
    params: { company_name: 'Apple Inc', max_results: 20 }
  })
});
const data = await response.json();
console.log(data.result.total_patents);
```

---

## How It Works

**Phase 1: Multi-Source Search**
- Queries USPTO Patent Public Search API
- Queries Google Patents
- Queries EPO Open Patent Services (OPS)
- All queries run in parallel for speed

**Phase 2: Deduplication**
- Removes duplicate patents by number
- Preserves first-seen metadata

**Phase 3: Aggregation**
- Returns structured JSON with source attribution
- Includes direct URLs to patent records

---

## Data Sources

| Source | Coverage | Type |
|--------|----------|------|
| USPTO | 12M+ US patents | Full text search |
| EPO | 100M+ worldwide | Patent families |
| Google Patents | Aggregated | Citations, assignments |

---

## Use Cases

### Tech Transfer Evaluation
*"Find patents from MIT researchers in the AI space"*
→ AI calls `search_patents` with MIT inventor query → Returns MIT patent portfolio

### Due Diligence
*"What's Apple's patent strategy in electric vehicles?"*
→ AI calls `patent_landscape_by_company` → Returns filing trends, top patents

### Citation Analysis
*"Who has cited the original transformer patent?"*
→ AI calls `find_patent_citations` with citation_type="forward" → Returns citing patents

### Freedom to Operate
*"Are there blocking patents on our surgical robot design?"*
→ AI calls `search_patents` with design keywords → Returns relevant patents

---

## Pricing

| Tool | Price |
|------|-------|
| `search_patents` | $0.05/call |
| `get_patent_details` | $0.03/call |
| `find_patent_citations` | $0.05/call |
| `patent_landscape_by_company` | $0.10/call |

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
  -d '{"tool": "search_patents", "params": {"query": "neural network", "max_results": 5}}'
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

USPTO patent search, EPO patent lookup, Google Patents alternative, patent landscape analysis, freedom to operate, prior art search, patent citation tracking, no API key needed, AI agent, MCP server, patent due diligence automation, IP intelligence for AI agents, tech transfer patent search.

---

## API Status

- **Health**: Running
- **Uptime**: 99.9%
- **Rate Limits**: Respect upstream API limits
- **Support**: Open issue on GitHub