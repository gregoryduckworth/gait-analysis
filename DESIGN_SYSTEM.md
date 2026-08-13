# Design System Implementation

## Overview

This project uses **Tailwind CSS** as its design system, integrated via CDN for simplicity and ease of use with the vanilla JavaScript architecture.

## Implementation Details

### Tailwind CSS Integration

- **Version**: Latest (via CDN)
- **Location**: Loaded in `browser/index.html` via CDN script
- **Configuration**: Custom color palette configured inline to match the original design

### Custom Color Palette

```javascript
colors: {
    'primary': '#667eea',      // Main accent color (purple-blue)
    'secondary': '#764ba2',    // Secondary accent (darker purple)
    'dark': '#0f0f1a',         // Main background
    'dark-light': '#1a1a2e',   // Secondary background
    'dark-card': '#16213e',    // Card background
}
```

### Architecture

The implementation follows a hybrid approach:

1. **Tailwind utility classes**: Used for layout, spacing, colors, typography, and responsive design
2. **Custom CSS**: Retained for:
   - Dynamic state classes (`.visible`, `.active`, `.dragover`)
   - Component-specific styles (angle badges, reliability tags, expanders)
   - Animations and transitions
   - Canvas positioning for video overlay

### Benefits

- **Reduced CSS**: Reduced from ~500 lines to ~200 lines of custom CSS
- **Consistency**: Standardized spacing, colors, and responsive breakpoints
- **Maintainability**: Utility-first approach makes styling changes faster
- **No build step**: CDN integration means no compilation required
- **Preserved functionality**: All JavaScript interactions work seamlessly

### File Changes

- `browser/index.html`: Refactored to use Tailwind utilities with minimal custom CSS
- `package.json`: Added for npm test support

### Usage Examples

#### Layout
```html
<!-- Tailwind grid -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
```

#### Colors
```html
<!-- Custom palette colors -->
<div class="bg-dark-card text-primary border-gray-700">
```

#### Responsive Design
```html
<!-- Mobile-first responsive classes -->
<h1 class="text-4xl md:text-5xl">
```

## Future Enhancements

Potential improvements for production:

1. **Build process**: Integrate Tailwind CLI or PostCSS for:
   - Purging unused styles
   - Custom plugin development
   - Better performance optimization

2. **Component library**: Extract reusable components (cards, buttons, badges)

3. **Theme customization**: Expand color palette for more use cases

4. **Dark mode toggle**: Leverage Tailwind's dark mode utilities
