// SHOPLINE AI Toolkit for DeepSeek Harness (DSH)
//
// Cordis plugin (bundle: shopline-ai-toolkit-dsh). Registers the bundled
// SKILL.md skills (skills/*) on ctx.skills as a filesystem-backed provider,
// mirroring the "agent skills" layer of the Shopify AI Toolkit.
//
// The official SHOPLINE Developer MCP bridge itself lives in the patch layer
// (cordis.patch.yml, row `mcp-shopline` -> @deepseek-ai/dsh-mcp-client), so
// model-facing MCP tools (mcp__shopline__*) are provided by DSH's own MCP
// client and need no code here.
//
// Provider contract: see @deepseek-ai/dsh-skill (ctx.skills.registerProvider).
// Candidates rank at 600 (BUNDLED_SKILL_RANK): project/user skill roots and
// runtime registrations still outrank bundled skills when names collide.

import { fileURLToPath } from 'node:url'
import { readdir, readFile } from 'node:fs/promises'
import { join, dirname, extname } from 'node:path'

const PACKAGE_DIR = dirname(fileURLToPath(import.meta.url))
const SKILLS_DIR = join(PACKAGE_DIR, '..', 'skills')
const PROVIDER_NAME = 'shopline-ai-toolkit'
const RANK = 600 // BUNDLED_SKILL_RANK

// --- minimal frontmatter parsing -------------------------------------------
// Supports the same scalar keys the DSH filesystem provider understands:
//   name, description, whenToUse, metadata, disable-model-invocation,
//   user-invocable
// Values may be plain scalars or single/double-quoted strings. Anything that
// fails to parse drops the whole skill with a console warning instead of
// exposing a half-parsed definition.

function parseBool(value) {
  const v = String(value).trim().toLowerCase()
  if (['true', 'yes', 'on', '1'].includes(v)) return true
  if (['false', 'no', 'off', '0'].includes(v)) return false
  return undefined
}

function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!match) return { frontmatter: {}, body: text }
  const raw = match[1]
  const frontmatter = {}
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    const value = line.slice(colon + 1).trim()
    if (value === '') {
      frontmatter[key] = null
    } else {
      const unquoted = value.replace(/^['"]|['"]$/g, '')
      frontmatter[key] = unquoted
    }
  }
  return { frontmatter, body: text.slice(match[0].length) }
}

// --- discovery --------------------------------------------------------------

function skillNameFromFile(file) {
  if (file.endsWith('/SKILL.md') || file.endsWith('/skill.md')) {
    return dirname(file).split(/[\\/]/).pop()
  }
  if (file.endsWith('.md')) return file.slice(0, -3)
  return null
}

async function listSkillFiles() {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillMd = join(SKILLS_DIR, entry.name, 'SKILL.md')
      try {
        await readFile(skillMd, 'utf8')
        files.push(skillMd)
      } catch {
        // no SKILL.md inside; ignore
      }
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
      files.push(join(SKILLS_DIR, entry.name))
    }
  }
  return files
}

// --- plugin ------------------------------------------------------------------

export const name = 'shopline-ai-toolkit-dsh'

export function apply(ctx) {
  const skills = ctx.get('skills')
  if (skills === undefined) {
    console.warn('[shopline-ai-toolkit] ctx.skills unavailable; bundled SHOPLINE skills not registered')
    return
  }
  return skills.registerProvider(() => ({
    name: PROVIDER_NAME,
    list: async () => {
      const files = await listSkillFiles()
      const candidates = []
      for (const file of files) {
        const skillName = skillNameFromFile(file)
        if (!skillName || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skillName)) {
          console.warn(`[shopline-ai-toolkit] skip invalid skill name: ${file}`)
          continue
        }
        const text = await readFile(file, 'utf8')
        const { frontmatter } = parseFrontmatter(text)
        const disableModel = parseBool(frontmatter['disable-model-invocation'])
        const userInvocable = parseBool(frontmatter['user-invocable'])
        candidates.push({
          name: skillName,
          description: frontmatter.description || skillName,
          whenToUse: frontmatter.whenToUse || undefined,
          invocation: {
            modelInvocable: disableModel === true ? false : true,
            userInvocable: userInvocable === false ? false : true,
          },
          source: 'bundled',
          provider: PROVIDER_NAME,
          rank: RANK,
          locator: file,
          path: file,
          metadata: frontmatter.metadata ? { value: frontmatter.metadata } : undefined,
        })
      }
      return candidates
    },
    get: async (candidate) => {
      const text = await readFile(candidate.locator, 'utf8')
      const { frontmatter, body } = parseFrontmatter(text)
      if (frontmatter.name && frontmatter.name !== candidate.name) {
        // renamed between discovery and load: report as stale
        return undefined
      }
      const disableModel = parseBool(frontmatter['disable-model-invocation'])
      const userInvocable = parseBool(frontmatter['user-invocable'])
      return {
        name: candidate.name,
        description: candidate.description,
        whenToUse: candidate.whenToUse,
        invocation: candidate.invocation,
        source: 'bundled',
        provider: PROVIDER_NAME,
        resourceBase: { kind: 'directory', path: dirname(candidate.locator) },
        path: candidate.locator,
        metadata: candidate.metadata,
        content: body.trim() + '\n',
      }
    },
  }))
}
