# Installation

`shopline-ai-toolkit-dsh` is a dsh plugin bundle: an npm package whose
`cordis.patch.yml` layer registers the official SHOPLINE Developer MCP bridge and whose
`lib/index.js` registers the bundled SHOPLINE skills. You can install it three ways.

## Option A — full bundle (recommended)

Prereqs: dsh installed, Node.js >= 18 (the MCP server needs it), and npm access so that
`npx -y @shoplineos/shopline-developer-mcp` works.

```bash
# 1. install the package into a profile (forwards to pnpm in the profile dir)
dsh plugin --profile web add shopline-ai-toolkit-dsh

# 2. declare the bundle in the profile manifest — edit ~/.dsh/profiles/web/package.json:
#    "dsh": { "profile": { "bundles": [
#      "@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "shopline-ai-toolkit-dsh"
#    ] } }

# 3. restart dsh web
dsh web
```

From a GitHub checkout instead of npm:

```bash
dsh plugin --profile web add github:lunw/shopline-ai-toolkit-dsh
# then add "shopline-ai-toolkit-dsh" to dsh.profile.bundles as above
```

After restart:
- the agent's skill catalog contains the `shopline-*` skills;
- the model can call `mcp__shopline__*` tools (official MCP server).

## Option B — skills only (no bundle)

Copy the skill bundles into a DSH skill root — user-wide or per project:

```bash
cp -R skills/* ~/.dsh/skills/          # user-wide (all profiles/projects)
# or
cp -R skills/* <project>/.dsh/skills/  # per project
```

DSH discovers skills from `~/.dsh/skills`, `~/.agents/skills` and
`<project>/.dsh/skills` (see `@deepseek-ai/dsh-skill-filesystem`). This works in any
profile, no plugin install needed — like Shopify's `npx skills add`.

## Option C — MCP bridge only (no skills)

Add the snippet from `mcp/mcp.shopline.json` (or below) to the profile's
`cordis.patch.yml`:

```yaml
- id: mcp-shopline
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: shopline
    transport: stdio
    command: npx
    args: ['-y', '@shoplineos/shopline-developer-mcp']
    toolCallTimeoutMs: 120000
```

Requires `@deepseek-ai/dsh-mcp-client` resolvable from the profile (it is a dependency
of this package; `pnpm add @deepseek-ai/dsh-mcp-client` in the profile also works).

## Verify

```bash
# the composed config contains the two new rows
dsh --profile web --dump-config | grep -A 8 mcp-shopline
dsh --profile web --dump-config | grep -A 3 shopline-toolkit
```

In the web GUI, ask: "List the SHOPLINE developer MCP tools" — the model should enumerate
`mcp__shopline__*` and load the `shopline-dev-mcp` skill. The first MCP call downloads
the server package and may take a few seconds.

## Enable the optional sline.dev MCP server

Uncomment the `mcp-shopline-sline` row in `cordis.patch.yml` (or add it to the profile
patch) to get `mcp__sline__*` tools (Admin schema introspection, Sline theme validation).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `mcp__shopline__*` tools missing | MCP server startup failed silently (default `failOnStartupError: false`). Run `npx -y @shoplineos/shopline-developer-mcp` once manually; check node >= 18. |
| Skills not in catalog | Skills are cataloged per agent preset; restart the session, or use Option B with `~/.dsh/skills`. |
| First tool call times out | The npx download can take > 60 s; raise `toolCallTimeoutMs` or pre-warm the package. |
