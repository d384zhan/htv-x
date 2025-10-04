# Carousel Component Documentation

## Overview

The Carousel component is a sleek, glossy metallic carousel that displays exactly 5 cards in an infinite scrolling loop. It follows OOP best practices with proper encapsulation and single responsibility principles.

## Features

- **Fixed 5-card display**: Always shows exactly 5 cards
- **Modifiable content**: Each card can have custom content
- **Glossy metallic design**: Drop shadows and gradient styling for a premium look
- **Infinite scroll**: Seamless looping animation
- **Responsive**: Works across different screen sizes

## Components

### Carousel (Main Component)

The main carousel container that manages the display of cards.

**Props:**
- `cards`: Array of card configurations (optional, defaults to 5 placeholder cards)
- `className`: Additional CSS classes (optional)

**Behavior:**
- If fewer than 5 cards are provided, it pads with empty cards
- If more than 5 cards are provided, it shows only the first 5
- Always ensures exactly 5 cards are displayed

### CarouselCard (Individual Card)

Individual card component with metallic styling.

**Props:**
- `content`: Text content to display in the card (optional)
- `className`: Additional CSS classes (optional)

**Styling:**
- Gradient background (light metallic effect)
- Multiple layered drop shadows for depth
- Border highlight for glossy appearance
- Inner highlight overlay for shine effect

## Usage Examples

### Basic Usage (Default Cards)

```tsx
import { Carousel } from "@/components/carousel"

export default function Page() {
  return (
    <div>
      <Carousel />
    </div>
  )
}
```

### Custom Content

```tsx
import { Carousel } from "@/components/carousel"

export default function Page() {
  const myCards = [
    { content: "Analytics" },
    { content: "Dashboard" },
    { content: "Reports" },
    { content: "Settings" },
    { content: "Profile" },
  ]

  return (
    <div>
      <Carousel cards={myCards} />
    </div>
  )
}
```

### With Custom Styling

```tsx
import { Carousel } from "@/components/carousel"

export default function Page() {
  const cards = [
    { content: "🚀 Launch" },
    { content: "💡 Innovate" },
    { content: "🎯 Target" },
    { content: "📊 Analyze" },
    { content: "✨ Succeed" },
  ]

  return (
    <div>
      <Carousel cards={cards} className="my-8" />
    </div>
  )
}
```

## Design Specifications

### Colors
- Card gradient: `#e8e8e8` to `#c9c9c9`
- Highlight overlay: White with 20% opacity to black with 10% opacity
- Border: White with 25% opacity

### Shadows
- Main shadow: `0 4px 12px rgba(0,0,0,0.3)` and `0 2px 4px rgba(0,0,0,0.2)`
- Inner shadow: `inset 0 1px 0 rgba(255,255,255,0.5)`

### Dimensions
- Card height: 56px (3.5rem)
- Card minimum width: 192px (12rem)
- Gap between cards: 16px (1rem)

## Architecture

### Class-based Components (OOP)

Both `Carousel` and `CarouselCard` are implemented as React class components following OOP principles:

1. **Encapsulation**: Internal logic is hidden, only public props are exposed
2. **Single Responsibility**: Each component has one clear purpose
3. **Reusability**: Components can be used independently
4. **Type Safety**: Full TypeScript support with exported interfaces

### File Structure

```
src/components/carousel/
├── index.ts           # Public exports
├── Carousel.tsx       # Main carousel component
└── CarouselCard.tsx   # Individual card component
```

## Animation

The carousel uses CSS animations defined in `globals.css`:

```css
@keyframes carousel {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

The animation creates a seamless infinite scroll effect by duplicating the card set.

## Customization

To modify the carousel behavior:

1. **Change card count**: Update `DEFAULT_CARDS` array length in `Carousel.tsx`
2. **Adjust styling**: Modify the Tailwind classes in `CarouselCard.tsx`
3. **Change animation speed**: Update the animation duration in your CSS
4. **Add new props**: Extend the `CarouselProps` or `CarouselCardProps` interfaces

## Best Practices

1. **Always provide exactly 5 cards** for optimal display
2. **Keep content concise** - cards are designed for short labels
3. **Test on different screen sizes** - use responsive utilities as needed
4. **Don't override core styling** - use the className prop for additions only
