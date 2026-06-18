# Frontend Guidelines

## Design Principles

The website should feel professional, local-business friendly, and conversion-focused. It should not feel like a generic SaaS template. The design should communicate trust, speed, and practical business value.

## Layout

- Use a single-page landing structure for version 1.
- Keep sections full-width with constrained inner content.
- Use generous but controlled vertical spacing.
- Avoid placing large page sections inside decorative cards.
- Use cards only for repeated items such as services, packages, FAQs, or testimonials.
- Keep card border radius at 8px or less unless a stronger design reason exists.

## Responsive Behavior

- Mobile-first implementation.
- Hero should stack cleanly on small screens.
- Pricing cards should be one column on mobile and three columns on desktop.
- Navigation should collapse into a mobile menu.
- Buttons must not overflow on narrow screens.
- Text should wrap naturally and never overlap neighboring content.

## Typography

- Use a clean sans-serif font.
- Keep headings strong but not oversized inside cards.
- Do not scale font size directly with viewport width.
- Letter spacing should be normal unless used sparingly for small labels.
- Use clear hierarchy:
  - H1 for the main offer
  - H2 for major sections
  - H3 for cards and subsections

## Color

Use a professional palette suitable for property and construction businesses.

Recommended direction:

- Deep charcoal or ink for text
- Warm off-white background
- Construction green, steel blue, or copper accent
- Muted borders
- Limited highlight colors

Avoid:

- Copying the reference site's purple-heavy palette
- One-note beige/brown palettes
- Excessive gradients
- Decorative blobs or orb backgrounds

## Buttons

Button types:

- Primary CTA: strong filled button
- Secondary CTA: outlined or light button
- Icon buttons only where a familiar icon improves clarity

Rules:

- Use icons for WhatsApp/contact or arrows where appropriate.
- Buttons must have hover and focus states.
- Button text should be short and action-oriented.

## Icons

Use Lucide React icons.

Icon rules:

- Keep stroke weight consistent.
- Do not mix icon styles.
- Use icons to support scanning, not as decoration only.
- Pair icons with text for service cards.

## Images

Use imagery that directly supports the offer:

- Local buildings
- Construction/project work
- Property management desk/workflow
- Website mockups
- Rental buildings or apartments

Avoid:

- Dark stock images where the subject is hard to inspect
- Abstract illustrations as the main hero visual
- Generic business handshake images
- Exact images from the reference site

## Components

Suggested components:

- `Header`
- `Hero`
- `TrustStrip`
- `SectionHeader`
- `ServiceCard`
- `UseCaseCard`
- `PricingCard`
- `ProcessStep`
- `FAQItem`
- `ContactCTA`
- `Footer`

## Interactions

Keep interactions simple:

- Smooth scroll for anchor links
- FAQ accordion
- Mobile menu open/close
- Button hover states
- Optional subtle entrance animation

Avoid:

- Heavy scroll animations
- Layout-shifting hover effects
- Complex carousels for version 1

## Accessibility

- Use semantic HTML.
- Buttons should be buttons, links should be links.
- Add focus-visible styles.
- Ensure contrast is readable.
- Provide alt text for meaningful images.
- Do not rely on color alone to communicate meaning.

## Content Rules

- Copy should be specific to builders and property managers.
- Avoid technical jargon like "responsive architecture" in customer-facing areas.
- Use business outcomes:
  - More leads
  - Better trust
  - Faster enquiry handling
  - Easier maintenance requests
  - Better project presentation

## Quality Checklist

Before delivery:

- Check desktop layout.
- Check mobile layout.
- Confirm no text overlap.
- Confirm all CTA links work.
- Confirm nav anchors work.
- Confirm images load.
- Confirm form UI is usable.
- Confirm no reference-site branding remains.
