# Tech Stack Document

## Recommended Stack

This project should start as a fast, modern static website with a lightweight frontend framework.

Recommended stack:

- Vite
- React
- TypeScript
- Tailwind CSS
- Lucide React icons
- Plain static assets for images

## Why This Stack

Vite keeps the project simple and fast. React makes it easy to build reusable sections like pricing cards, service cards, FAQ items, and CTAs. TypeScript helps prevent simple mistakes as the site grows. Tailwind CSS allows quick styling without creating a large custom CSS system.

## Frontend

### Framework

React with TypeScript.

Use component-based sections:

- Header
- Hero
- TrustStrip
- Services
- UseCases
- Packages
- Process
- Testimonials
- FAQ
- ContactCTA
- Footer

### Styling

Tailwind CSS should be used for layout, spacing, typography, responsive behavior, and visual states.

Use a small custom design-token layer for:

- Brand colors
- Font family
- Section spacing
- Border radius
- Shadow style

### Icons

Use Lucide React icons for interface symbols and service cards.

Suggested icons:

- Building2
- Hammer
- Home
- MessagesSquare
- ClipboardList
- Wrench
- MapPin
- Phone
- Mail
- CheckCircle2

## Images

Use real-looking property, construction, and building images. Do not use the reference site's logo or exact visual assets.

Image sources can be:

- User-provided images
- Licensed stock images
- Generated images
- Placeholder local assets during development

## Forms

Version 1 can use a frontend-only form UI with one of these options:

- `mailto:` action
- WhatsApp CTA
- Future integration with Formspree, Netlify Forms, Google Sheets, or a backend endpoint

Recommended first version:

- WhatsApp CTA as primary contact
- Contact form UI with clear future integration point

## Hosting

Good hosting options:

- Vercel
- Netlify
- Cloudflare Pages

For local client projects, Vercel or Netlify is easiest.

## SEO

Add basic SEO:

- Page title
- Meta description
- Open Graph title/description
- Proper heading hierarchy
- Descriptive image alt text
- Local service keywords

Example keywords:

- website for builders
- property manager website
- real estate website design
- local builder website
- rental property website

## Performance

Requirements:

- Avoid large unoptimized images
- Use responsive image sizing
- Keep animations subtle
- Avoid heavy libraries unless needed
- Target strong Lighthouse scores

## Accessibility

Requirements:

- Keyboard-friendly navigation
- Good color contrast
- Visible focus states
- Real buttons for actions
- Descriptive link text
- Form labels where forms are used

## Future Upgrade Path

If the product grows beyond a simple marketing site:

- Add Next.js for routing and SEO-heavy content
- Add a CMS for editable pages
- Add Supabase or Firebase for lead storage
- Add calendar booking integration
- Add project/property listing management

## Not Recommended for Version 1

- Building a custom backend before validating demand
- User accounts
- Complex dashboards
- Payment systems
- Heavy animation frameworks
- Copying the reference site's exact design system
