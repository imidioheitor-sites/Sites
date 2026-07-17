# sites-skills

A collection of **13 Claude Code skills** for building distinctive, non-templated marketing websites — interactive web effects, visual design guidance, animation, and workflow automation.

The skills live in [`.claude/skills/`](.claude/skills), so **Claude Code picks them up automatically as project skills** when you work in this repository. The npm installer below copies them into your personal Claude Code skills directory so they're available everywhere.

## Install via npm

Install all skills into your user skills directory (`~/.claude/skills`, or `$CLAUDE_CONFIG_DIR/skills`):

```bash
npx @heitorimidio/sites-skills
```

Other modes:

```bash
npx @heitorimidio/sites-skills --project   # install into ./.claude/skills of the current repo
npx @heitorimidio/sites-skills --list      # list the bundled skills
npx @heitorimidio/sites-skills --force     # overwrite skills that already exist
```

Then restart Claude Code (or start a new session) to load the new skills.

### From a clone

```bash
git clone https://github.com/heitorimidio/sites.git
cd sites
node bin/install.js          # -> ~/.claude/skills
node bin/install.js --project # -> ./.claude/skills
```

## Skills

| Skill | What it does |
|---|---|
| **web-effects-library** | Library of 9 interactive React Bits effects (fluid cursor, bento grids, 3D glass, dot fields, card swaps, wave backgrounds, and more) plus a build playbook for out-of-the-standard sites. |
| **frontend-design** | Distinctive, intentional visual design direction — palette, typography, layout that doesn't read as templated. |
| **web-design** | Visual design guidance for marketing sites on Next.js + Tailwind + shadcn/ui. |
| **modern-web-design** | 2024–2025 web design trends, micro-interactions, scrollytelling, accessibility, and performance patterns. |
| **design-evaluation-audit** | Systematic design review against cognitive-science principles with scoring and severity-classified fixes. |
| **animate** | Generate animated videos and motion graphics as a standalone Vite + React + Framer Motion project. |
| **motion-framer** | Production animations with Motion / Framer Motion — variants, gestures, layout and exit animations, springs. |
| **animated-component-libraries** | Pre-built animated component collections (Magic UI, React Bits) for landing pages and dashboards. |
| **lightweight-3d-effects** | Lightweight pseudo-3D and background effects with Zdog, Vanta.js, and Vanilla-Tilt.js. |
| **blender-web-pipeline** | Blender → glTF export and optimization workflows for Three.js / Babylon.js / R3F. |
| **meta-prompt-engineering** | Turn vague prompts into structured, constraint-aware prompts with roles, steps, and quality checks. |
| **workflow-automator** | Map a manual business workflow and design its automated replacement with triggers, branching, and error handling. |
| **contact-hunter** | Search and enrich publicly available contact information with source attribution and compliance rules. |

## Repository layout

```
sites/
├── .claude/skills/            # the 13 skills (auto-discovered by Claude Code)
│   ├── web-effects-library/
│   │   ├── SKILL.md
│   │   └── references/        # component sources, brief, style references
│   └── <other skills>/SKILL.md
├── bin/install.js             # dependency-free npm installer
├── package.json
└── README.md
```

## Notes

- Some skills reference `references/`, `scripts/`, or `assets/` folders that ship only their `SKILL.md`. The `SKILL.md` is self-contained enough to be useful; the extra folders were not part of the source material for those skills. The **web-effects-library** skill includes its full `references/` tree.
- The package name `@heitorimidio/sites-skills` is a placeholder scoped to the GitHub owner — rename it in `package.json` before publishing to a different npm scope.

## License

MIT
