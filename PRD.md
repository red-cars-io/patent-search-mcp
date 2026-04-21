# Patent Search MCP — PRD

**Version:** 1.0
**Date:** 2026-04-19
**Status:** Ready for build
**Template:** Cloned from academic-research-mcp
**GitHub Repo:** `red-cars-io/patent-search-mcp`
**MCP Endpoint:** `https://patent-search-mcp.apify.actor/mcp`

---

## 1. Concept & Vision

**What it does:** Give AI agents the ability to search patent databases, analyze patent landscapes, and trace citation chains — with one tool call.

**What it feels like:** A patent analyst that has access to USPTO, EPO, and Google Patents simultaneously. AI agents call it to find "patents on X," "who owns this patent," "what patents cite this one."

**Tagline:** *"Your AI agent's patent intelligence layer — searches 150M+ patents in one call."*

---

## 2. Differentiation from ApifyForge

ApifyForge has **Patent Search MCP** as an actor (not MCP). We make it an MCP server so AI agents call it directly.

| Feature | ApifyForge | Ours |
|---------|-----------|------|
| Format | Actor (needs Apify UI) | MCP (direct AI agent call) |
| USPTO | Yes | Yes |
| EPO | Yes | Yes |
| Google Patents | Yes | Yes (citations) |
| Company landscape | No | Yes |
| Citation tracking | No | Forward + backward |

---

## 3. Data Sources (All Free)

| Source | Records | What's Available | API |
|--------|---------|-----------------|-----|
| USPTO | 12M+ | Full text, assignments, citations | Free REST API |
| EPO | 100M+ | Patent families, filings | OPS API (free) |
| Google Patents | All | Citations, assignments | Public scrape |

---

## 4. MCP Tools

### Tool 1: `search_patents`
Search patents across all sources.

```
Input:  query (string), max_results (int, default 10)
Output: patents with number, title, inventors, dates, assignee
Price: $0.05/call
```

### Tool 2: `get_patent_details`
Get full metadata for a specific patent.

```
Input:  patent_number (string), source (uspto|epo|google|all)
Output: full patent record with abstract, assignee, URL
Price: $0.03/call
```

### Tool 3: `find_patent_citations`
Find forward/backward citations.

```
Input:  patent_number (string), citation_type (forward|backward|both)
Output: citation chain with counts
Price: $0.05/call
```

### Tool 4: `patent_landscape_by_company`
Get full patent portfolio for a company.

```
Input:  company_name (string), max_results (int, default 20)
Output: portfolio stats, filing trends, top patents
Price: $0.10/call
```

---

## 5. Cross-Sell Chain

This MCP completes the research intelligence vertical:

```
university-research-mcp → patent_landscape triggers → patent-search-mcp
academic-research-mcp → find_citations on patents → find_patent_citations
healthcare-compliance-mcp → FDA device → patent history check

Cross-sell signals:
- "institution has patents" → patent-search-mcp
- "device innovation" → patent history
- "tech transfer" → patent landscape
```

---

## 6. Build Checklist

- [x] GitHub repo created: red-cars-io/patent-search-mcp
- [x] Clone from academic-research-mcp template
- [x] Implement 4 tools
- [x] README (18-section ApifyForge style)
- [x] llms.txt for AI discovery
- [ ] Deploy to Apify
- [ ] Set PPE pricing
- [ ] Enable standby mode
- [ ] Test endpoint

---

## 7. Pricing

| Tool | Price |
|------|-------|
| search_patents | $0.05/call |
| get_patent_details | $0.03/call |
| find_patent_citations | $0.05/call |
| patent_landscape_by_company | $0.10/call |