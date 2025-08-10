"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function WarmDarkDemo() {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Warm Dark Mode Colors</h2>
        <p className="text-muted-foreground">Experience the cozy, sophisticated warm dark theme</p>
      </div>

      {/* Color Palette Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Background Colors */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Background Colors</CardTitle>
            <CardDescription className="text-muted-foreground">
              Main background and surface colors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-8 bg-background rounded border border-border"></div>
            <div className="h-8 bg-card rounded border border-border"></div>
            <div className="h-8 bg-popover rounded border border-border"></div>
            <div className="h-8 bg-muted rounded border border-border"></div>
          </CardContent>
        </Card>

        {/* Text Colors */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Text Colors</CardTitle>
            <CardDescription className="text-muted-foreground">
              Foreground and text colors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-8 bg-foreground rounded"></div>
            <div className="h-8 bg-muted-foreground rounded"></div>
            <div className="h-8 bg-card-foreground rounded"></div>
            <div className="h-8 bg-popover-foreground rounded"></div>
          </CardContent>
        </Card>

        {/* Accent Colors */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Accent Colors</CardTitle>
            <CardDescription className="text-muted-foreground">
              Primary and accent colors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-8 bg-primary rounded"></div>
            <div className="h-8 bg-secondary rounded"></div>
            <div className="h-8 bg-accent rounded"></div>
            <div className="h-8 bg-destructive rounded"></div>
          </CardContent>
        </Card>
      </div>

      {/* Component Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Button Examples</CardTitle>
            <CardDescription className="text-muted-foreground">
              Different button styles with warm colors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full">Primary Button</Button>
            <Button variant="secondary" className="w-full">Secondary Button</Button>
            <Button variant="outline" className="w-full">Outline Button</Button>
            <Button variant="ghost" className="w-full">Ghost Button</Button>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Badge Examples</CardTitle>
            <CardDescription className="text-muted-foreground">
              Badge variants with warm theme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Warm Colors */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Custom Warm Color Palette</CardTitle>
          <CardDescription className="text-muted-foreground">
            Additional warm colors available in your Tailwind config
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Warm Colors */}
            <div className="space-y-2">
              <h4 className="font-medium text-card-foreground">Warm Grays</h4>
              <div className="space-y-1">
                <div className="h-6 bg-warm-100 rounded"></div>
                <div className="h-6 bg-warm-300 rounded"></div>
                <div className="h-6 bg-warm-500 rounded"></div>
                <div className="h-6 bg-warm-700 rounded"></div>
                <div className="h-6 bg-warm-900 rounded"></div>
              </div>
            </div>

            {/* Amber Colors */}
            <div className="space-y-2">
              <h4 className="font-medium text-card-foreground">Amber Accents</h4>
              <div className="space-y-1">
                <div className="h-6 bg-amber-100 rounded"></div>
                <div className="h-6 bg-amber-300 rounded"></div>
                <div className="h-6 bg-amber-500 rounded"></div>
                <div className="h-6 bg-amber-700 rounded"></div>
                <div className="h-6 bg-amber-900 rounded"></div>
              </div>
            </div>

            {/* Brown Colors */}
            <div className="space-y-2">
              <h4 className="font-medium text-card-foreground">Rich Browns</h4>
              <div className="space-y-1">
                <div className="h-6 bg-brown-100 rounded"></div>
                <div className="h-6 bg-brown-300 rounded"></div>
                <div className="h-6 bg-brown-500 rounded"></div>
                <div className="h-6 bg-brown-700 rounded"></div>
                <div className="h-6 bg-brown-900 rounded"></div>
              </div>
            </div>

            {/* Usage Examples */}
            <div className="space-y-2">
              <h4 className="font-medium text-card-foreground">Usage Examples</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• <code className="bg-muted px-1 rounded">bg-warm-800</code></p>
                <p>• <code className="bg-muted px-1 rounded">text-amber-400</code></p>
                <p>• <code className="bg-muted px-1 rounded">border-brown-600</code></p>
                <p>• <code className="bg-muted px-1 rounded">hover:bg-warm-700</code></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 