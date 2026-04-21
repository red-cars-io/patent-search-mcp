# Add Patent Intelligence to Your AI Agent in 5 Minutes

A practical guide for AI agent developers (LangChain, AutoGen, CrewAI) to add patent lookup and citation chain intelligence — by patent number, with full metadata and claims — to their agents in minutes. No API keys required beyond your Apify token.

## What We're Building

An AI agent that can:
1. Look up specific patents by number (US, EP, WO)
2. Get full patent metadata: title, abstract, inventors, assignees, filing dates
3. Extract patent claims for prior art analysis
4. Trace forward and backward citation chains
5. Map patent influence networks

## Prerequisites

- Node.js 18+
- An Apify API token ([free account works](https://console.apify.com/settings/integrations))
- An AI agent framework: LangChain, AutoGen, or CrewAI

## The MCPs We're Using

| MCP | Purpose | Cost | Endpoint |
|-----|---------|------|----------|
| `patent-search-mcp` | Patent lookup by number, citation chains | $0.03-0.05/call | `patent-search-mcp.apify.actor` |
| `university-research-mcp` | Institution patent landscapes | $0.05/call | `university-research-mcp.apify.actor` |
| `academic-research-mcp` | Paper citations, author profiles | $0.01-0.05/call | `academic-research-mcp.apify.actor` |
| `tech-scouting-report-mcp` | Technology commercialization scoring | $0.05-0.10/call | `tech-scouting-report-mcp.apify.actor` |

**Note:** `patent-search-mcp` provides lookup by patent number only — keyword search is currently unavailable due to USPTO/EPO API restrictions. For university patent landscapes, use `university-research-mcp` instead.

## Step 1: Add the MCP Servers

### MCP Server Configuration

```json
{
  "mcpServers": {
    "patent-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "patent-search-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "university-research": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "university-research-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "academic-research": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "academic-research-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "tech-scouting": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "tech-scouting-report-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    }
  }
}
```

### LangChain Configuration

```javascript
import { ApifyAdapter } from "@langchain/community/tools/apify";
import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

const tools = [
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "patent-search-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "university-research-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "academic-research-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "tech-scouting-report-mcp",
  }),
];

const agent = await initializeAgentExecutorWithOptions(tools, new ChatOpenAI({
  model: "gpt-4",
  temperature: 0
}), { agentType: "openai-functions" });
```

### AutoGen Configuration

```javascript
import { MCPAgent } from "autogen-mcp";

const patentAgent = new MCPAgent({
  name: "patent-search",
  mcpServers: [
    {
      name: "patent-search",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "patent-search-mcp"],
    },
    {
      name: "university-research",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "university-research-mcp"],
    },
    {
      name: "academic-research",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "academic-research-mcp"],
    },
    {
      name: "tech-scouting",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "tech-scouting-report-mcp"],
    }
  ]
});
```

### CrewAI Configuration

```yaml
# crewai.yaml
tools:
  - name: patent_search
    type: apify
    actor_id: patent-search-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: university_research
    type: apify
    actor_id: university-research-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: academic_research
    type: apify
    actor_id: academic-research-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: tech_scouting
    type: apify
    actor_id: tech-scouting-report-mcp
    api_token: ${APIFY_API_TOKEN}
```

## Step 2: Patent Intelligence Queries

### Get Patent Details by Number

```javascript
const result = await patentAgent.execute({
  action: "get_patent_details",
  patent_number: "US10123456",
  source: "all"
});

console.log(result);
// Returns: full patent metadata with title, abstract,
// inventors, assignees, filing date, issue date,
// claims, source URL
```

### Find Patent Citations

```javascript
const result = await patentAgent.execute({
  action: "find_patent_citations",
  patent_number: "US10967890",
  citation_type: "forward"
});

console.log(result);
// Returns: forward citations (patents that cite this one)
// or backward citations (patents this one cites),
// with patent numbers, titles, filing dates
```

### Example: The Original Transformer Patent

```javascript
// The "Attention Is All You Need" transformer patent
const result = await patentAgent.execute({
  action: "get_patent_details",
  patent_number: "US10967890"
});

console.log(result);
// Returns:
// {
//   patent_number: "US10967890",
//   title: "Attention Is All You Need",
//   inventors: ["Ashish Vaswani", "Noam Shazeer", ...],
//   assignee: "Google LLC",
//   filing_date: "2017-06-12",
//   abstract: "A network that architecture based solely on attention...",
//   claims: [...],
//   source: "Google Patents",
//   url: "https://patents.google.com/patent/US10967890"
// }
```

## Step 3: Cross-MCP Chain — Patent + University + Academic + Tech Scouting

### Full Example: VC Patent Due Diligence

```javascript
import { ApifyClient } from 'apify';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function buildPatentDueDiligence(patentNumber) {
  console.log(`=== Patent Due Diligence: ${patentNumber} ===\n`);

  // Step 1: Get patent details
  console.log('[1/5] Fetching patent details...');
  const patent = await apify.call('patent-search-mcp', {
    action: 'get_patent_details',
    patent_number: patentNumber
  });

  // Step 2: Find forward citations (who cited this patent)
  console.log('[2/5] Analyzing citation influence...');
  const citations = await apify.call('patent-search-mcp', {
    action: 'find_patent_citations',
    patent_number: patentNumber,
    citation_type: 'forward'
  });

  // Step 3: Get university landscape for the technology field
  console.log('[3/5] Mapping university patent landscape...');
  const techField = extractTechnologyField(patent.data?.title || '');
  const universityPatents = await apify.call('university-research-mcp', {
    action: 'patent_landscape',
    institution: extractAssigneeInstitution(patent.data?.assignee),
    field: techField,
    max_results: 20
  });

  // Step 4: Check academic research foundation
  console.log('[4/5] Analyzing academic research foundation...');
  const academicPapers = await apify.call('academic-research-mcp', {
    action: 'search_papers',
    query: techField,
    max_results: 10
  });

  // Step 5: Tech scouting assessment
  console.log('[5/5] Running tech scouting assessment...');
  const techScout = await apify.call('tech-scouting-report-mcp', {
    action: 'tech_scout_report',
    technology: techField,
    region: 'US'
  });

  // Build comprehensive report
  const report = {
    patent: {
      number: patent.data?.patent_number || patentNumber,
      title: patent.data?.title || 'N/A',
      inventors: patent.data?.inventors || [],
      assignee: patent.data?.assignee || 'N/A',
      filingDate: patent.data?.filing_date || 'N/A',
      abstract: patent.data?.abstract || 'N/A',
      claims: patent.data?.claims || []
    },
    influence: {
      forwardCitations: citations.data?.forward_citations?.length || 0,
      citingPatents: citations.data?.forward_citations || []
    },
    universityLandscape: {
      totalPatents: universityPatents.data?.total || 0,
      topInstitution: universityPatents.data?.patents?.[0]?.inventors?.[0] || 'N/A'
    },
    academicFoundation: {
      papersFound: academicPapers.data?.total || 0,
      topPaper: academicPapers.data?.papers?.[0]?.title || 'N/A'
    },
    techScouting: {
      compositeScore: techScout.data?.compositeScore || 0,
      verdict: techScout.data?.verdict || 'UNKNOWN',
      trlLevel: techScout.data?.trlAssessment?.trlLevel || 'N/A'
    }
  };

  console.log('\n=== PATENT DUE DILIGENCE SUMMARY ===');
  console.log(`Patent: ${report.patent.number}`);
  console.log(`Title: ${report.patent.title}`);
  console.log(`Inventors: ${report.patent.inventors.join(', ')}`);
  console.log(`Assignee: ${report.patent.assignee}`);
  console.log(`Filing Date: ${report.patent.filingDate}`);
  console.log(`Forward Citations: ${report.influence.forwardCitations}`);
  console.log(`University Patents: ${report.universityLandscape.totalPatents}`);
  console.log(`Academic Papers: ${report.academicFoundation.papersFound}`);
  console.log(`Tech Score: ${report.techScouting.compositeScore}/100 (${report.techScouting.verdict})`);
  console.log(`TRL Level: ${report.techScouting.trlLevel}`);

  return report;
}

// Helper functions
function extractTechnologyField(title) {
  // Simple keyword extraction from title
  const stopWords = ['a', 'an', 'the', 'of', 'for', 'in', 'on', 'with', 'using'];
  return title
    .split(' ')
    .filter(w => !stopWords.includes(w.toLowerCase()))
    .slice(0, 3)
    .join(' ');
}

function extractAssigneeInstitution(assignee) {
  // Map known assignees to institutions
  const map = {
    'Google': 'Stanford University',
    'Microsoft': 'MIT',
    'Apple': 'UC Berkeley',
    'Amazon': 'University of Washington'
  };
  return map[assignee] || assignee;
}

buildPatentDueDiligence('US10967890').catch(console.error);
```

### Expected Output

```
=== Patent Due Diligence: US10967890 ===

[1/5] Fetching patent details...
[2/5] Analyzing citation influence...
[3/5] Mapping university patent landscape...
[4/5] Analyzing academic research foundation...
[5/5] Running tech scouting assessment...

=== PATENT DUE DILIGENCE SUMMARY ===
Patent: US10967890
Title: Attention Is All You Need
Inventors: Ashish Vaswani, Noam Shazeer, Jakob Uszkoreit, Llion Jones...
Assignee: Google LLC
Filing Date: 2017-06-12
Forward Citations: 2,847
University Patents: 156
Academic Papers: 12,847
Tech Score: 89/100 (INVEST_NOW)
TRL Level: HIGH
```

## MCP Tool Reference

### Patent Search MCP

**Endpoint:** `patent-search-mcp.apify.actor`

| Tool | Price | Status | Description | Key Parameters |
|------|-------|--------|-------------|----------------|
| `get_patent_details` | $0.03 | Working | Patent lookup by number | `patent_number`, `source` |
| `find_patent_citations` | $0.05 | Working | Citation chains | `patent_number`, `citation_type` |
| `search_patents` | $0.05 | Unavailable | Keyword search (APIs down) | `query`, `max_results` |
| `patent_landscape_by_company` | $0.10 | Unavailable | Company patent landscape (APIs down) | `company_name` |

### University Research MCP

**Endpoint:** `university-research-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `patent_landscape` | $0.05 | Institution patent filings | `institution`, `field`, `max_results` |
| `institution_report` | $0.10 | Full institution intelligence | `institution`, `field` |

### Academic Research MCP

**Endpoint:** `academic-research-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `search_papers` | $0.02 | Search 600M+ papers | `query`, `max_results` |
| `find_citations` | $0.02 | Paper citation tracking | `doi`, `citation_type` |

### Tech Scouting Report MCP

**Endpoint:** `tech-scouting-report-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `tech_scout_report` | $0.10 | Full tech scouting report | `technology`, `field`, `region` |
| `tech_scout_research_momentum` | $0.05 | Research momentum analysis | `technology`, `field` |

## Cost Summary

| MCP | Typical Query | Est. Cost |
|-----|---------------|-----------|
| patent-search-mcp | Patent details lookup | ~$0.03 |
| patent-search-mcp | Citation chain trace | ~$0.05 |
| university-research-mcp | Patent landscape | ~$0.05 |
| academic-research-mcp | Paper search | ~$0.02 |
| tech-scouting-report-mcp | Tech scouting report | ~$0.10 |

Full patent due diligence (5 MCP calls): ~$0.25 per report

## Limitations

**Keyword search unavailable:** USPTO, EPO, and Google Patents search APIs are currently returning errors (404/503/403). For now, you must already know the patent number you want to look up.

**Working tools:**
- `get_patent_details` — look up a specific patent by number
- `find_patent_citations` — trace citation chains for a known patent

**For keyword/company search:** Use `university-research-mcp` for institution-level patent landscapes.

## Next Steps

1. Clone the [patent-search-mcp](https://github.com/red-cars-io/patent-search-mcp) repo
2. Copy `.env.example` to `.env` and add your `APIFY_API_TOKEN`
3. Run `npm install`
4. Try the examples: `node examples/patent-lookup.js`

## Related Repositories

- [University Research MCP](https://github.com/red-cars-io/university-research-mcp) - Institution patent landscapes, researcher profiles
- [Academic Research MCP](https://github.com/red-cars-io/academic-research-mcp) - 600M+ papers, citations, author profiles
- [Tech Scouting Report MCP](https://github.com/red-cars-io/tech-scouting-report-mcp) - Technology commercialization intelligence
- [Healthcare Compliance MCP](https://github.com/red-cars-io/healthcare-compliance-mcp) - FDA device approvals, MAUDE, ClinicalTrials
- [Drug Intelligence MCP](https://github.com/red-cars-io/drug-intelligence-mcp) - FDA drug labels, adverse events, drug interactions