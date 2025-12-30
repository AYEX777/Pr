import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  PremiumCard, 
  GlowingBadge, 
  AnimatedBackground, 
  LiquidButton,
  FloatingElement,
  MorphingBlob,
  ShimmerText,
  IridescentCard,
  EnergyFlowIndicator
} from './PremiumCard';
import { Sparkles, Zap, Flame, Star } from 'lucide-react';

export function PremiumShowcase() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          <ShimmerText>PRISK Premium Effects</ShimmerText>
        </h1>
        <p className="text-gray-600">Showcase of all premium aesthetic features</p>
      </div>

      {/* Glass Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Liquid Glass Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PremiumCard variant="glass">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Glass Effect</h3>
              <p className="text-sm text-gray-600">Semi-transparent with blur backdrop</p>
            </CardContent>
          </PremiumCard>

          <PremiumCard variant="liquid">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Liquid Glass</h3>
              <p className="text-sm text-gray-600">Green tinted glass morphism</p>
            </CardContent>
          </PremiumCard>

          <PremiumCard variant="frosted" blur>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Frosted Glass</h3>
              <p className="text-sm text-gray-600">Enhanced blur with motion</p>
            </CardContent>
          </PremiumCard>
        </div>
      </section>

      {/* Neon Glow Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Neon Glow Effects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PremiumCard variant="neon" glow="green">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center neon-glow-green animate-neon-pulse">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Green Glow</h3>
                  <p className="text-xs text-gray-600">Animated pulse</p>
                </div>
              </div>
            </CardContent>
          </PremiumCard>

          <PremiumCard variant="neon" glow="red">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center neon-glow-red">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Red Glow</h3>
                  <p className="text-xs text-gray-600">Alert indicator</p>
                </div>
              </div>
            </CardContent>
          </PremiumCard>

          <PremiumCard variant="neon" glow="yellow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center neon-glow-yellow">
                  <Zap className="w-6 h-6 text-gray-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Yellow Glow</h3>
                  <p className="text-xs text-gray-600">Warning state</p>
                </div>
              </div>
            </CardContent>
          </PremiumCard>
        </div>
      </section>

      {/* 3D Hover Effects */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">3D Hover & Motion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PremiumCard variant="glass" hover3d>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">3D Transform</h3>
              <p className="text-sm text-gray-600 mb-4">Hover to see perspective shift</p>
              <div className="h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-lg"></div>
            </CardContent>
          </PremiumCard>

          <PremiumCard variant="neumorphic">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Neumorphic</h3>
              <p className="text-sm text-gray-600 mb-4">Soft UI design style</p>
              <div className="h-20 neumorphic-inset rounded-lg"></div>
            </CardContent>
          </PremiumCard>
        </div>
      </section>

      {/* Animated Backgrounds */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Animated Backgrounds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedBackground variant="aurora" className="p-6 text-white">
            <h3 className="font-semibold mb-2">Aurora Effect</h3>
            <p className="text-sm opacity-90">Flowing gradient animation</p>
          </AnimatedBackground>

          <AnimatedBackground variant="holographic" className="p-6 text-white">
            <h3 className="font-semibold mb-2">Holographic</h3>
            <p className="text-sm opacity-90">Shifting color spectrum</p>
          </AnimatedBackground>
        </div>
      </section>

      {/* Badges & Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Glowing Components</h2>
        <div className="flex flex-wrap gap-4">
          <GlowingBadge color="green">Normal Status</GlowingBadge>
          <GlowingBadge color="yellow">Warning</GlowingBadge>
          <GlowingBadge color="red" pulse>Critical Alert</GlowingBadge>
          <GlowingBadge color="blue">Information</GlowingBadge>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <LiquidButton variant="primary">Primary Action</LiquidButton>
          <LiquidButton variant="success">Success</LiquidButton>
          <LiquidButton variant="danger">Danger</LiquidButton>
        </div>
      </section>

      {/* Floating Elements */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Floating & Morphing</h2>
        <Card className="liquid-glass relative h-64 overflow-hidden">
          <CardContent className="p-6 relative z-10">
            <h3 className="font-semibold text-gray-900 mb-4">Morphing Blobs</h3>
            <p className="text-sm text-gray-600">Background shapes that animate and morph</p>
          </CardContent>
          <MorphingBlob size={150} color="#16A34A" opacity={0.15} className="top-10 right-10" />
          <MorphingBlob size={120} color="#10B981" opacity={0.1} className="bottom-10 left-10" />
        </Card>
      </section>

      {/* Iridescent Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Iridescent & Shimmer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <IridescentCard>
            <h3 className="font-semibold text-gray-900 mb-2">Iridescent Card</h3>
            <p className="text-sm text-gray-600">Shifting color overlay on hover</p>
            <EnergyFlowIndicator active />
          </IridescentCard>

          <Card className="liquid-glass">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">
                <ShimmerText>Shimmer Text</ShimmerText>
              </h3>
              <p className="text-sm text-gray-600">Animated gradient text effect</p>
              <div className="mt-4">
                <EnergyFlowIndicator active />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Floating Icons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Floating Animation</h2>
        <Card className="liquid-glass h-48 relative overflow-visible">
          <CardContent className="p-6 flex items-center justify-center gap-8">
            <FloatingElement delay={0}>
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center neon-glow-green">
                <Star className="w-8 h-8 text-white" />
              </div>
            </FloatingElement>
            <FloatingElement delay={0.5}>
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </FloatingElement>
            <FloatingElement delay={1}>
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </FloatingElement>
          </CardContent>
        </Card>
      </section>

      {/* Depth Layers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Depth Layering</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="depth-layer-1 p-4 text-center">
            <p className="text-sm font-semibold">Layer 1</p>
            <p className="text-xs text-gray-500">Subtle</p>
          </Card>
          <Card className="depth-layer-2 p-4 text-center">
            <p className="text-sm font-semibold">Layer 2</p>
            <p className="text-xs text-gray-500">Light</p>
          </Card>
          <Card className="depth-layer-3 p-4 text-center">
            <p className="text-sm font-semibold">Layer 3</p>
            <p className="text-xs text-gray-500">Medium</p>
          </Card>
          <Card className="depth-layer-4 p-4 text-center">
            <p className="text-sm font-semibold">Layer 4</p>
            <p className="text-xs text-gray-500">Deep</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
