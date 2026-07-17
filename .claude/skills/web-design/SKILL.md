---
name: web-design
description: Visual design guidance for marketing websites and web UIs. Use when the user says "design", "redesign", "design review", "make it look better", "polish the UI", "design a hero section", "design system", "color palette", "typography", "visual hierarchy", "spacing", "design critique", or asks for opinions on layout, color, or aesthetics. Defaults to a Next.js + Tailwind + shadcn/ui stack.
license: MIT
metadata:
  author: Kopplin Co.
  version: "0.1.0"
---

# Web Design

You are designing or critiquing visual design for marketing websites and web UIs. The default stack is Next.js + Tailwind + shadcn/ui. The default audience is small-business and B2B marketing sites. Bias toward modern, restrained, conversion-focused design, not novelty.

## Core Principles

1. **Hierarchy is the whole job.** Every section should have one primary thing the eye lands on first, one secondary thing, and supporting detail. If two elements compete for primary attention, you have no hierarchy.
2. **Whitespace is design, not absence of design.** Cramped layouts read cheap. Generous spacing reads premium. When in doubt, increase padding.
3. **Restraint beats novelty.** Two fonts, four to six colors, one accent. Adding more weakens the system.
4. **Match style to audience.** A B2B SaaS for compliance officers should not look like a DTC skincare brand. Pick references that match the buyer.
5. **Conversion before aesthetics.** A pretty page that hides the CTA fails. Aesthetics serve the funnel; they do not replace it.

## Design System Defaults

Treat these as starting points. Override when the brand demands it, but always justify the override.

### Typography

- **Two typefaces max.** Usually one display/heading plus one body. A single high quality variable font is often enough.
- **Recommended pairings:**
  - Inter (body) + Inter Display or Inter Tight (headings). Neutral, modern, safe default.
  - Geist (body) + Geist (headings). Clean, Vercel flavored.
  - Söhne or Söhne Breit (premium SaaS feel, paid).
  - Instrument Serif or Fraunces (display) + Inter (body). Editorial, warmer.
  - Use `next/font/google` to load fonts. Never use `<link>` tags in `head` for performance reasons.
- **Type scale (Tailwind tokens):**
  - Hero headline: `text-5xl md:text-6xl lg:text-7xl`, `font-semibold` or `font-bold`, `tracking-tight`, `leading-[1.05]`.
  - Section heading: `text-3xl md:text-4xl lg:text-5xl`, `font-semibold`, `tracking-tight`.
  - Subheading or eyebrow: `text-sm uppercase tracking-widest text-muted-foreground`.
  - Lead paragraph: `text-lg md:text-xl text-muted-foreground leading-relaxed`.
  - Body: `text-base leading-7`.
  - Small: `text-sm text-muted-foreground`.
- **Line length:** body copy should be 60 to 75 characters per line. Use `max-w-prose` (~65ch) on long form text blocks.
- **Line height:** tighter for headlines (`leading-tight` or tighter), looser for body (`leading-relaxed` or `leading-7`).
- **Letter spacing:** `tracking-tight` for large display text. Default for body. `tracking-wide` or `tracking-widest` only for small uppercase eyebrows.

### Color

- **Build a six token palette, not a rainbow.**
  - `background` (page)
  - `foreground` (default text)
  - `muted` (subtle background) and `muted-foreground` (secondary text)
  - `primary` (brand accent for CTAs, links, key emphasis)
  - `border` (dividers, input borders)
  - One semantic accent for warnings or success if needed
- **Use shadcn/ui's CSS variable convention** in `globals.css`:
  ```css
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --primary: 222 47% 11%;
    --primary-foreground: 210 40% 98%;
    --border: 214 32% 91%;
  }
  ```
  Then reference with `bg-background`, `text-foreground`, `bg-primary`, etc.
- **Contrast targets:** 4.5:1 minimum for body text, 3:1 for large text and UI components. Test with a contrast checker, do not eyeball it.
- **Avoid pure black on pure white.** Use `#0A0A0A` or `hsl(222 47% 11%)` on `#FFFFFF`, or near white on near black. Pure black or white is harsh on screens.
- **One accent color.** A single saturated color used sparingly (CTAs, links, focus rings) reads more confident than three competing accents.
- **Dark mode:** if needed, invert via `.dark` class on `<html>` and define a parallel set of HSL tokens. Do not just swap white for black. Reduce saturation and shift hues.

### Spacing and Layout

- **8 point grid.** Tailwind's default scale is already 4 point increments. Stick to multiples (`p-2`, `p-4`, `p-6`, `p-8`, `p-12`, `p-16`, `p-24`, `p-32`).
- **Container widths:**
  - Full bleed sections: edge to edge, content constrained inside.
  - Standard content max width: `max-w-7xl` (1280px) for marketing pages, `max-w-6xl` (1152px) for content heavy pages, `max-w-3xl` (768px) for long form articles.
  - Use `container mx-auto px-6 md:px-8` for consistent horizontal padding.
- **Section vertical rhythm:** `py-20 md:py-28 lg:py-32` for major marketing sections. Hero often `py-24 md:py-32 lg:py-40`. Tighten for dense pages, loosen for premium feel.
- **Consistent gaps in grids:** `gap-6` (24px) for cards, `gap-4` (16px) for tight grids, `gap-8` (32px) for spacious feature sections.

### Radii, Borders, Shadows

- **Radius:** pick one and stick with it. `rounded-lg` (8px) is a safe default. `rounded-xl` (12px) reads modern. `rounded-2xl` (16px) reads consumer or playful. Pure square (`rounded-none`) reads brutalist or editorial.
- **Borders:** `border border-border` (1px, low contrast). Avoid heavy borders. Hairline dividers (`border-t border-border`) are usually enough.
- **Shadows:** modern marketing sites lean into subtle, layered shadows or no shadow at all. Use `shadow-sm` for cards, `shadow-lg` for floating elements, `shadow-2xl` for hero feature cards. Avoid the default Tailwind `shadow` (looks dated). For premium feel, use a custom soft shadow:
  ```css
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
  ```

## Layout Patterns

### Hero Sections

A marketing hero must answer three questions in under three seconds: **What is this? Who is it for? What do I do next?**

Required elements:
1. **Headline.** Outcome focused, customer centric.
2. **Subheadline.** One sentence clarifying the headline.
3. **Primary CTA.** High contrast button, action verb.
4. **Secondary CTA or social proof.** "Watch demo", "See pricing", logo strip, or rating.
5. **Visual.** Product screenshot, illustration, or photography. Avoid generic stock photos.

Common hero layouts:
- **Centered, single column.** Best for simple value props. Headline + sub + CTAs centered, visual below.
- **Split (text left, visual right).** Best when visual carries weight (product screenshots, dashboards).
- **Asymmetric grid.** Multiple content blocks at different scales, modern editorial feel.
- **Full bleed background image with overlay.** Use sparingly. Ensure text contrast (overlay opacity 40 to 60%).

Anti patterns:
- More than two CTAs (decision paralysis).
- Carousel or slider hero (nobody waits for slide 2; analytics consistently show this).
- Hero so tall that nothing else is visible above the fold on a laptop (`min-h-screen` is usually wrong for marketing).

### Above the Fold Strategy

The visible viewport on a 1366x768 laptop is roughly 1366x600 after browser chrome. Design assuming this. The hero should fit comfortably with a hint of the next section visible. That hint drives scroll.

### Common Section Types (in typical order)

1. **Hero.** Value prop and CTA.
2. **Social proof bar.** Logos or rating, immediately under hero.
3. **Problem or agitation.** What is broken without you.
4. **Solution or how it works.** Usually a 3 step or 3 feature grid.
5. **Features or benefits.** Alternating split sections (text and visual) with each feature.
6. **Testimonials.** Quote, name, photo, company. Real, attributed.
7. **Pricing** (if applicable). Clear table, recommended plan highlighted.
8. **FAQ.** Accordion. Addresses real objections, not vanity questions.
9. **Final CTA.** Restate the offer. Same CTA wording as hero.
10. **Footer.** Navigation, contact, legal.

Not every page needs every section. Cut ruthlessly.

### Grid and Card Patterns

- **3 column feature grid:** `grid grid-cols-1 md:grid-cols-3 gap-8`. Each card has icon, heading, 1 to 2 sentence description.
- **2 column alternating split:** image left and text right, then text left and image right. Use `lg:grid-cols-2 gap-12 lg:gap-20` and reverse with `lg:order-2`.
- **Bento grid:** asymmetric grid of cards at different sizes, popularized by Apple. Use sparingly, only when content has natural size variation.

## Component Design

### Buttons

- **Primary:** filled, brand color, white text. `bg-primary text-primary-foreground hover:bg-primary/90`.
- **Secondary:** outline. `border border-border bg-background hover:bg-muted`.
- **Ghost:** no border, no background until hover. For tertiary actions.
- **Sizing:** at least 44px tall on mobile (`h-11`) for tap targets. Marketing CTAs often `h-12` or `h-14` for prominence.
- **Padding:** `px-6` for default, `px-8` for marketing CTAs.
- **Always include a focus ring:** `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`. shadcn's Button does this by default.
- **Hover states:** subtle. Slight darken (`hover:bg-primary/90`) or background shift. Avoid scale or shadow changes that feel busy.

### Forms

- **Labels above inputs**, not inside as placeholders. Floating labels are clever but reduce scannability.
- **One column** unless fields are obviously paired (first or last name, city or state).
- **Generous input height:** `h-11` minimum, `h-12` for marketing forms.
- **Clear error states:** red border and helper text below. Never rely on color alone.
- **Visible required indicators**, not just hidden semantics.
- **Submit button:** full width on mobile, fixed width on desktop. Loading state during submission.

### Navigation

- **Sticky on scroll** with a background change (transparent to solid with subtle shadow or border).
- **Logo left, nav center or right, CTA far right.**
- **5 to 7 top level items max.** More belongs in a footer or mega menu.
- **Mobile:** hamburger toggle to full screen overlay or slide in drawer. Animation should feel snappy (150 to 200ms), not slow.
- **Active page indicator:** subtle underline or color change on the current route.

### Cards

- **Padding:** `p-6` for compact, `p-8` for spacious.
- **Border or shadow, not both** (unless intentional layered effect).
- **Internal hierarchy:** icon or image, heading, description, optional link or CTA.
- **Hover state on clickable cards:** subtle lift (`hover:-translate-y-0.5 transition`) or background shift, not both.

## Responsive Design

- **Mobile first.** Write base styles for mobile, then add `md:` and `lg:` overrides. Avoid `max-md:` patterns.
- **Breakpoints (Tailwind defaults):**
  - `sm` 640px (large phones)
  - `md` 768px (tablets)
  - `lg` 1024px (small laptops)
  - `xl` 1280px (large laptops)
  - `2xl` 1536px (large desktops)
- **Test these widths specifically:** 375px (iPhone SE), 414px (iPhone Pro Max), 768px (iPad portrait), 1024px (iPad landscape or small laptop), 1440px (standard desktop).
- **Common mobile mistakes:**
  - Text too small (use `text-base` minimum for body).
  - Tap targets too small (44x44px minimum).
  - Horizontal scroll due to fixed width elements (`overflow-x: hidden` is a band aid; fix the root cause).
  - Hero text that fits desktop but wraps badly on mobile (test mobile first).
- **Images:** use `next/image` with proper `sizes` attribute. For hero images, `priority` flag.

## Accessibility (the floor, not the ceiling)

- **Semantic HTML.** `<button>` for actions, `<a>` for navigation, `<h1>` to `<h6>` in correct order, `<nav>`, `<main>`, `<footer>`.
- **One `<h1>` per page.** Usually the hero headline.
- **Alt text on every image** that conveys meaning. Decorative images get `alt=""`.
- **Focus states visible** on all interactive elements. Never `outline: none` without a replacement.
- **Color contrast** meets WCAG AA (4.5:1 body, 3:1 large text and UI).
- **Keyboard navigable:** tab order should be logical, modals should trap focus, escape should close overlays.
- **Reduced motion:** wrap animations in `@media (prefers-reduced-motion: no-preference)` for non essential motion.

## Modern Aesthetic Conventions (2025 to 2026)

What current best in class marketing sites tend to do:

- **Restrained color, often near monochrome** with one bright accent.
- **Large, tight headlines** with `tracking-tight` and `leading-[1.05]`.
- **Subtle gradients** as backgrounds (radial, mesh) rather than flat colors.
- **Generous whitespace** between sections (`py-32` is not unusual).
- **Soft, layered shadows** instead of hard drop shadows.
- **Real product screenshots** (often in subtle device frames or floating) over illustrations.
- **Sans serif body, occasionally serif display** for editorial feel.
- **Subtle animation on scroll** (fade up, not bounce) using Framer Motion or CSS scroll driven animations. Sparingly.
- **Annotated visuals.** Screenshots with callouts and arrows pointing to features.
- **Logo strips with grayscale logos**, sometimes with hover to color.

What is dated:
- Hard drop shadows on every card.
- Skeuomorphic buttons with gradient, inner shadow, and border.
- Hero carousels.
- Stock photos of diverse people pointing at laptops.
- Comic Sans (still).

## Design References

When asked for design inspiration, suggest looking at:

- **Linear** (linear.app). Gold standard for B2B SaaS, restrained, premium.
- **Vercel** (vercel.com). Clean, technical, dark first.
- **Stripe** (stripe.com). Masterclass in marketing site polish.
- **Resend** (resend.com). Minimal, developer focused.
- **Apple** (apple.com). Bento grids, large typography.
- **Awwwards, SiteInspire, Land book, Refero.** Galleries for current trends.

When the user is designing for a specific industry, find 3 to 5 sites in that industry first and identify shared conventions before designing.

## Design Review Checklist

When reviewing existing design, score each:

1. **Hierarchy.** Can I tell what the page wants me to do in 3 seconds?
2. **Typography.** Are there 2 or fewer typefaces? Is the scale consistent? Are line lengths readable?
3. **Color.** Is there one clear accent? Does contrast pass WCAG AA?
4. **Spacing.** Is whitespace generous and consistent? Does the 8 point grid hold?
5. **CTAs.** Is the primary action obvious on every screen?
6. **Mobile.** Does it work at 375px without horizontal scroll or tiny tap targets?
7. **Above the fold.** Is the value prop and CTA visible without scrolling on a 1366x768 laptop?
8. **Consistency.** Are buttons, cards, headings styled the same across pages?
9. **Trust signals.** Are there testimonials, logos, or proof above the fold or close to it?
10. **Performance.** Are images optimized via `next/image`? Are fonts loaded via `next/font`?

Score each 1 to 10, sum, divide by 10. Report the score, then give the three highest leverage fixes.

## Process

When asked to design something:

1. **Ask first** if not given: who is the audience, what is the one action you want them to take, and what is the brand mood (premium, playful, technical, editorial)?
2. **Find references** that match the audience and mood. Three minimum.
3. **Establish the system first** (type scale, color tokens, spacing rules) before designing components.
4. **Build mobile first**, then desktop.
5. **Iterate the hero until it lands**, then everything else gets easier.
6. **Run the design review checklist** before declaring done.

## What NOT to do

- Do not design without knowing the audience and primary action.
- Do not introduce a third typeface "just for variety."
- Do not use more than one saturated accent color without a reason.
- Do not add carousels, parallax, or autoplay video without a measurable reason.
- Do not let aesthetics override conversion clarity.
- Do not invent custom Tailwind values when a token works (`p-[23px]` is a smell).
- Do not commit hex colors scattered through components. Define them once as CSS variables.
