# Patent Search

**Type**: Apify MCP Actor (TypeScript)
**Purpose**: Search patents across USPTO, EPO, and Google Patents for AI agents — find patents, citations, and company landscapes in one tool call
**Stack**: Apify SDK, CheerioCrawler (HTTP API), MCP protocol, standby mode

## Quick Start

```bash
cd ~/Projects/apify-actors/patent-search-mcp
apify run          # Local development
apify push          # Deploy to Apify
```

## Key Files

- `src/main.ts` — MCP handler entry point with `handleRequest` export
- `.actor/actor.json` — Standby mode enabled (`usesStandbyMode: true`)
- `.actor/input_schema.json` — Tool definitions
- `README.md` — Auto-generated on build

## Architecture

- Standby MCP via `handleRequest` export
- Readiness probe at GET / (checks `x-apify-container-server-readiness-probe` header)
- Uses Apify SDK log package (`apify/log`)
- PPE configured — $0.03–0.15/tool
- Sources: USPTO, EPO, Google Patents

## Tools

| Tool | Description | PPE |
|------|-------------|-----|
| `search_patents` | Search by keyword, inventor, assignee, date range | $0.03 |
| `patent_details` | Full patent record with claims, figures, citations | $0.05 |
| `citation_graph` | Forward/backward citations for a patent | $0.10 |
| `company_landscape` | Patent portfolio for a company/assignee | $0.15 |

## Notes

- Health check cron: `~/bin/fleet-health.sh`
- Deployed at: `red-cars--patent-search-mcp.apify.actor`
- USPTO and Google Patents are public; EPO may need proxy
- Cross-sell with tech-scouting-report-mcp for TRL analysis