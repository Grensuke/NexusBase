# NexusBase Frontend Redesign Brief

## Context

NexusBase is a freelance services marketplace (like Fiverr) connecting clients who need work done with freelancers offering gigs. The current frontend leans on a full-viewport space/cosmos video hero and dark glassmorphism/"liquid-glass" as the whole design system (see `frontend/app/globals.css` and `frontend/app/page.module.css`). Redesign it — don't restyle on top of what's there.

## The problem to actually fix

The current signature choices — space video, glass-and-blur everywhere — aren't derived from anything about freelance work. They'd sit unchanged on a crypto site or a fitness app, which is the tell that they were defaults, not decisions. Before proposing anything, think about what this product's world actually looks like: a freelance marketplace's entire value proposition is proof that a stranger can do good work — trust, portfolios, ratings, real completed gigs. Ground every visual choice in that.

## Pass 1 — plan first, don't write code yet

1. **Color** — 4-6 named colors as hex values, with what each is for.
2. **Typography** — two typefaces max, each with an explicit role (display vs. body/UI), not your default pairing.
3. **One signature element** — the thing this design gets remembered for. Not a stock effect — something specific to a marketplace built on trust and proof-of-work.
4. **Layout concept** for the homepage — describe it in words or ASCII before any code.
5. **Critique your own plan.** For each choice: is this specific to a freelance marketplace, or would it be your default answer for any brief? If you've landed on warm cream + serif + a terracotta/clay accent, or near-black + one neon accent, or newspaper/broadsheet style with hairline rules — that's a default, not a decision. Replace it. Same goes for the space video: cut it unless you can defend it against this test.

Show me the plan before touching code.

## Pass 2 — build it

- Work against the existing structure — `app/globals.css` for the design system, `page.module.css` for the homepage, `components/Navbar.js`, `components/GigCard.js`, `components/ReviewForm.js` — not a from-scratch rebuild.
- Use real content: actual gig/category language, pulled from `database/seed.sql` if you need examples — no lorem ipsum.
- Restraint: spend the signature element in one place (hero or gig card, pick one) and keep everything else disciplined. Don't stack blur + video + heavy animation at once.
- Not allowed: stock video backgrounds, glassmorphism as the default treatment for every card/panel, generic "cinematic" hero copy.

## Before you show me the result

Screenshot the homepage, the gigs browse page, and a gig detail page. Check each against:
- Does the type hierarchy read clearly at a glance?
- Is spacing consistent, or ad hoc?
- Could this be told apart from a generic SaaS template if the labels were removed?
- Does anything here look like it was pasted in from an unrelated product?

Fix what fails before calling it done.
