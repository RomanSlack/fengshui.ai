# FengShui.fy Design System & Style Guide

## 🎨 Design Philosophy

FengShui.fy embodies the principles of feng shui through its design: **harmony, balance, flow, and mindful simplicity**. Every element breathes, every transition flows, and every color choice creates calm.

---

## 🌿 Core Values

- **Zen/Meditative** - Calm, peaceful, harmonious
- **Natural/Organic** - Flowing, breathing, alive
- **Elegant Simplicity** - Refined but not fancy
- **Welcoming Warmth** - Friendly, approachable
- **Mindful Design** - Every element has purpose and breathing room

---

## 🎨 Color Palette

### Primary Zen Colors (Tailwind Custom)

**Greens (Nature & Growth):**
- `zen-sage` - Soft sage green, primary action color
- `zen-pine` - Deeper pine green, headings and emphasis

**Neutrals (Balance & Space):**
- `zen-cloud` - Light cloud white/cream
- `zen-mist` - Soft misty gray
- `zen-earth` - Warm earth brown/tan

**Accents (Subtle Energy):**
- `zen-petal` - Gentle pink/rose
- `zen-rose` - Deeper rose accent
- `zen-blush` - Soft blush pink

### Extended Palette (Coolors.co)

**Natural Earth Tones:**

| Color | Hex | HSL | RGB | Usage |
|-------|-----|-----|-----|-------|
| **Ash Gray** | `#B2B6AD` | `hsla(87, 6%, 70%, 1)` | `rgba(178, 182, 173, 1)` | Secondary text, muted backgrounds |
| **Timberwolf** | `#CCCEC5` | `hsla(73, 8%, 79%, 1)` | `rgba(204, 206, 197, 1)` | Subtle borders, dividers |
| **Alabaster** | `#E2E4DC` | `hsla(75, 13%, 88%, 1)` | `rgba(226, 228, 220, 1)` | Light backgrounds, cards |
| **Isabelline** | `#F0EEE9` | `hsla(43, 19%, 93%, 1)` | `rgba(240, 238, 233, 1)` | Primary backgrounds |
| **Alabaster 2** | `#EEEAE2` | `hsla(40, 26%, 91%, 1)` | `rgba(238, 234, 226, 1)` | Warm backgrounds, overlays |

### Gradients

```css
/* Vertical Earth Gradient */
background: linear-gradient(180deg, #B2B6AD, #CCCEC5, #E2E4DC, #F0EEE9, #EEEAE2);

/* Radial Zen Gradient */
background: radial-gradient(#B2B6AD, #CCCEC5, #E2E4DC, #F0EEE9, #EEEAE2);

/* Diagonal Flow Gradient */
background: linear-gradient(135deg, #B2B6AD, #CCCEC5, #E2E4DC, #F0EEE9, #EEEAE2);
```

---

## 📐 Spacing & Layout

### White Space Philosophy
**Generous breathing room** - elements need space to flow

```tsx
// Page containers
className="max-w-7xl mx-auto px-4 py-8"

// Section spacing
className="space-y-12"  // Between major sections
className="space-y-6"   // Between related groups
className="space-y-2"   // Between tightly coupled items

// Component padding
className="p-8"   // Cards, modals
className="px-8 py-6"  // Asymmetric (common for text containers)
```

### Rounded Corners
**Organic, soft edges**

```tsx
className="rounded-full"  // Circles, pills (buttons, badges)
className="rounded-3xl"   // Large cards, modals
className="rounded-2xl"   // Medium containers
className="rounded-xl"    // Small containers, inputs
className="rounded-lg"    // Buttons, tags
```

---

## ✍️ Typography

### Font Families
- **Headings**: `font-serif` - Elegant, timeless
- **Body**: Default sans-serif - Clean, readable

### Font Weights
- **Light** (`font-light`) - Primary weight, delicate
- **Medium** (`font-medium`) - Labels, small emphasis
- **Semibold** (`font-semibold`) - User names, strong emphasis
- **Bold** (`font-bold`) - Rare, only for strong headings

### Font Sizes

**Display (Landing Page):**
```tsx
className="text-6xl md:text-8xl"  // Main logo/title
className="text-3xl md:text-5xl"  // Section headings
```

**Headings (App Pages):**
```tsx
className="text-4xl"  // Page titles
className="text-3xl"  // Major sections
className="text-2xl"  // Subsections
className="text-xl"   // Card titles
className="text-lg"   // Emphasis text
```

**Body:**
```tsx
className="text-base"  // Standard body (16px)
className="text-sm"    // Secondary info
className="text-xs"    // Labels, captions
```

### Letter Spacing
```tsx
className="tracking-calm"  // Custom spacing for zen feel
```

### Text Colors
```tsx
className="text-zen-pine"     // Primary headings
className="text-zen-earth"    // Body text
className="text-gray-700"     // Standard text
className="text-gray-600"     // Secondary text
className="text-gray-500"     // Muted text
className="text-zen-pine/90"  // Semi-transparent (readability on backgrounds)
```

---

## 🎭 Shadows & Depth

**Soft, layered depth** - never harsh

```tsx
className="shadow-sm"    // Subtle lift
className="shadow-lg"    // Standard cards
className="shadow-xl"    // Important elements
className="shadow-2xl"   // Modals, key components
className="shadow-3xl"   // Hover states (custom)

// Drop shadows for text on images
className="drop-shadow-lg"
className="drop-shadow-md"
```

---

## 🌊 Transitions & Animations

### Philosophy
**Slow, flowing, breathing** - nothing is abrupt

### Standard Durations
```tsx
className="duration-200"   // Quick feedback (hover, small changes)
className="duration-300"   // Standard interactions
className="duration-500"   // Important state changes
className="duration-1000"  // Page transitions, major changes
```

### Common Transitions
```tsx
// Opacity fade (page transitions)
className="transition-opacity duration-1000"

// Scale (hover effects)
className="transition-transform duration-300 hover:scale-105"

// All properties (buttons)
className="transition-all duration-500 ease-out"
```

### Custom Animations

**Breathing Background (Landing Page):**
```css
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
animation: breathe 20s ease-in-out infinite;
```

**Spin Loading:**
```tsx
className="animate-spin rounded-full h-16 w-16 border-4 border-zen-sage/20 border-t-zen-sage"
```

---

## 🎯 Interactive Elements

### Buttons

**Primary Action (Sage Green):**
```tsx
className="px-12 py-5 text-lg rounded-full bg-zen-sage/90 hover:bg-zen-sage
           text-white transition-all duration-500 ease-out shadow-2xl
           hover:shadow-3xl hover:scale-105 backdrop-blur-sm"
```

**Secondary Action (White):**
```tsx
className="px-6 py-2 text-sm font-medium text-gray-700 bg-white
           border-2 border-gray-300 rounded-lg hover:bg-gray-50
           transition-colors shadow-sm"
```

### Hover States
- **Subtle scale**: `hover:scale-105`
- **Color shift**: `hover:bg-zen-sage` (from `bg-zen-sage/90`)
- **Shadow increase**: `hover:shadow-3xl` (from `shadow-2xl`)

### Cursor
```tsx
className="cursor-pointer"  // Interactive elements only
className="pointer-events-none"  // Decorative elements
```

---

## 🖼️ Cards & Containers

### Standard Card
```tsx
className="bg-white rounded-2xl shadow-lg p-8"
```

### Modal/Important Card
```tsx
className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100"
```

### Overlay/Backdrop
```tsx
className="bg-white/40 backdrop-blur-sm rounded-2xl px-8 py-6"
```

---

## 🌈 Gradients in Use

### Backgrounds
```tsx
// Page backgrounds
className="bg-gradient-to-b from-gray-50 to-gray-100"

// Overlays for readability
className="bg-gradient-to-b from-black/10 via-transparent to-black/20"

// Button/Icon accents
className="bg-gradient-to-br from-zen-sage to-zen-pine"
```

### Organic Background Shapes
```tsx
<div className="absolute inset-0 overflow-hidden pointer-events-none">
  <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
  <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-zen-petal/10 rounded-full blur-2xl"></div>
</div>
```

---

## 🎬 Page Transitions

### Fade Out (Exit)
```tsx
const [isNavigating, setIsNavigating] = useState(false);

// Trigger
setIsNavigating(true);
setTimeout(() => router.push('/next-page'), 1000);

// Apply
<main className={`transition-opacity duration-1000 ${isNavigating ? 'opacity-0' : 'opacity-100'}`}>
```

### Fade In (Enter)
```tsx
const [fadeIn, setFadeIn] = useState(false);

useEffect(() => {
  setFadeIn(true);
}, []);

<main className={`transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
```

### Loading States
```tsx
// Simple zen loading spinner
<div className="animate-spin rounded-full h-16 w-16 border-4 border-zen-sage/20 border-t-zen-sage"></div>

// With delay (only show if takes >2 seconds)
const [showLoading, setShowLoading] = useState(false);
setTimeout(() => setShowLoading(true), 2000);
```

---

## 🖼️ Images & Media

### Full-Screen Background
```tsx
<div className="fixed inset-0 w-full h-full -z-10">
  <Image
    src="/background.png"
    fill
    className="object-cover object-center animate-breathe"
    priority
    quality={100}
    sizes="100vw"
  />
</div>
```

### Profile/Avatar Images
```tsx
<img className="w-8 h-8 rounded-full border-2 border-gray-200" />
```

### Logo/Icon Containers
```tsx
<div className="w-20 h-20 bg-gradient-to-br from-zen-sage to-zen-pine
                rounded-full flex items-center justify-center">
  <svg className="w-10 h-10 text-white" />
</div>
```

---

## 📱 Responsive Design

### Mobile-First Breakpoints
```tsx
className="text-base md:text-lg"  // Mobile: base, Desktop: lg
className="px-4 md:px-8"           // Mobile: 4, Desktop: 8
className="w-56 md:w-80"           // Mobile: 56, Desktop: 80
className="flex-col lg:flex-row"   // Mobile: column, Large: row
```

### Common Patterns
```tsx
// Container width
className="max-w-3xl md:max-w-7xl mx-auto"

// Grid layouts
className="grid md:grid-cols-2 gap-6"

// Hide on mobile
className="hidden md:block"
```

---

## 🎨 Component Patterns

### Auth Modal (Mandatory)
```tsx
<div className="fixed inset-0 bg-white z-50 flex items-center justify-center
                transition-opacity duration-1000">
  <div className="max-w-md w-full mx-4">
    <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100">
      {/* Icon */}
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-zen-sage to-zen-pine
                      rounded-full flex items-center justify-center mb-8">
        <svg className="w-10 h-10 text-white" />
      </div>
      {/* Content */}
    </div>
  </div>
</div>
```

### Results Card
```tsx
<div className="bg-white rounded-2xl shadow-lg p-8">
  <h3 className="text-2xl font-bold text-gray-900 mb-4">
    Title
  </h3>
  <p className="text-gray-600">Content</p>
</div>
```

### Status Badge
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
  <p className="text-sm text-green-700">✓ Success message</p>
</div>
```

---

## ♿ Accessibility

### Focus States
Always include visible focus states for keyboard navigation:
```tsx
className="focus:outline-none focus:ring-2 focus:ring-zen-sage focus:ring-offset-2"
```

### Color Contrast
- Text on white: Use `text-gray-700` or darker
- Text on backgrounds: Use `/90` opacity for readability
- Important text: Add `drop-shadow` when on images

### Semantic HTML
```tsx
<main>, <section>, <article>, <nav>  // Use semantic tags
<button> (not <div onClick>)          // Proper interactive elements
alt="descriptive text"                 // All images must have alt text
```

---

## 🎯 Do's and Don'ts

### ✅ Do:
- Use slow, flowing transitions (1s for major changes)
- Embrace white space generously
- Keep rounded corners soft and organic
- Use light font weights primarily
- Layer with soft shadows
- Make interactions feel alive (breathing, hovering mascot)
- Fade between states smoothly
- Use semi-transparent overlays for depth

### ❌ Don't:
- Use harsh colors or high contrast
- Make abrupt transitions (<200ms for major changes)
- Clutter the interface
- Use heavy font weights everywhere
- Create sharp corners on primary elements
- Use jarring animations
- Block user interaction unnecessarily
- Forget to add breathing room

---

## 🔮 Future Considerations

When adding new features, ask:
1. **Does it breathe?** - Is there enough space around it?
2. **Does it flow?** - Are transitions smooth and intentional?
3. **Is it calm?** - Does it add to or detract from the zen atmosphere?
4. **Is it mindful?** - Does every element have a clear purpose?
5. **Is it balanced?** - Does it harmonize with existing elements?

---

## 📚 Quick Reference

**Most Used Classes:**
```tsx
// Containers
className="max-w-7xl mx-auto px-4 py-8"
className="bg-white rounded-2xl shadow-lg p-8"

// Text
className="text-zen-pine font-serif text-3xl font-light tracking-calm"
className="text-gray-600 text-base font-light leading-relaxed"

// Buttons
className="px-8 py-3 rounded-full bg-zen-sage/90 hover:bg-zen-sage text-white
           transition-all duration-500 shadow-2xl hover:scale-105"

// Spacing
className="space-y-12"  // Sections
className="space-y-6"   // Groups
className="space-y-2"   // Tight items

// Transitions
className="transition-opacity duration-1000"
className="transition-all duration-500 ease-out"
```

---

**Remember:** FengShui.fy's design is not just aesthetic—it embodies the principles it teaches. Every design choice should promote **harmony, balance, and flow**. 🌿✨
