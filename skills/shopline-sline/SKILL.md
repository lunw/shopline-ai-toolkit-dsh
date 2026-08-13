---
name: shopline-sline
description: Sline template engine, themes and SHOPLINE CLI. Use when writing or validating Sline theme templates, explaining Sline vs Liquid, working with Online Store 3.0 themes, or using the SHOPLINE CLI to scaffold apps/themes.
whenToUse: Theme development, Sline template syntax, theme validation, CLI scaffolding on SHOPLINE.
---

# Sline Templates, Themes & SHOPLINE CLI

Sline is SHOPLINE's template engine (Online Store 3.0 themes). It resembles Liquid but has its own tags, filters and file conventions — never assume Liquid syntax is valid Sline.

## Where things live

- Theme docs: `Online Store 3.0 Themes` section at https://developer.shopline.com/ (e.g. /docs/online-store-3-0-themes/bottle, /docs/sline/sline-overview, /docs/handlebars/basics)
- Themes are developed/uploaded through the theme tooling; app-side UI can use Handlebars for Ajax pages.
- Sline validation: the community sline.dev MCP server provides `mcp__sline__validate_theme` for validating Sline templates and supporting theme files (enable it in `cordis.patch.yml`, see `shopline-dev-mcp`).

## Working with the SHOPLINE CLI

- SHOPLINE CLI 2.0 speeds up app development with templates: https://developer.shopline.com/docs/apps/development-tool/shopline-cli/build-apps-using-shopline-cli
- Use it to scaffold an app skeleton, generate authorization boilerplate and iterate locally before uploading to a developer store.

## Validation workflow (AI-generated theme code)

1. Generate the Sline template.
2. Validate with `mcp__sline__validate_theme` (or the docs' template checks) — catches invalid tags/filters and theme-structure issues.
3. Iterate until validation passes, then visually test in a developer store theme editor.
4. Keep section/config schemas consistent with the theme's `settings_schema`/section definitions.

## Sline vs Liquid quick map

- Output/assignments look familiar (`{{ ... }}`, `{% ... %}`) but tag names and filters differ — check the Sline docs before porting Liquid code.
- Theme folders/sections follow Online Store 3.0 conventions — check the reference theme (e.g. Bottle) for correct structure.
- Theme review standards apply when selling themes in the Theme Shop: https://developer.shopline.com/docs/theme-shop/shopline-theme-review-standards

## References

- Sline overview: https://developer.shopline.com/docs/sline/sline-overview
- Handlebars basics: https://developer.shopline.com/docs/handlebars/basics
- sline.dev (community docs/MCP): https://sline.dev/mcp
