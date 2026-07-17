# Example Site Style References

Aqui estão códigos fonte de sites exemplo (Pode se basear bastante e copiar o que achar possível para que nosso site fique tão bom quando esses): # Your workplace has the answer. Just ask Dala for it. — Style Reference > constellation floating on black velvet **Theme:** dark Dala operates as a dark-stage environment where black voids meet a single vivid violet accent, punctuated by amber sparks. Typography is monolithic and weightless — PPNeueMontreal at weight 400 dominates every heading at outsized scales (78–113px) with aggressive negative tracking, so headlines feel sculptural rather than informational. The visual centerpiece is a constellation of tiny multicolored triangular particles forming an organic brain shape, which acts as the brand's signature gesture: knowledge visualized as distributed intelligence rather than hierarchical data. Layout follows a spacious two-column rhythm — oversized left-aligned headlines paired with generous body copy, floating on pure black with no panels, borders, or cards. Components are intentionally reduced to their most essential form: one violet pill button, ghost text links, and large-format text blocks. ## Tokens — Colors | Name | Value | Token | Role | |------|-------|-------|------| | Void | #000000 | --color-void | Page canvas, section backgrounds, negative space — pure black is the dominant surface, not dark gray, creating the void that lets chromatic accents float | | Bone White | #ffffff | --color-bone-white | Headlines, body text, icon fills, nav active state — the only typographic color, carrying maximum hierarchy on black | | Ash Gray | #9a9a9a | --color-ash-gray | Muted nav text, ghost link color, secondary labels — recedes behind primary text without going invisible | | Silver Mist | #bdbdbd | --color-silver-mist | Tertiary body text, caption-level information — the quietest readable gray, for supporting context | | Electric Iris | #8052ff | --color-electric-iris | Primary action buttons, logo mark, brand accents — the single saturated violet that signals interactivity and brand identity against the black void | | Saffron Spark | #ffb829 | --color-saffron-spark | Highlight emphasis text, accent links, attention punctuation — warm yellow against violet creates the brand's chromatic tension | | Deep Verdant | #15846e | --color-deep-verdant | Secondary surface tint, logo gradient stop — appears as the deeper end of the brand gradient and in subtle accent washes | ## Tokens — Typography ### PPNeueMontreal — Single typeface across all UI contexts. Display sizes (78–113px) carry headlines at weight 400 with -0.04em tracking — the same weight as body text but massive scale creates hierarchy. Weight 200 (ultra-light) is reserved for 18px body copy, a signature choice: most AI/SaaS sites use 400 for body, but Dala strips weight to make paragraphs feel airy and non-aggressive. Weight 600 at 14px with 0.025em tracking and uppercase serves nav and small labels. The number 400 doing both 113px display and 15px body is unusual — it means the brand trusts scale, not weight, for hierarchy. · --font-ppneuemontreal - **Substitute:** Inter - **Weights:** 200, 400, 600, 700 - **Sizes:** 12, 14, 15, 18, 24, 27, 36, 42, 48, 78, 113px - **Line height:** 0.81, 0.90, 1.00, 1.10, 1.20, 1.25, 1.30, 1.50 - **Letter spacing:** -4.52px at 113px, -3.12px at 78px, -1.68px at 42px, -0.48px at 24px, normal at 18px body; 0.025em at 14px uppercase nav - **OpenType features:** "ss01" on - **Role:** Single typeface across all UI contexts. Display sizes (78–113px) carry headlines at weight 400 with -0.04em tracking — the same weight as body text but massive scale creates hierarchy. Weight 200 (ultra-light) is reserved for 18px body copy, a signature choice: most AI/SaaS sites use 400 for body, but Dala strips weight to make paragraphs feel airy and non-aggressive. Weight 600 at 14px with 0.025em tracking and uppercase serves nav and small labels. The number 400 doing both 113px display and 15px body is unusual — it means the brand trusts scale, not weight, for hierarchy. ### Type Scale | Role | Size | Line Height | Letter Spacing | Token | |------|------|-------------|----------------|-------| | caption | 12px | 1.5 | — | --text-caption | | nav-label | 14px | 1.2 | 0.35px | --text-nav-label | | body | 18px | 1.5 | — | --text-body | | heading-2xs | 24px | 1.25 | -0.48px | --text-heading-2xs | | heading-xs | 27px | 1 | — | --text-heading-xs | | subheading | 36px | 1.2 | — | --text-subheading | | heading-sm | 42px | 1.2 | -1.68px | --text-heading-sm | | heading | 48px | 1.1 | -1.68px | --text-heading | | heading-lg | 78px | 1.1 | -3.12px | --text-heading-lg | | display | 113px | 1.1 | -4.52px | --text-display | ## Tokens — Spacing & Shapes **Base unit:** 6px **Density:** comfortable ### Spacing Scale | Name | Value | Token | |------|-------|-------| | 6 | 6px | --spacing-6 | | 12 | 12px | --spacing-12 | | 18 | 18px | --spacing-18 | | 24 | 24px | --spacing-24 | | 30 | 30px | --spacing-30 | | 36 | 36px | --spacing-36 | | 60 | 60px | --spacing-60 | | 96 | 96px | --spacing-96 | | 120 | 120px | --spacing-120 | ### Border Radius | Element | Value | |---------|-------| | nav | 24px | | tags | 9999px | | cards | 24px | | buttons | 24px | ### Layout - **Page max-width:** 1280px - **Section gap:** 60-120px - **Card padding:** 24-38px - **Element gap:** 6-18px ## Components ### Primary Action Button **Role:** Filled violet pill, the sole interactive CTA Background #8052ff (Electric Iris), white text, 22.5px border-radius (pill), 14.4px vertical padding × 15.96px horizontal padding. PPNeueMontreal 14px weight 400 or 600, uppercase with 0.025em tracking. The high radius (22.5px on ~45px height) creates a full pill shape — soft, friendly, unmistakable as the primary action. ### Ghost Text Button **Role:** Underlined or bare text link, secondary action No background, no border, color #ffffff or #9a9a9a. PPNeueMontreal 14px weight 400. Used for nav items and inline links. The absence of any container means visual hierarchy comes entirely from type weight and tracking. ### Logo Lockup **Role:** Brand mark + wordmark in header Small triangular icon in #8052ff (violet) with a gradient fade through #15846 (teal), paired with 'Dala' wordmark in white. The icon is a stylized angular fragment — geometric, sharp-edged, echoing the triangular particles in the hero visualization. ### Team Member Card **Role:** Portrait + name + role display No background, no border, no shadow. Large rounded-rectangle portrait photo (~24px corner radius) with role label in 12px uppercase #8052ff and name in large white display type below. Social icons (Twitter, LinkedIn) appear as small inline glyphs. Cards float on the black canvas with only whitespace separation. ### Carousel Navigation Dot **Role:** Indicator for slide position in team/investor carousels Small filled circle ~8px diameter, #8052ff violet for active state. Inactive dots are dimmer or omitted. Padding is minimal — sits directly in the content flow without a container. ### Hero Constellation Visualization **Role:** Signature brand imagery — brain-shape particle cloud Thousands of tiny triangular glyphs (outlined, 1-2px) in a full spectrum of vivid colors (violet, amber, teal, magenta, blue) forming an organic brain or cloud shape against pure black. Individual particles are scattered/ambient across the surrounding space as well. This is the site's defining visual — not a static image but an animated field of point-lights. ### Section Headline Block **Role:** Oversized left-aligned headline + supporting copy Two-column asymmetric layout: headline at 78–113px weight 400 PPNeueMontreal in white with -0.04em tracking, occupying left half. Body copy at 18px weight 200 (ultra-light) in white or silver, with a small uppercase label (#ffb829 amber) above the body. No boxes, no borders — pure typographic composition on black. ### Navigation Bar **Role:** Top-aligned site navigation Transparent background sitting directly on black canvas. Logo left, nav links center/right (Manifesto, Team, Blog) in 14px uppercase PPNeueMontreal with 0.025em tracking. Active or hover state: white. Inactive: #9a9a9a. Request Access button (filled violet pill) anchors the right edge. No border, no backdrop blur on the nav itself. ### Ambient Particle Field **Role:** Decorative scattered triangle glyphs Small outlined triangles in various chromatic colors (#8052ff violet, #ffb829 amber, #15846 teal, plus assorted purples and blues) scattered at low opacity across the background outside the main constellation. Creates atmospheric depth without competing with the central visualization. ## Do's and Don'ts ### Do - Use #8052ff (Electric Iris) exclusively for filled action buttons — no other saturated color should appear as a button background - Set every headline at weight 400, never bold — Dala achieves hierarchy through scale (78–113px) and tracking (-0.04em), not font weight - Use PPNeueMontreal weight 200 for 18px body text — the ultra-light weight is a signature, do not substitute weight 400 - Maintain pure #000000 black as every section background — never use dark gray panels or card surfaces; the void is the design - Apply -0.04em letter-spacing on all display sizes 42px and above, converting to approximately -4.52px at 113px - Use 24px border-radius for buttons, cards, and nav elements as the consistent radius token — pill shapes only at very small sizes - Let the particle constellation be the only hero imagery — do not introduce photography, illustrations, or product screenshots into the hero region ### Don't - Do not use filled violet (#8052ff) for large background blocks or full sections — it is a button and accent color, not a surface - Do not set body text at weight 400 — Dala's signature ultra-light (200) body copy is what distinguishes the reading experience - Do not introduce card containers with borders, shadows, or background fills — elements float on black with whitespace alone - Do not use color #0000ee (default browser link blue) — never specify it; use #ffb829 amber or #ffffff for links - Do not add gradients to UI components — Dala's palette is flat; gradients belong only in the logo and the particle visualization - Do not use system fonts as substitutes when PPNeueMontreal-equivalent geometry matters — use Inter as fallback but preserve the weight 200 body and weight 400 headline convention - Do not place multiple filled buttons in proximity — the violet pill is reserved for singular primary actions per view ## Surfaces | Level | Name | Value | Purpose | |-------|------|-------|---------| | 0 | Void Canvas | #000000 | Full-page background, all section backgrounds, the base void | | 1 | Deep Verdant Tint | #15846 | Subtle accent surface for brand gradient and logo depth | | 2 | Electric Iris | #8052ff | Highest surface — filled buttons, active interactive elements only | ## Elevation Dala uses no shadows or elevation. All hierarchy is achieved through scale, color contrast, and whitespace on a flat black canvas. The absence of cards-with-shadows is deliberate — the void is the design, and any shadow would break the floating-in-space quality of the typography and particle constellation. ## Imagery Imagery is entirely procedural and abstract — no photography except team portraits. The signature visual is a dense cloud of thousands of tiny outlined triangular particles in a full vivid spectrum (violets, ambers, teals, magentas, blues) forming an organic brain/neural shape. This particle field is animated and acts as both hero art and brand identity. Surrounding ambient particles drift at lower density across the page background. Triangles are outlined, 1–2px stroke, sharp-edged, in saturated chromatic colors — never grayscale. Team portraits appear as large rounded-rectangle crops (24px radius) without frames or overlays. No product screenshots, no lifestyle photography, no 3D renders — the particle system IS the visual brand. ## Layout Full-bleed sections on pure black canvas, max content width ~1280px centered. Hero is a two-column asymmetric split: oversized left-aligned headline (113px) with body copy and CTA on the left half, particle brain visualization occupying the right half at massive scale. Subsequent sections alternate the two-column composition (visual-left/text-right, then text-left/visual-right) creating a zigzag reading rhythm. Section gaps are generous (60–120px vertical). No card grids, no pricing tables, no multi-column feature blocks — content lives in spacious two-column text+visual arrangements. Navigation is a minimal transparent top bar, no sidebar, no mega-menu. Density is extremely spacious — one or two elements per viewport, never information-dense. ## Agent Prompt Guide ## Quick Color Reference - Text: #ffffff (primary), #9a9a9a (secondary), #bdbdbd (tertiary) - Background: #000000 (canvas only) - Border: none — Dala uses no visible borders or dividers - Accent: #ffb829 (Saffron Spark) for emphasis highlights - primary action: #8052ff (filled action) ## Example Component Prompts 1. **Hero Section**: Full-bleed #000000 canvas. Two-column split. Left: headline at 78px PPNeueMontreal weight 400, #ffffff, letter-spacing -3.12px, reading 'Unlock collective wisdom.' Body copy at 18px weight 200 PPNeueMontreal, #ffffff, max-width 480px. Above body, a small uppercase label at 14px weight 600, #ffb829 amber, letter-spacing 0.35px. Below body, a filled violet pill button: #8052ff background, white text, 14px weight 600 uppercase, 22.5px border-radius, 14.4px vertical padding × 16px horizontal padding. Right: large particle constellation visualization (thousands of tiny colored triangles forming a brain shape). 2. **Section Headline + Body**: #000000 background. Left-aligned headline at 42px PPNeueMontreal weight 400, #ffffff, letter-spacing -1.68px. Supporting body text at 18px weight 200 PPNeueMontreal, #bdbdbd, max-width 520px. No boxes, no borders, no cards — text floats on void. 3. **Navigation Bar**: Transparent background on black. Left: small violet (#8052ff) triangular logo icon + 'Dala' wordmark in #ffffff 14px. Right: nav links 'Manifesto', 'Team', 'Blog' in 14px PPNeueMontreal weight 600, uppercase, 0.025em letter-spacing, color #9a9a9a (inactive) or #ffffff (active). Far right: filled violet pill 'Request Access' button — #8052ff background, white text, 22.5px radius, 14px weight 600 uppercase. 4. **Team Card**: No background, no border. Large portrait photo with 24px border-radius. Above name: role label 'CO FOUNDER & CTO' at 12px PPNeueMontreal weight 400, #8052ff, uppercase. Below photo: name 'Joel Kang' at 27px PPNeueMontreal weight 400, #ffffff. Social icons inline as small glyphs in #9a9a9a. 5. **Carousel Indicator**: Two small dots ~8px, filled #8052ff for active position, no background or border around the dot container. Sits centered below carousel content with 30px gap. ## Similar Brands - **Linear** — Same dark-void aesthetic with oversized weight-400 display type, generous whitespace, and a single saturated accent (violet/blue) reserved for action — both treat black as an active design material rather than a fallback - **Vercel** — Identical pattern: pure black canvas, geometric minimalism, single brand color, weight-400 typography at massive display sizes with aggressive negative tracking — both make black the hero - **Anthropic** — Dark mode-first philosophy with serif-free geometric sans, restrained color palette where one accent dominates, and a typographic system that trusts scale over weight for hierarchy - **Runway** — Dark void aesthetic with particle/constellation-style generative visuals as brand identity, combined with ultra-light body type and single vivid accent color for CTAs ## Quick Start ### CSS Custom Properties
:root {
/* Colors */
--color-void: #000000;
--color-bone-white: #ffffff;
--color-ash-gray: #9a9a9a;
--color-silver-mist: #bdbdbd;
--color-electric-iris: #8052ff;
--color-saffron-spark: #ffb829;
--color-deep-verdant: #15846e;
/* Typography — Font Families */
--font-ppneuemontreal: 'PPNeueMontreal', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
/* Typography — Scale */
--text-caption: 12px;
--leading-caption: 1.5;
--text-nav-label: 14px;
--leading-nav-label: 1.2;
--tracking-nav-label: 0.35px;
--text-body: 18px;
--leading-body: 1.5;
--text-heading-2xs: 24px;
--leading-heading-2xs: 1.25;
--tracking-heading-2xs: -0.48px;
--text-heading-xs: 27px;
--leading-heading-xs: 1;
--text-subheading: 36px;
--leading-subheading: 1.2;
--text-heading-sm: 42px;
--leading-heading-sm: 1.2;
--tracking-heading-sm: -1.68px;
--text-heading: 48px;
--leading-heading: 1.1;
--tracking-heading: -1.68px;
--text-heading-lg: 78px;
--leading-heading-lg: 1.1;
--tracking-heading-lg: -3.12px;
--text-display: 113px;
--leading-display: 1.1;
--tracking-display: -4.52px;
/* Typography — Weights */
--font-weight-extralight: 200;
--font-weight-regular: 400;
--font-weight-semibold: 600;
--font-weight-bold: 700;
/* Spacing */
--spacing-unit: 6px;
--spacing-6: 6px;
--spacing-12: 12px;
--spacing-18: 18px;
--spacing-24: 24px;
--spacing-30: 30px;
--spacing-36: 36px;
--spacing-60: 60px;
--spacing-96: 96px;
--spacing-120: 120px;
/* Layout */
--page-max-width: 1280px;
--section-gap: 60-120px;
--card-padding: 24-38px;
--element-gap: 6-18px;
/* Border Radius */
--radius-3xl: 24px;
--radius-full: 9999px;
/* Named Radii */
--radius-nav: 24px;
--radius-tags: 9999px;
--radius-cards: 24px;
--radius-buttons: 24px;
/* Surfaces */
--surface-void-canvas: #000000;
--surface-deep-verdant-tint: #15846;
--surface-electric-iris: #8052ff;
}
### Tailwind v4
@theme {
/* Colors */
--color-void: #000000;
--color-bone-white: #ffffff;
--color-ash-gray: #9a9a9a;
--color-silver-mist: #bdbdbd;
--color-electric-iris: #8052ff;
--color-saffron-spark: #ffb829;
--color-deep-verdant: #15846e;
/* Typography */
--font-ppneuemontreal: 'PPNeueMontreal', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
/* Typography — Scale */
--text-caption: 12px;
--leading-caption: 1.5;
--text-nav-label: 14px;
--leading-nav-label: 1.2;
--tracking-nav-label: 0.35px;
--text-body: 18px;
--leading-body: 1.5;
--text-heading-2xs: 24px;
--leading-heading-2xs: 1.25;
--tracking-heading-2xs: -0.48px;
--text-heading-xs: 27px;
--leading-heading-xs: 1;
--text-subheading: 36px;
--leading-subheading: 1.2;
--text-heading-sm: 42px;
--leading-heading-sm: 1.2;
--tracking-heading-sm: -1.68px;
--text-heading: 48px;
--leading-heading: 1.1;
--tracking-heading: -1.68px;
--text-heading-lg: 78px;
--leading-heading-lg: 1.1;
--tracking-heading-lg: -3.12px;
--text-display: 113px;
--leading-display: 1.1;
--tracking-display: -4.52px;
/* Spacing */
--spacing-6: 6px;
--spacing-12: 12px;
--spacing-18: 18px;
--spacing-24: 24px;
--spacing-30: 30px;
--spacing-36: 36px;
--spacing-60: 60px;
--spacing-96: 96px;
--spacing-120: 120px;
/* Border Radius */
--radius-3xl: 24px;
--radius-full: 9999px;
}
# ORYZO AI — Style Reference
> Darkroom product editorial. A lone object floating in warm darkness, cream typography the only decoration.
**Theme:** dark
The ORYZO visual system treats a single product object like a museum artifact: full-bleed warm-dark canvas, cream typography floating in generous negative space, and zero UI chrome competing with the form. Every text element is uppercase at weight 500, with the sole exception of body copy at 29px/400 which is the system's only conversational voice. A single vivid orange appears only for credit lines and the studio link — never for buttons or CTAs — earning its rarity. The layout alternates between two modes: photographic hero (the product in context with tools and materials) and void-mode reveal (the product isolated on warm dark), connected by hairline dashed dividers and pill-shaped controls.
## Tokens — Colors
| Name | Value | Token | Role |
|------|-------|-------|------|
| Warm Cream | `#ffedd7` | `--color-warm-cream` | Light text on dark surfaces, inverse labels, and high-contrast captions. |
| Walnut Shadow | `#100904` | `--color-walnut-shadow` | Page canvas and deepest background — warm near-black, not pure black. The void behind every product reveal |
| Bark Brown | `#382416` | `--color-bark-brown` | Elevated surface and filled button background — the one chromatic step above the canvas, used for the single solid CTA |
| Cork Border | `#40372e` | `--color-cork-border` | Hairline dividers, dashed section separators, subtle container borders — warmer than the canvas by one step |
| Driftwood | `#6c5f51` | `--color-driftwood` | Mid-tone warm gray for secondary dividers and muted structural elements — the bridge between Bark and Cream |
| Ember Accent | `#dc5000` | `--color-ember-accent` | Orange text accent for links, tags, and emphasized short phrases. |
| Pure Black | `#000000` | `--color-pure-black` | SVG icon fills and decorative vector elements only — never used as a background or text color |
## Tokens — Typography
### halyard-display-variable — The only typeface. Weight 500 at 51px drives display headlines with extreme uppercase confidence; the same family at weight 400 / 29px becomes the system's sole mixed-case body voice. Letter-spacing stays normal — the geometric forms do the work without tightening. Substitute: 'Inter', 'Söhne', or 'Neue Haas Grotesk' for close structural match. · `--font-halyard-display-variable`
- **Substitute:** Inter or Söhne
- **Weights:** 400, 500
- **Sizes:** 8, 10, 12, 14, 15, 18, 24, 29, 41, 51px
- **Line height:** 0.90–1.26
- **Letter spacing:** normal across all sizes — no negative tracking even at display scale, the font's geometry handles visual weight without compression
- **OpenType features:** `"ss01" on`
- **Role:** The only typeface. Weight 500 at 51px drives display headlines with extreme uppercase confidence; the same family at weight 400 / 29px becomes the system's sole mixed-case body voice. Letter-spacing stays normal — the geometric forms do the work without tightening. Substitute: 'Inter', 'Söhne', or 'Neue Haas Grotesk' for close structural match.
### Arial — System fallback for micro-legal labels (8px uppercase credits like "* ADOBE ILLUSTRATOR"). Not a design choice — a necessity for system-rendered disclaimers. · `--font-arial`
- **Substitute:** system-ui
- **Weights:** 400, 500
- **Sizes:** 8px
- **Line height:** 1.20
- **Role:** System fallback for micro-legal labels (8px uppercase credits like "* ADOBE ILLUSTRATOR"). Not a design choice — a necessity for system-rendered disclaimers.
### Type Scale
| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| subheading | 18px | 1 | — | `--text-subheading` |
| heading-sm | 24px | 1.09 | — | `--text-heading-sm` |
| body | 29px | 1.26 | — | `--text-body` |
| heading | 41px | 0.9 | — | `--text-heading` |
| display | 51px | 0.9 | — | `--text-display` |
## Tokens — Spacing & Shapes
**Density:** comfortable
### Spacing Scale
| Name | Value | Token |
|------|-------|-------|
| 6 | 6px | `--spacing-6` |
| 8 | 8px | `--spacing-8` |
| 9 | 9px | `--spacing-9` |
| 10 | 10px | `--spacing-10` |
| 12 | 12px | `--spacing-12` |
| 14 | 14px | `--spacing-14` |
| 18 | 18px | `--spacing-18` |
| 24 | 24px | `--spacing-24` |
| 31 | 31px | `--spacing-31` |
| 41 | 41px | `--spacing-41` |
| 45 | 45px | `--spacing-45` |
| 68 | 68px | `--spacing-68` |
| 204 | 204px | `--spacing-204` |
### Border Radius
| Element | Value |
|---------|-------|
| cards | 12px |
| inputs | 0px |
| full-round | 9999px |
| buttons-pill | 36px |
| buttons-outlined | 22.5px |
### Layout
- **Card padding:** 24px
- **Element gap:** 18px
## Components
### Pill Button (Filled)
**Role:** Primary solid CTA — used once on the page for the Lusion studio link
36px border-radius, Bark Brown (#382416) background, Warm Cream (#ffedd7) text, 14px 24px vertical/horizontal padding, weight 500, uppercase, 8–14px size. The only filled action surface in the system — its rarity is the signal.
### Outlined Ghost Button
**Role:** Secondary action or decorative button — cream border on transparent fill
22.5px border-radius, transparent background, 1px Warm Cream border, Warm Cream text, 7.5px vertical padding, 0px horizontal padding, weight 500, uppercase, 8–14px. Border does the work; no fill needed.
### Underline Text Link
**Role:** Inline links and navigation items — borderless, relying on underline
0px radius, transparent background, Warm Cream text, 0px padding, weight 500, uppercase, 12–14px. The default interaction — no container, just text with an underline indicator.
### Input Field (Underline Only)
**Role:** Minimal form input — bottom border only, no full outline
0px radius, transparent background, 1px Warm Cream bottom border, Warm Cream text, 1px 2px padding, 36px right padding for an inline action. The form mirrors the ghost-button restraint — no boxes, just a line.
### Fixed Top Navigation
**Role:** Persistent site navigation — minimal, 4 items, uppercase micro-type
Logo wordmark "ORYZO" left-aligned in Warm Cream at 12–14px weight 500 uppercase. Right-aligned nav items: INTRO (with dashed underline indicator for active), FEATURES, PRODUCT, CONTACT — all 12px weight 500 uppercase, Warm Cream. Transparent background over the hero photograph.
### Vertical Sidebar Label
**Role:** Edge branding — vertical text running down the right margin
Rotated 90° text "ORYZO 1-MODEL" in Warm Cream, 10–12px uppercase, sits flush right. Functions as a product serial number — a physical-product artifact translated to UI.
### Logo Wordmark
**Role:** Brand identifier — the only graphical mark
"ORYZO" in Halyard Display Variable weight 500 uppercase, up to 51px+ at display scale with 0.9 line-height. Used at two sizes: navigation lockup (12–14px) and hero lockup (51px+). No icon, no symbol — pure typographic identity.
### Hero Overlay Info Card
**Role:** Semi-transparent attribution card in the hero
12px border-radius, semi-transparent Warm Cream or dark fill with low opacity, contains uppercase heading "DESIGNED BY LUSION, THE AWARD-WINNING DESIGN STUDIO." plus a dashed divider and body text. Overlays the hero photograph bottom-left.
### Product Reveal Section
**Role:** Full-viewport void-mode section — centered 3D render with flanking text
100vh height, Walnut Shadow (#100904) background, centered 3D product render, left-aligned heading at 41px uppercase "ISN'T JUST A COASTER.", right-aligned body copy at 29px weight 400 mixed-case. The signature layout pattern — three columns, generous gutters.
### Section Divider (Dashed Hairline)
**Role:** Visual separator between content blocks
1px dashed line in Cork Border (#40372e) or Driftwood (#6c5f51). Used sparingly between text blocks, never as decoration — always carrying structural meaning.
### Video Thumbnail Card
**Role:** Embedded video preview with play indicator
Small rectangular card, 12px radius, positioned in the lower-right of the hero. Contains a miniature ORYZO wordmark and a play icon. Functions as a secondary entry point without competing with the primary CTA.
### Legal/Disclaimer Text
**Role:** System-rendered micro-copy in Arial 8px
Fallback font (Arial 8px weight 500 uppercase) for things like "* ADOBE ILLUSTRATOR" footnotes. Visually subordinate — intentionally uses a different typeface to signal "this is not design, this is compliance."
## Do's and Don'ts
### Do
- Set all UI text in #ffedd7 (Warm Cream) — never use pure #fff; the warm tint is the system's signature.
- Use #dc5000 (Ember) only for credit lines, the "Built by" label, and the Lusion studio link — a single accent earns its rarity through restraint.
- Set type in uppercase weight 500 across the entire interface; use weight 400 / mixed case only for the 29px body copy that explains the product.
- Use 36px border-radius for the one filled CTA and 22.5px for outlined ghost buttons; 12px for cards; 0px for inputs and inline links — these four values are the entire radius vocabulary.
- Set section gaps at 100vh — each section gets its own full viewport, never compress product reveals into bands.
- Use 1px dashed lines in #40372 for section dividers; avoid solid dividers and avoid any divider thicker than 2px.
- Center the 3D product render in every void-mode section with text flanking symmetrically left and right at 18px gutters.
### Don't
- Never use pure #fff for text or #000 for backgrounds — the warm cream and walnut shadow are the system; purity reads as wrong here.
- Never apply #dc5000 to buttons, CTAs, or interactive surfaces — the orange is editorial credit only.
- Never use lowercase or sentence-case for headings, nav, or labels; the only mixed-case text is the 29px body description.
- Never add drop shadows to cards, buttons, or sections — depth comes from the two-step surface stack (#100904 → #382416), not from blur.
- Never use border-radius below 12px on containers — the geometry is deliberately chunky, not sharp.
- Never use more than one filled button per section; restraint is the design language.
- Never center-align body copy — headings and body text are always left-aligned, even when flanking a centered image.
## Surfaces
| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Walnut Shadow | `#100904` | Full-bleed page canvas and section background |
| 1 | Bark Brown | `#382416` | Filled button surface, the only elevated solid |
| 2 | Cork Border | `#40372` | Hairline borders, dashed dividers, card outlines |
| 3 | Warm Cream | `#ffedd7` | Foreground text, navigation, interactive borders |
## Elevation
The system rejects shadow-based elevation entirely. Depth is achieved through a two-step surface stack: #100904 (canvas) → #382416 (elevated solid). There are no blur, no offset, no opacity-based shadows — only a 1–2 value luminance step. This keeps the interface flat and editorial, letting the 3D product renders provide all visual depth in void-mode sections.
## Imagery
Photography is editorial, top-down, and in-context: the cork coaster sits on a green cutting mat surrounded by pencils, a craft knife, and a paperclip — tools of the craft visible in frame. The green cutting mat (#445231) is a hero-only element, not a UI token. 3D renders dominate the product reveal sections: the cork coaster is shown isolated against Walnut Shadow, lit from the upper right with a warm rim light, rotating from top-down to 3/4 angle between sections. No lifestyle photography, no people, no stock imagery — the object is the hero and the tools are its context. Images are full-bleed, sharp-edged (no rounded masks), and treated with high contrast and warm grading.
## Layout
Full-bleed throughout — no max-width container, every section spans 100vw. Hero: full-viewport top-down photograph with a massive ORYZO wordmark (51px+) in the upper-left, tagline above, fixed minimal nav upper-right, vertical sidebar label running down the right edge, semi-transparent info card lower-left, video thumbnail lower-right. Subsequent sections: full-viewport Walnut Shadow canvas with a centered 3D product render flanked by left-aligned heading and right-aligned body copy — a three-column grid (text / object / text) with generous 18px gutters. Section transitions are seamless dark-on-dark; the only breaks are hairline dashed dividers. Navigation is fixed, transparent, and 4 items max. No sidebar, no footer chrome, no cards-within-cards — every screen is a single statement.
## Typography Voice
The system has exactly two typographic modes:
1. UPPERCASE WEIGHT 500 — the default for everything: nav, headings, labels, links, button text, legal. The voice is declarative, confident, museum-label. Sizes range from 8px (legal) to 51px (display). Line-height tightens with size: 1.2 at caption, 1.0 at body-sm, 0.9 at display. No letter-spacing adjustment — the font's geometry is tight enough at every scale.
2. MIXED CASE WEIGHT 400 — the exception, used only at 29px for the descriptive body copy that explains the product. This is the system's only conversational voice: "Designed to lift, insulate, and grip in all the right ways. Oryzo makes the simplest moment feel considered." The weight drop and case change are the signal — when the text shifts from 500/UPPER to 400/mixed, the user knows they are reading description, not label.
The bold signature: line-height 0.9 at 41–51px display sizes. This is unusually tight — most editorial sites use 1.0–1.1. At 0.9, the uppercase letterforms overlap their line-height bounds, creating a sculptural block effect. The display type doesn't sit in lines; it stacks as solid form.
## Agent Prompt Guide
## Quick Color Reference
- text: #ffedd7 (Warm Cream)
- background: #100904 (Walnut Shadow)
- surface: #382416 (Bark Brown)
- border: #40372e (Cork Border)
- accent: #dc5000 (Ember)
- primary action: no distinct CTA color
## 3-5 Example Component Prompts
1. **Hero Lockup:** Full-bleed Walnut Shadow (#100904) canvas. ORYZO wordmark at 51px Halyard Display Variable weight 500 uppercase, line-height 0.9, color #ffedd7, positioned upper-left with 24px margin. Tagline "MADE FOR MUGS, BUILT FOR TABLES." at 12px weight 500 uppercase above the wordmark, also #ffedd7.
No distinct primary action color was observed; use the extracted neutral button treatments instead of inventing a filled CTA color.
3. **Ghost Outline Button:** Transparent background, 1px Warm Cream (#ffedd7) border, 22.5px border-radius, 7.5px vertical padding, Warm Cream text at 12px weight 500 uppercase. The secondary action vocabulary.
4. **Product Reveal Section:** Full-viewport (100vh) Walnut Shadow (#100904) background. Centered 3D product render occupying the middle 40% of width. Left column: heading "ISN'T JUST A COASTER." at 41px weight 500 uppercase, line-height 0.9, #ffedd7, left-aligned. Right column: body copy at 29px weight 400 mixed-case, line-height 1.26, #ffedd7, left-aligned within the column. 18px gutter between the centered object and each text column.
5. **Top Navigation:** Fixed position, transparent background, full-width. Left: ORYZO wordmark at 12px Halyard weight 500 uppercase #ffedd7. Right: four nav items (INTRO, FEATURES, PRODUCT, CONTACT) at 12px weight 500 uppercase #ffedd7, with a 1px dashed #40372e underline beneath the active item.
## Similar Brands
- **Lusion (the studio credited in the design)** — Same warm-dark editorial canvas, single-product hero treatment, pill-button controls, and 3D product renders as the visual centerpiece
- **Active Theory** — Full-bleed dark mode with a single interactive 3D object commanding the viewport, minimal UI chrome, and oversized uppercase type
- **Resn** — Editorial product-showcase sites with top-down craft photography, warm grading, and typography that steps back to let the object speak
- **Tool of North America** — Studio portfolio sites that treat a single concept object with museum-presentation gravity — dark void, cream labels, generous negative space
- **Buck (studio)** — Work-reveal layouts that alternate between photographic context and isolated product renders against near-black backgrounds
## Quick Start
### CSS Custom Properties
```css
:root {
/* Colors */
--color-warm-cream: #ffedd7;
--color-walnut-shadow: #100904;
--color-bark-brown: #382416;
--color-cork-border: #40372e;
--color-driftwood: #6c5f51;
--color-ember-accent: #dc5000;
--color-pure-black: #000000;
/* Typography — Font Families */
--font-halyard-display-variable: 'halyard-display-variable', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-arial: 'Arial', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
/* Typography — Scale */
--text-subheading: 18px;
--leading-subheading: 1;
--text-heading-sm: 24px;
--leading-heading-sm: 1.09;
--text-body: 29px;
--leading-body: 1.26;
--text-heading: 41px;
--leading-heading: 0.9;
--text-display: 51px;
--leading-display: 0.9;
/* Typography — Weights */
--font-weight-regular: 400;
--font-weight-medium: 500;
/* Spacing */
--spacing-6: 6px;
--spacing-8: 8px;
--spacing-9: 9px;
--spacing-10: 10px;
--spacing-12: 12px;
--spacing-14: 14px;
--spacing-18: 18px;
--spacing-24: 24px;
--spacing-31: 31px;
--spacing-41: 41px;
--spacing-45: 45px;
--spacing-68: 68px;
--spacing-204: 204px;
/* Layout */
--card-padding: 24px;
--element-gap: 18px;
/* Border Radius */
--radius-xl: 12px;
--radius-2xl: 22.5px;
--radius-3xl: 36px;
--radius-full: 9999px;
/* Named Radii */
--radius-cards: 12px;
--radius-inputs: 0px;
--radius-full-round: 9999px;
--radius-buttons-pill: 36px;
--radius-buttons-outlined: 22.5px;
/* Surfaces */
--surface-walnut-shadow: #100904;
--surface-bark-brown: #382416;
--surface-cork-border: #40372;
--surface-warm-cream: #ffedd7;
}
### Tailwind v4
@theme {
/* Colors */
--color-warm-cream: #ffedd7;
--color-walnut-shadow: #100904;
--color-bark-brown: #382416;
--color-cork-border: #40372e;
--color-driftwood: #6c5f51;
--color-ember-accent: #dc5000;
--color-pure-black: #000000;
/* Typography */
--font-halyard-display-variable: 'halyard-display-variable', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-arial: 'Arial', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
/* Typography — Scale */
--text-subheading: 18px;
--leading-subheading: 1;
--text-heading-sm: 24px;
--leading-heading-sm: 1.09;
--text-body: 29px;
--leading-body: 1.26;
--text-heading: 41px;
--leading-heading: 0.9;
--text-display: 51px;
--leading-display: 0.9;
/* Spacing */
--spacing-6: 6px;
--spacing-8: 8px;
--spacing-9: 9px;
--spacing-10: 10px;
--spacing-12: 12px;
--spacing-14: 14px;
--spacing-18: 18px;
--spacing-24: 24px;
--spacing-31: 31px;
--spacing-41: 41px;
--spacing-45: 45px;
--spacing-68: 68px;
--spacing-204: 204px;
/* Border Radius */
--radius-xl: 12px;
--radius-2xl: 22.5px;
--radius-3xl: 36px;
--radius-full: 9999px;
}
# Vivid+Co — Style Reference > prismatic light through obsidian **Theme:** dark Vivid+Co operates in a cinematic dark void: near-black canvas at #101010–#495764, punctuated by a single near-white off-white (#fffdf9) used for nearly all type and UI chrome. Typography is overwhelmingly Neue Montreal weight 400 — a deliberate refusal of bold, where authority comes from sheer scale (136px and 105px display) rather than weight. The signature device is the chromatic-prism hero rendering: RGB-split blocks of saturated red/green/blue light bleeding through glass cubes, breaking an otherwise monochrome surface. Layout is centered and roomy; nav, body, and links all wear the same #fffdf9 color with no separate accent button, no fills, and zero shadows — differentiation happens through spacing, scale, and the rainbow artifact that acts as the brand's only chromatic voice. ## Tokens — Colors | Name | Value | Token | Role | |------|-------|-------|------| | Bone White | #fffdf9 | --color-bone-white | Primary text, nav labels, link color, heading fill — the near-white that occupies every typographic surface across the dark canvas | | Obsidian | #101010 | --color-obsidian | Page canvas, background fill for hero and section bands — the deep black the prism artifact sits inside | | Graphite Veil | #495764 | --color-graphite-veil | Dominant surface behind headings and content blocks — a cool dark slate that gives the canvas depth without flat black | | Ash Border | #403f3f | --color-ash-border | Hairline divider and card outline — barely visible, used at 1px to separate rows without competing with type | | Fog Blue | #6f879c | --color-fog-blue | Muted secondary text and ghost-button labels (3.7:1 contrast) — service-category labels like Strategy, Creative, Communications + marketing read as de-emphasized metadata | | Pure Black | #000000 | --color-pure-black | Decorative SVG icon and illustration fill — used in the prism artwork and icon glyphs; not a background | | Prism Red | #ff2a2a | --color-prism-red | Chromatic dispersion accent — one channel of the RGB-split prism hero artifact; appears only inside the brand illustration, not as a UI token | | Prism Cyan | #2a7fff | --color-prism-cyan | Chromatic dispersion accent — blue channel of the RGB-split prism, paired with red and green to create the signature caustics effect | | Prism Lime | #2aff2a | --color-prism-lime | Chromatic dispersion accent — green channel of the RGB-split prism artifact | ## Tokens — Typography ### Neue Montreal — Exclusive typeface across all UI — heading, body, nav, button, link, footer. Weight 400 is the default; weight 700 is reserved for 36px subheadings only. Display headlines at 105px and 136px carry line-height 1.00–1.01 with -0.02em tracking, producing cinematic stacked headlines that read as sculptural rather than typographic. · --font-neue-montreal - **Substitute:** Söhne, Inter, General Sans - **Weights:** 400, 700 - **Sizes:** 14, 15, 17, 18, 20, 21, 22, 32, 33, 36, 56, 105, 136 - **Line height:** 1.00–1.50 - **Letter spacing:** -0.02em at 136px display, -0.01em at 33–56px headings, +0.01em at 15–21px body, +0.02em at 17px uppercase labels - **OpenType features:** "ss01" on - **Role:** Exclusive typeface across all UI — heading, body, nav, button, link, footer. Weight 400 is the default; weight 700 is reserved for 36px subheadings only. Display headlines at 105px and 136px carry line-height 1.00–1.01 with -0.02em tracking, producing cinematic stacked headlines that read as sculptural rather than typographic. ### Type Scale | Role | Size | Line Height | Letter Spacing | Token | |------|------|-------------|----------------|-------| | caption | 15px | 1.2 | 0.15px | --text-caption | | body-sm | 18px | 1.5 | — | --text-body-sm | | body | 20px | 1.2 | -0.2px | --text-body | | body-lg | 22px | 1.2 | -0.22px | --text-body-lg | | heading-sm | 33px | 1.2 | -0.33px | --text-heading-sm | | heading | 36px | 1.5 | — | --text-heading | | heading-lg | 56px | 1.13 | -0.56px | --text-heading-lg | | display-sm | 105px | 1.01 | -2.1px | --text-display-sm | | display | 136px | 1 | -2.72px | --text-display | ## Tokens — Spacing & Shapes **Base unit:** 4px **Density:** comfortable ### Spacing Scale | Name | Value | Token | |------|-------|-------| | 16 | 16px | --spacing-16 | | 20 | 20px | --spacing-20 | | 40 | 40px | --spacing-40 | | 56 | 56px | --spacing-56 | | 60 | 60px | --spacing-60 | | 64 | 64px | --spacing-64 | | 72 | 72px | --spacing-72 | | 108 | 108px | --spacing-108 | ### Border Radius | Element | Value | |---------|-------| | nav | 5px | | tags | 9999px | | cards | 15px | | buttons | 0px | ### Layout - **Page max-width:** 1440px - **Section gap:** 108px - **Card padding:** 20px - **Element gap:** 7px ## Components ### Ghost Nav Button **Role:** Primary navigation item (EXPERTISE, WORK, TEAM, CAREERS) Transparent fill, #fffdf9 text, 0px radius, no padding, uppercase Neue Montreal 14–15px. No underline, no border — letterforms alone carry identification. ### Outlined Contact Button **Role:** Sole outlined call-to-action in the nav Transparent fill, 1px solid #fffdf9 border, 5px radius, padding 9px 15px, uppercase 14px #fffdf9 text. The only bordered element in the header. ### Ghost Service Label **Role:** Service-category metadata (Strategy, Creative, Communications + marketing) Transparent fill, #6f879c text, 0px radius, 20px padding-top, 30px padding-bottom, 20px Neue Montreal. Reads as de-emphasized taxonomy — sits below case-study titles. ### Display Headline Block **Role:** Hero statement (We are Storytellers..., Putting the pieces together...) Neue Montreal weight 400 at 105–136px, line-height 1.00, letter-spacing -0.02em, color #fffdf9. Stacks across multiple lines; occupies 50–60% of viewport height. No font-weight override — scale alone creates hierarchy. ### Hero Lead Paragraph **Role:** Subtitle below display headline Neue Montreal 400 at 18–22px, line-height 1.5, #fffdf9, max-width ~440px. Aligns left beneath the prism artifact, never full-width. ### Prism Artifact **Role:** Signature brand illustration — glass-cube array with RGB-split caustics Four to six glass cubes arranged in a staggered cluster, rendered with #000000 cores, #fffdf9 specular highlights, and red/cyan/green channel-offset edges that bleed saturated color. No shadow — the chromatic dispersion is the visual depth. ### Section Heading **Role:** In-section statement (Building brand value is our singular mission.) Neue Montreal 400 at 18–22px, #fffdf9, max-width ~440px, left-aligned above the larger display headline that follows. ### Footer Hairline Divider **Role:** 1px separator above footer copy 1px solid #403f3f line, full-width, 15px margin-top. The only border-color token used in the system. ### Case Study Title Link **Role:** Project/work listing headline Neue Montreal 400 at 33px, #fffdf9, letter-spacing -0.01em, line-height 1.2. Hover state likely color-shifts to #6f879c — no underline, no background change. ### Eyebrow Label **Role:** Section opener or category tag (uppercase) Neue Montreal 400 at 32px or 17px, uppercase, line-height 1.01–1.5, letter-spacing +0.02em at 17px. All-caps treatment without weight 700 — restraint over shouting. ### Rounded Pill Tag **Role:** Sole radius-9999px element — possibly a status indicator or metadata chip 9999px border-radius, 15px radius also appears for card corners. Used sparingly; most of the UI is square-edged. ## Do's and Don'ts ### Do - Use #fffdf9 for all text and interactive elements on the dark canvas — never introduce a second text color unless it is #6f879c for de-emphasized metadata. - Let scale carry hierarchy: pair 136px display with 18px body at a 7.5× ratio rather than bolding the body to compensate. - Hold Neue Montreal weight 400 as the default; reserve weight 700 exclusively for 36px subheadings. - Set display headlines at line-height 1.00–1.01 and -0.02em letter-spacing so multi-line stacks feel sculptural. - Use 0px border-radius for buttons and most cards — the prism artwork supplies all the visual softness the system needs. - Center hero compositions vertically and horizontally, leaving ~50% viewport height for the headline block. - Apply the prism artifact at full scale as the only chromatic element; never dilute it with accent buttons or colored badges. ### Don't - Don't introduce filled buttons, gradients, or saturated action colors — the system has no distinct primary action color and the nav's outlined Contact button is the only bordered UI element. - Don't use weight 600–800 for headlines; authority comes from size (105–136px), not stroke weight. - Don't apply box-shadows to cards or nav — depth comes from the Prism artifact and the slate-to-black canvas gradient. - Don't add line-heights above 1.5 to display sizes; the tight 1.00–1.01 leading at 136px is a signature. - Don't use letter-spacing looser than -0.01em on any size above 22px — the tracking is intentionally tight. - Don't split the prism colors into separate UI tokens — RGB red/cyan/green only exist inside the artifact. - Don't lighten the canvas past #495764 or the slate-to-black contrast that makes #fffdf9 type read will collapse. ## Surfaces | Level | Name | Value | Purpose | |-------|------|-------|---------| | 0 | Obsidian Canvas | #101010 | Deepest page background — hero void, full-bleed sections | | 1 | Graphite Veil | #495764 | Primary content surface — content bands sit on this slightly lighter slate | | 2 | Bone Card | #fffdf9 | Rare inverted cards (when used) — near-white surface that flips the type to dark | ## Elevation Flat by design. The system uses zero box-shadows — depth is implied solely through the contrast between #101010, #495764, and the Prism artifact's chromatic edges. Borders are 1px solid at #403f3f and only used for the Contact button and footer divider. Elevation is non-existent because the prism artwork is the only element that needs to feel three-dimensional. ## Imagery Single hero artifact dominates: an abstract 3D rendering of glass cubes with RGB-split chromatic aberration edges. No photography, no human imagery, no product shots. The prism IS the brand image — everything else is monochrome typography on dark canvas. Iconography is minimal: thin-line navigation labels and a small cursor/glyph accent (area 142765) at the end of one headline suggest a single 16px monoline icon. No illustrations, no decorative patterns, no textures. ## Layout Full-bleed dark canvas with a single max-width ~1440px content column. Hero pattern: centered prism artifact with overlapping headline (text crosses the cubes) and left-aligned subtitle beneath. Navigation sits in a thin top bar with the wordmark left, four ghost links right, and an outlined Contact button terminating the row. Section rhythm alternates between full-viewport-height hero panels and narrower content bands at ~108px gaps. Content arrangement is asymmetric: the prism artifact anchors the visual center while headlines wrap around it. Single-column text blocks max out around 440px width; no multi-column grids, no card matrices, no pricing tables. Footer is a thin hairline-divided band with two columns of metadata. ## Agent Prompt Guide Quick Color Reference: - text: #fffdf9 - background: #101010 (canvas) / #495764 (surface) - border: #403f3f (hairline) / #fffdf9 (button only) - muted text: #6f879c - accent: #ff2a2a / #2a7fff / #2aff2a (prism only — never on UI) - primary action: no distinct CTA color Example Component Prompts: 1. Hero section: #101010 canvas filling viewport. Prism artifact (4–6 glass cubes with #000000 cores and RGB-split #ff2a2a/#2a7fff/#2aff2a edges) centered at ~40% width. Headline 'We are Storytellers Strat egists Crea tives Market ers Tech nologists' at 136px Neue Montreal weight 400, #fffdf9, line-height 1.00, letter-spacing -2.72px, wrapping across the cubes. Subtitle at 22px weight 400 #fffdf9, max-width 440px, left-aligned below. 2. Ghost navigation button: transparent fill, #fffdf9 text, uppercase Neue Montreal 14px, 0px radius, 0px padding. Hover transitions color only via 0.5s cubic-bezier(0.52,0.01,0,1). 3. Outlined Contact button: transparent fill, 1px solid #fffdf9 border, 5px radius, 9px 15px padding, uppercase 14px #fffdf9 text. Only bordered element in the header. 4. Case-study title link: Neue Montreal 400 at 33px, #fffdf9, letter-spacing -0.33px, line-height 1.2, no underline. Below it a Fog Blue (#6f879c) service label at 20px with 20px padding-top and 30px padding-bottom. 5. Footer divider: 1px solid #403f3f line, full-width, 15px margin-top. Footer metadata at 14–18px #fffdf9 in a two-column row. ## Motion Philosophy Expressive but restrained. Default duration 0.5s with ease for most transitions, but the signature curve cubic-bezier(0.52, 0.01, 0, 1) (150 occurrences) drives all meaningful state changes — a slow start and decisive stop, like optical focus pulling. Transform and opacity carry 90% of transitions; border-color and color handle the remaining 10%. One named animation kVfqLU runs at 6.65s — likely the prism artifact's slow chromatic shimmer. Avoid springs, bounces, or scale-pop effects; the system's confidence reads through stillness, not motion. ## Similar Brands - **Giant Ant** — Same monochrome-dark-canvas agency treatment with oversized weight-400 display type and zero filled buttons - **Resn** — Both rely on a single signature 3D artifact as the brand image and pair it with near-white type on near-black canvas - **Active Theory** — Dark-mode creative-agency homepage with chromatic-aberration glass rendering and minimal nav - **Ueno** — Single-typeface agency site at 400 weight, cinematic dark canvas, and restraint as a design philosophy - **Locomotive** — Dark creative agency with oversized display headlines, no filled CTAs, and an outlined contact button as the only bordered element ## Quick Start ### CSS Custom Properties
:root {
/* Colors */
--color-bone-white: #fffdf9;
--color-obsidian: #101010;
--color-graphite-veil: #495764;
--color-ash-border: #403f3f;
--color-fog-blue: #6f879c;
--color-pure-black: #000000;
--color-prism-red: #ff2a2a;
--color-prism-cyan: #2a7fff;
--color-prism-lime: #2aff2a;
/* Typography — Font Families */
--font-neue-montreal: 'Neue Montreal', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
/* Typography — Scale */
--text-caption: 15px;
--leading-caption: 1.2;
--tracking-caption: 0.15px;
--text-body-sm: 18px;
--leading-body-sm: 1.5;
--text-body: 20px;
--leading-body: 1.2;
--tracking-body: -0.2px;
--text-body-lg: 22px;
--leading-body-lg: 1.2;
--tracking-body-lg: -0.22px;
--text-heading-sm: 33px;
--leading-heading-sm: 1.2;
--tracking-heading-sm: -0.33px;
--text-heading: 36px;
--leading-heading: 1.5;
--text-heading-lg: 56px;
--leading-heading-lg: 1.13;
--tracking-heading-lg: -0.56px;
--text-display-sm: 105px;
--leading-display-sm: 1.01;
--tracking-display-sm: -2.1px;
--text-display: 136px;
--leading-display: 1;
--tracking-display: -2.72px;
/* Typography — Weights */
--font-weight-regular: 400;
--font-weight-bold: 700;
/* Spacing */
--spacing-unit: 4px;
--spacing-16: 16px;
--spacing-20: 20px;
--spacing-40: 40px;
--spacing-56: 56px;
--spacing-60: 60px;
--spacing-64: 64px;
--spacing-72: 72px;
--spacing-108: 108px;
/* Layout */
--page-max-width: 1440px;
--section-gap: 108px;
--card-padding: 20px;
--element-gap: 7px;
/* Border Radius */
--radius-md: 5px;
--radius-xl: 15px;
--radius-full: 9999px;
/* Named Radii */
--radius-nav: 5px;
--radius-tags: 9999px;
--radius-cards: 15px;
--radius-buttons: 0px;
/* Surfaces */
--surface-obsidian-canvas: #101010;
--surface-graphite-veil: #495764;
--surface-bone-card: #fffdf9;
}
### Tailwind v4
@theme {
/* Colors */
--color-bone-white: #fffdf9;
--color-obsidian: #101010;
--color-graphite-veil: #495764;
--color-ash-border: #403f3f;
--color-fog-blue: #6f879c;
--color-pure-black: #000000;
--color-prism-red: #ff2a2a;
--color-prism-cyan: #2a7fff;
--color-prism-lime: #2aff2a;
/* Typography */
--font-neue-montreal: 'Neue Montreal', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
/* Typography — Scale */
--text-caption: 15px;
--leading-caption: 1.2;
--tracking-caption: 0.15px;
--text-body-sm: 18px;
--leading-body-sm: 1.5;
--text-body: 20px;
--leading-body: 1.2;
--tracking-body: -0.2px;
--text-body-lg: 22px;
--leading-body-lg: 1.2;
--tracking-body-lg: -0.22px;
--text-heading-sm: 33px;
--leading-heading-sm: 1.2;
--tracking-heading-sm: -0.33px;
--text-heading: 36px;
--leading-heading: 1.5;
--text-heading-lg: 56px;
--leading-heading-lg: 1.13;
--tracking-heading-lg: -0.56px;
--text-display-sm: 105px;
--leading-display-sm: 1.01;
--tracking-display-sm: -2.1px;
--text-display: 136px;
--leading-display: 1;
--tracking-display: -2.72px;
/* Spacing */
--spacing-16: 16px;
--spacing-20: 20px;
--spacing-40: 40px;
--spacing-56: 56px;
--spacing-60: 60px;
--spacing-64: 64px;
--spacing-72: 72px;
--spacing-108: 108px;
/* Border Radius */
--radius-md: 5px;
--radius-xl: 15px;
--radius-full: 9999px;
}
``` Ajuste todos esses efeitos conforme achar necessário e gaste quantos tokens precisar, o site precisa ficar impecável. O site final deve ficar parecido com os que adicionei anexo em questão de funcionalidade e efeitoes especiais Gaste quanto tempo precisar. Quero um site completamente fora do padrão com o máximo de integrações, efeitos interativos que você puder colocar (use os efeitos que coloquei em anexo nesse prompt)
