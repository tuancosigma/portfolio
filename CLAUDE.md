# CLAUDE.md

## Build and Test Commands
- Run development server: `npm run dev`
- Build project: `npm run build`
- Start built project: `npm run start`
- Lint code: `npm run lint`
- Cloudflare builds:
  - Build: `npm run cf:build`
  - Preview: `npm run cf:preview`
  - Deploy: `npm run cf:deploy`

## Code Guidelines
- **Core Technology**: Next.js 16 (App Router), React 19, Tailwind CSS v4.
- **Rules & Orchestration**: Refer to the extensive ClaudeKit guidance under `.claude/rules/CLAUDE.md` and related workflow rules under `.claude/rules/*.md`.
- **Imports**: Use standard relative paths or path aliases configured in `tsconfig.json`.
- **TypeScript**: Strictly type components, props, hooks, and APIs. Avoid `any` types.
