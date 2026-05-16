# Motion Components

Global Framer Motion primitives. Import from `@/components/motion`.

## Components

| Component | Use |
|-----------|-----|
| `FadeIn` | Fade on scroll into view |
| `SlideUp` | Slide + fade from below |
| `SlideIn` | Slide from left/right/top/bottom |
| `ScaleIn` | Scale up on enter |
| `StaggerList` | Stagger-animate array of children |
| `AnimatedModal` | Modal with backdrop + scale |
| `PageTransition` | Wrap route pages |
| `HoverCard` | Lift card on hover |
| `PressButton` | Press scale on button |
| `ParallaxSection` | Scroll parallax |
| `TabIndicator` | Animated tab underline |
| `CountUp` | Animated number counter |

## Quick Usage

```tsx
import { SlideUp, StaggerList, HoverCard, AnimatedModal } from "@/components/motion";

// Hero section
<SlideUp delay={0.1}><h1>Title</h1></SlideUp>
<SlideUp delay={0.2}><p>Subtitle</p></SlideUp>

// Card grid
<StaggerList className="grid grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</StaggerList>

// Hover card
<HoverCard className="rounded-2xl border p-6">
  <CardContent />
</HoverCard>

// Modal
<AnimatedModal isOpen={open} onClose={() => setOpen(false)}>
  <div className="bg-white rounded-2xl p-8">...</div>
</AnimatedModal>
```
