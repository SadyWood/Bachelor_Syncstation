# Claude Skills Overview

---

## code-quality-check

**Description:** Run quality checks (typecheck + eslint) after code changes. Enforces fixing issues rather than weakening rules. Use after significant code changes, before commits, or when reviewing PRs.

**Structure:**
```
.claude/skills/code-quality-check/
└── SKILL.md
```

---

## hoolsy-context

**Description:** Understand Hoolsy's platform ecosystem, business model, and architecture. Use when students or developers need context about Hoolsy's content-to-commerce vision, platform relationships, or technical architecture.

**Structure:**
```
.claude/skills/hoolsy-context/
└── SKILL.md
```

---

## postman-update

**Description:** Update Postman collections when adding new API endpoints. Use after creating new routes, modifying API responses, or adding new features to the API server.

**Structure:**
```
.claude/skills/postman-update/
└── SKILL.md
```

---

## type-safety-schema

**Description:** Enforce type safety and schema centralization in this monorepo. Use when reviewing PRs, adding API endpoints, moving types, or when there is a risk of duplicated API contracts between apps and packages/schema.

**Structure:**
```
.claude/skills/type-safety-schema/
├── SKILL.md
├── checklist.md
├── examples.md
└── package-setup.md
```

---

## useeffect-vs-useswr

**Description:** Guide for choosing between useEffect and useSWR in React components. Use when writing data fetching code, adding side effects, or reviewing React hooks usage. Prevents useEffect anti-patterns and ensures proper use of SWR for data fetching.

**Structure:**
```
.claude/skills/useeffect-vs-useswr/
└── SKILL.md
```

---

## skill-writer

**Description:** Guide users through creating Agent Skills for Claude Code. Use when the user wants to create, write, author, or design a new Skill, or needs help with SKILL.md files, frontmatter, or skill structure.

**Structure:**
```
.claude/skills/skill-writer/
└── SKILL.md
```

---
