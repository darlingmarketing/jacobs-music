import { useState } from 'react'
import { Heading } from '@/components/typography/Heading'
import { Text } from '@/components/typography/Text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <Heading level={2}>{title}</Heading>
      <Separator />
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function StyleGuide() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sliderValue, setSliderValue] = useState([50])
  const [switchOn, setSwitchOn] = useState(false)
  const [progressValue] = useState(65)

  return (
    <TooltipProvider>
      <div className="max-w-screen-lg mx-auto px-4 md:px-6 py-8 space-y-12 pb-24 md:pb-8">
        <header>
          <Heading level={1}>Style Guide</Heading>
          <Text size="body" muted>
            A living reference for all design-system components used in Jacobs Music. See{' '}
            <a
              href="https://github.com/yesmannow/jacobs-music/blob/main/docs/UX_GUIDELINES.md"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              UX Guidelines
            </a>{' '}
            for full documentation.
          </Text>
        </header>

        {/* ── Typography ─────────────────────────────────────────── */}
        <Section title="Typography">
          <Heading level={1}>Heading 1 – Page titles</Heading>
          <Heading level={2}>Heading 2 – Section headings</Heading>
          <Heading level={3}>Heading 3 – Card headings</Heading>
          <Heading level={4}>Heading 4 – Labels and sub-sections</Heading>
          <Text size="lg">Text lg – Slightly larger body copy</Text>
          <Text size="base">Text base – Default body copy</Text>
          <Text size="body">Text body – General prose (0.95 rem)</Text>
          <Text size="sm" muted>Text sm muted – Supporting / helper text</Text>
          <p className="font-mono text-sm">font-mono – Code and chord labels</p>
        </Section>

        {/* ── Colour Swatches ─────────────────────────────────────── */}
        <Section title="Colour Tokens">
          <div className="flex flex-wrap gap-3">
            {[
              { name: 'background', bg: 'bg-background', text: 'text-foreground' },
              { name: 'foreground', bg: 'bg-foreground', text: 'text-background' },
              { name: 'card', bg: 'bg-card', text: 'text-card-foreground' },
              { name: 'primary', bg: 'bg-primary', text: 'text-primary-foreground' },
              { name: 'secondary', bg: 'bg-secondary', text: 'text-secondary-foreground' },
              { name: 'muted', bg: 'bg-muted', text: 'text-muted-foreground' },
              { name: 'accent', bg: 'bg-accent', text: 'text-accent-foreground' },
              { name: 'destructive', bg: 'bg-destructive', text: 'text-destructive-foreground' },
              { name: 'border', bg: 'bg-border', text: 'text-foreground' },
            ].map(({ name, bg, text }) => (
              <div
                key={name}
                className={`${bg} ${text} border border-border rounded-md px-4 py-3 text-xs font-mono min-w-[100px] text-center`}
              >
                {name}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Buttons ─────────────────────────────────────────────── */}
        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Icon only">✦</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>Outline disabled</Button>
          </div>
        </Section>

        {/* ── Badges ──────────────────────────────────────────────── */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        {/* ── Inputs ──────────────────────────────────────────────── */}
        <Section title="Inputs">
          <div className="grid gap-4 max-w-md">
            <div className="space-y-1">
              <Label htmlFor="sg-text">Text input</Label>
              <Input id="sg-text" placeholder="Placeholder text…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sg-textarea">Textarea</Label>
              <Textarea id="sg-textarea" placeholder="Multi-line input…" rows={3} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sg-select">Select</Label>
              <Select>
                <SelectTrigger id="sg-select">
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Option A</SelectItem>
                  <SelectItem value="b">Option B</SelectItem>
                  <SelectItem value="c">Option C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Slider – {sliderValue[0]}%</Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={sliderValue}
                onValueChange={setSliderValue}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sg-switch" checked={switchOn} onCheckedChange={setSwitchOn} />
              <Label htmlFor="sg-switch">Toggle switch {switchOn ? '(on)' : '(off)'}</Label>
            </div>
          </div>
        </Section>

        {/* ── Cards ───────────────────────────────────────────────── */}
        <Section title="Cards">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-6 space-y-2">
              <Heading level={3}>Standard card</Heading>
              <Text size="body" muted>Use p-6 for default inner padding.</Text>
            </Card>
            <Card className="p-4 space-y-2">
              <Heading level={4}>Compact card</Heading>
              <Text size="sm" muted>Use p-4 for compact contexts.</Text>
            </Card>
          </div>
        </Section>

        {/* ── Progress ────────────────────────────────────────────── */}
        <Section title="Progress">
          <div className="max-w-sm space-y-2">
            <Text size="sm" muted>{progressValue}% complete</Text>
            <Progress value={progressValue} />
          </div>
        </Section>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <Section title="Tabs">
          <Tabs defaultValue="tab1" className="max-w-md">
            <TabsList>
              <TabsTrigger value="tab1">Overview</TabsTrigger>
              <TabsTrigger value="tab2">Details</TabsTrigger>
              <TabsTrigger value="tab3">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-4">
              <Text size="body">Overview tab content.</Text>
            </TabsContent>
            <TabsContent value="tab2" className="mt-4">
              <Text size="body">Details tab content.</Text>
            </TabsContent>
            <TabsContent value="tab3" className="mt-4">
              <Text size="body">Settings tab content.</Text>
            </TabsContent>
          </Tabs>
        </Section>

        {/* ── Tooltip ─────────────────────────────────────────────── */}
        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>This is a tooltip</TooltipContent>
          </Tooltip>
        </Section>

        {/* ── Dialog ──────────────────────────────────────────────── */}
        <Section title="Dialog (Modal)">
          <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Example modal</DialogTitle>
              </DialogHeader>
              <Text size="body" muted>
                Modal body content goes here. Use <code className="font-mono text-xs">max-w-md</code> for
                standard dialogs.
              </Text>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        {/* ── List pattern ────────────────────────────────────────── */}
        <Section title="List Pattern">
          <Card>
            <ul className="divide-y divide-border">
              {['Song A – Artist X', 'Song B – Artist Y', 'Song C – Artist Z'].map(item => (
                <li key={item} className="flex items-center gap-4 py-3 px-4">
                  <span className="flex-1 text-sm font-medium">{item}</span>
                  <Badge variant="secondary">saved</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </Section>

        {/* ── Spacing reference ───────────────────────────────────── */}
        <Section title="Spacing Scale">
          <div className="space-y-2">
            {[1, 2, 3, 4, 6, 8, 12, 16].map(step => (
              <div key={step} className="flex items-center gap-4">
                <span className="font-mono text-xs text-muted-foreground w-8">p-{step}</span>
                <div
                  className="bg-primary/20 border border-primary/40 rounded"
                  style={{ height: '1rem', width: `calc(${step} * 0.25rem * 4)` }}
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {step * 0.25} rem
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </TooltipProvider>
  )
}
