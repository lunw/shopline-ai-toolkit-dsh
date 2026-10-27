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

## Compatibility with dsh runtimes

dsh checks a profile bundle's peerDependencies against the running dsh version
(dsh-app-boot's own version). Peer names that are @deepseek-ai/dsh or start with
@deepseek-ai/dsh- are validated; every other peer is ignored. An incompatible bundle is
skipped at startup (stderr: dsh: skipping profile bundle ...) until either the plugin is
updated or an exact-version exemption is granted.

| Plugin version | Supported dsh runtimes | Notes |
| --- | --- | --- |
| 0.2.2+ | 0.1.x line (^0.1.0-rc.6) AND 0.2.x line (^0.2.0-rc.2) | peer range "^0.1.0-rc.6 || ^0.2.0-rc.2"; the MCP bridge uses the runtime-provided @deepseek-ai/dsh-mcp-client (no bundled copy, no version skew) |
| 0.1.x - 0.2.1 | ^0.1.0-rc.6 only | flagged on dsh 0.2.0-rc.2: "Plugin shopline-ai-toolkit-dsh@<ver> is incompatible with dsh 0.2.0-rc.2: peerDependencies {@deepseek-ai/dsh-skill: ^0.1.0-rc.6}" |

If a future runtime is flagged: update the plugin, or accept the risk for the exact
package/runtime pair:

    dsh plugin --profile web allow-version shopline-ai-toolkit-dsh@0.2.2 --dsh-version <exact runtime> --accept-risk
    dsh plugin --profile web version-exemptions
    dsh plugin --profile web revoke-version shopline-ai-toolkit-dsh@0.2.2 --dsh-version <exact runtime>

The exemption is recorded in the profile's compatibility.json and applies only to that exact
package version and exact runtime version.

## Updating an installed plugin

The profile records how the plugin was installed in
~/.dsh/profiles/<profile>/package.json. Update according to the spec:

Installed from GitHub (dependency looks like "github:lunw/shopline-ai-toolkit-dsh"):

    # re-resolve the git spec to the latest main commit (and reinstall)
    dsh plugin --profile web add github:lunw/shopline-ai-toolkit-dsh
    # or pin a released tag for reproducible installs, then install:
    #   edit ~/.dsh/profiles/web/package.json:
    #   "shopline-ai-toolkit-dsh": "github:lunw/shopline-ai-toolkit-dsh#v0.2.2"
    dsh plugin --profile web install
    dsh web

Installed from npm (once published):

    dsh plugin --profile web update shopline-ai-toolkit-dsh
    # or: dsh plugin --profile web add shopline-ai-toolkit-dsh@latest

Installed from a local path (file:...): re-run the add with the same path so pnpm re-links
the package, then restart dsh.

Verify the update:

    # installed version (matches the repo's package.json version)
    python3 -c "import json;print(json.load(open('/Users/lenny/.dsh/profiles/web/node_modules/shopline-ai-toolkit-dsh/package.json'))['version'])"
    # composed config still contains the two rows
    dsh --profile web --dump-config | grep -A 8 mcp-shopline
    # startup must NOT print: skipping profile bundle "shopline-ai-toolkit-dsh"

If the old version is still loaded after updating, remove the stale copy and reinstall:

    rm -rf ~/.dsh/profiles/web/node_modules/shopline-ai-toolkit-dsh
    dsh plugin --profile web install
