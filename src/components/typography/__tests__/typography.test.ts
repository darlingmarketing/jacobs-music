import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Heading } from '../Heading'
import { Text } from '../Text'

describe('Heading', () => {
  it('renders h1 by default', () => {
    const html = renderToStaticMarkup(createElement(Heading, {}, 'Song Title'))
    expect(html).toContain('<h1')
    expect(html).toContain('Song Title')
  })

  it.each([1, 2, 3, 4] as const)('renders h%i for level %i', (level) => {
    const html = renderToStaticMarkup(createElement(Heading, { level }, `Heading ${level}`))
    expect(html).toContain(`<h${level}`)
    expect(html).toContain(`Heading ${level}`)
  })

  it('applies size classes for each level', () => {
    const levelClasses: Record<number, string> = {
      1: 'text-3xl',
      2: 'text-2xl',
      3: 'text-xl',
      4: 'text-lg',
    }
    for (const [level, cls] of Object.entries(levelClasses)) {
      const html = renderToStaticMarkup(
        createElement(Heading, { level: Number(level) as 1 | 2 | 3 | 4 }, 'Title')
      )
      expect(html, `Level ${level} should have class ${cls}`).toContain(cls)
    }
  })

  it('passes extra className', () => {
    const html = renderToStaticMarkup(
      createElement(Heading, { className: 'my-custom-class' }, 'Title')
    )
    expect(html).toContain('my-custom-class')
  })

  it('matches snapshot for level 1', () => {
    const html = renderToStaticMarkup(createElement(Heading, { level: 1 }, 'Main Title'))
    expect(html).toMatchSnapshot()
  })

  it('matches snapshot for level 2', () => {
    const html = renderToStaticMarkup(createElement(Heading, { level: 2 }, 'Section Title'))
    expect(html).toMatchSnapshot()
  })
})

describe('Text', () => {
  it('renders a p element', () => {
    const html = renderToStaticMarkup(createElement(Text, {}, 'Body text'))
    expect(html).toContain('<p')
    expect(html).toContain('Body text')
  })

  it.each(['sm', 'body', 'base', 'lg'] as const)('renders size %s', (size) => {
    const html = renderToStaticMarkup(createElement(Text, { size }, `${size} text`))
    expect(html).toContain(`${size} text`)
  })

  it('applies muted class when muted=true', () => {
    const html = renderToStaticMarkup(createElement(Text, { muted: true }, 'Muted'))
    expect(html).toContain('text-muted-foreground')
  })

  it('does not apply muted class by default', () => {
    const html = renderToStaticMarkup(createElement(Text, {}, 'Normal'))
    expect(html).not.toContain('text-muted-foreground')
  })

  it('matches snapshot for default props', () => {
    const html = renderToStaticMarkup(createElement(Text, {}, 'Hello world'))
    expect(html).toMatchSnapshot()
  })

  it('matches snapshot for muted body text', () => {
    const html = renderToStaticMarkup(
      createElement(Text, { size: 'lg', muted: true }, 'Secondary info')
    )
    expect(html).toMatchSnapshot()
  })
})
