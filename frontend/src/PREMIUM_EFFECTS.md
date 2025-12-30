# 🌟 PRISK Premium Aesthetic Effects

This document describes all the premium visual effects implemented in the PRISK application.

## 🎨 Visual Effects Categories

### 1. **Motion Blur Effects**
Adds dynamic motion blur for smoother transitions and animations.

**Classes:**
- `.motion-blur-hover` - Applies blur on hover with subtle movement
- `.animate-motion-blur-x` - Continuous horizontal motion blur animation
- `.animate-motion-blur-y` - Continuous vertical motion blur animation

**Usage:**
```tsx
<div className="motion-blur-hover">Hover me!</div>
```

### 2. **Liquid Glass Morphism**
Advanced glassmorphism with backdrop blur and subtle gradients.

**Classes:**
- `.liquid-glass` - Standard liquid glass effect (white/transparent)
- `.liquid-glass-dark` - Dark variant for dark themes
- `.liquid-glass-green` - Green-tinted glass with OCP branding
- `.frosted-glass` - Light frosted effect
- `.frosted-glass-hover` - Enhanced frosted effect on hover

**Features:**
- Backdrop blur (20px with saturation)
- Subtle gradient overlays
- Inset highlights
- Shadow depth

**Usage:**
```tsx
<Card className="liquid-glass">
  <CardContent>Transparent glassmorphic card</CardContent>
</Card>
```

### 3. **Aurora Backgrounds**
Flowing, animated gradient backgrounds.

**Classes:**
- `.aurora-background` - Full vibrant aurora effect
- `.aurora-background-subtle` - Subtle, low-opacity version

**Colors:** Green spectrum matching OCP brand
**Animation:** 15-20s infinite ease animation

**Usage:**
```tsx
<div className="aurora-background p-6 text-white">
  <h1>Aurora Effect</h1>
</div>
```

### 4. **Neon Glow Effects**
Multi-layered glowing effects for emphasis and alerts.

**Classes:**
- `.neon-glow-green` - Green glow (success/normal states)
- `.neon-glow-red` - Red glow (critical alerts)
- `.neon-glow-yellow` - Yellow glow (warnings)
- `.animate-neon-pulse` - Pulsing neon animation

**Shadow Layers:** 4 layers with decreasing opacity
**Best for:** Alert indicators, important status badges, critical buttons

**Usage:**
```tsx
<div className="w-12 h-12 bg-red-500 rounded-full neon-glow-red animate-neon-pulse">
  <AlertIcon />
</div>
```

### 5. **Depth Layering**
Progressive shadow depth for visual hierarchy.

**Classes:**
- `.depth-layer-1` - Subtle elevation
- `.depth-layer-2` - Light elevation
- `.depth-layer-3` - Medium elevation
- `.depth-layer-4` - Deep elevation
- `.depth-layer-hover` - Animated depth on hover

**Usage:**
```tsx
<Card className="depth-layer-3">Elevated card</Card>
```

### 6. **Neumorphism**
Soft UI design with embossed/debossed effects.

**Classes:**
- `.neumorphic` - Raised neumorphic surface
- `.neumorphic-inset` - Inset/pressed effect

**Best for:** Modern dashboard elements, buttons, input fields

### 7. **Gradient Mesh**
Animated radial gradient background.

**Classes:**
- `.gradient-mesh` - Multi-point radial gradient animation

**Features:**
- 4 radial gradients at corners
- 20s animation cycle
- Subtle, non-distracting

**Usage:**
```tsx
<div className="gradient-mesh min-h-screen">
  <YourContent />
</div>
```

### 8. **Holographic Effects**
Shifting iridescent colors.

**Classes:**
- `.holographic` - Animated color shift background
- `.holographic-border` - Animated border with color flow

**Animation:** 6s continuous color flow

### 9. **Morphing Blobs**
Organic shape-shifting animations.

**Classes:**
- `.morphing-blob` - Animated border-radius morphing

**Animation:** 8s ease-in-out infinite
**Best for:** Background decorative elements

**Usage:**
```tsx
<div className="absolute w-64 h-64 bg-green-500 rounded-full blur-3xl opacity-20 morphing-blob" />
```

### 10. **3D Hover Effects**
Perspective-based hover transformations.

**Classes:**
- `.hover-3d` - 3D perspective transform on hover
- `.hover-tilt` - Subtle Y-axis rotation

**Transform:** Uses perspective(1000px) with rotateX and rotateY

**Usage:**
```tsx
<Card className="hover-3d">Hover for 3D effect</Card>
```

### 11. **Text Effects**
Animated text styling.

**Classes:**
- `.text-shimmer` - Flowing shimmer across text
- `.text-gradient-green` - Static green gradient text

**Usage:**
```tsx
<h1 className="text-shimmer">PRISK</h1>
```

### 12. **Energy Flow**
Moving gradient indicator for active states.

**Classes:**
- `.energy-flow` - Horizontal moving gradient

**Best for:** Progress indicators, active state markers

### 13. **Breathing Animation**
Gentle scale and opacity pulse.

**Classes:**
- `.animate-breathe` - 4s breathing cycle

**Best for:** Status indicators, live data displays

### 14. **Floating Animation**
Vertical floating motion.

**Classes:**
- `.animate-float` - 3s ease-in-out float

**Best for:** Decorative icons, badges

## 🎯 Premium Components

### PremiumCard
Versatile card with multiple effect variants.

```tsx
<PremiumCard 
  variant="glass" // glass | liquid | frosted | neon | aurora | holographic | neumorphic
  glow="green"    // green | red | yellow | none
  blur={true}     // Enable motion blur
  hover3d={true}  // Enable 3D hover
>
  <CardContent>Your content</CardContent>
</PremiumCard>
```

### GlowingBadge
Neon-glowing badge with pulse option.

```tsx
<GlowingBadge color="green" pulse={true}>
  Live Status
</GlowingBadge>
```

### LiquidButton
Premium button with 3D hover and glow.

```tsx
<LiquidButton variant="primary" size="md">
  Take Action
</LiquidButton>
```

### ShimmerText
Text with flowing shimmer effect.

```tsx
<ShimmerText>PRISK Platform</ShimmerText>
```

### IridescentCard
Card with iridescent overlay on hover.

```tsx
<IridescentCard>
  <h3>Premium Content</h3>
  <p>With iridescent effect</p>
</IridescentCard>
```

### FloatingElement
Wrapper for floating animation.

```tsx
<FloatingElement delay={0.5}>
  <Icon />
</FloatingElement>
```

### MorphingBlob
Background morphing shape.

```tsx
<MorphingBlob 
  size={150} 
  color="#16A34A" 
  opacity={0.2} 
  className="top-10 right-10"
/>
```

### EnergyFlowIndicator
Animated progress bar.

```tsx
<EnergyFlowIndicator active={true} />
```

## 🎪 Implementation Examples

### Dashboard Card with All Effects
```tsx
<Card className="liquid-glass hover-3d depth-layer-2 overflow-hidden relative">
  {/* Morphing blob background */}
  <MorphingBlob size={120} color="#16A34A" opacity={0.1} className="top-0 right-0" />
  
  {/* Gradient accent with energy flow */}
  <div className="absolute left-0 top-0 bottom-0 w-2 energy-flow neon-glow-green" />
  
  <CardContent className="p-6 relative z-10">
    {/* Breathing status indicator */}
    <div className="w-12 h-12 bg-green-500 rounded-full neon-glow-green animate-breathe" />
    
    <h3 className="text-shimmer">Production Line A</h3>
    <p className="text-gray-600">Status: Operational</p>
    
    <EnergyFlowIndicator active />
  </CardContent>
</Card>
```

### Login Page with Premium Background
```tsx
<div className="min-h-screen aurora-background relative overflow-hidden">
  {/* Morphing blobs */}
  <div className="absolute inset-0">
    <div className="morphing-blob absolute w-96 h-96 bg-green-400 blur-3xl opacity-20" />
    <div className="gradient-mesh absolute inset-0 opacity-30" />
  </div>
  
  {/* Content */}
  <Card className="liquid-glass depth-layer-4 max-w-md mx-auto">
    <CardContent>
      <h1 className="text-shimmer">PRISK</h1>
      <LiquidButton variant="primary">Login</LiquidButton>
    </CardContent>
  </Card>
</div>
```

## 🎨 Color Philosophy

All effects use the OCP green color palette:
- Primary: `#16A34A`
- Light: `#10B981`
- Dark: `#059669`
- Darkest: `#047857`

## ⚡ Performance Notes

- Backdrop filters use GPU acceleration
- Animations are optimized with `will-change` where needed
- Blur effects are limited to prevent performance issues
- Morphing animations use transform properties (hardware accelerated)

## 🚀 Best Practices

1. **Don't Overuse:** Apply premium effects strategically for emphasis
2. **Combine Wisely:** Mix 2-3 effects max per component
3. **Consider Context:** Use subtle effects for data-heavy views
4. **Accessibility:** Ensure text remains readable with all effects
5. **Performance:** Monitor FPS when using multiple morphing blobs

## 🎯 Effect Combinations

**For Status Cards:**
```
liquid-glass + depth-layer-2 + neon-glow-green + animate-breathe
```

**For Alerts:**
```
liquid-glass + neon-glow-red + animate-neon-pulse + hover-3d
```

**For Backgrounds:**
```
aurora-background + gradient-mesh + morphing-blob (multiple)
```

**For Interactive Elements:**
```
frosted-glass-hover + hover-3d + energy-flow
```

---

Built with ❤️ for the PRISK Industrial Platform - Groupe OCP
