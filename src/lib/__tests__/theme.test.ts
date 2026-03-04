import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const projectRoot = resolve(__dirname, '../../..')

function readFile(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), 'utf-8')
}

describe('Theme CSS variables and Tailwind config consistency', () => {
  it('tailwind.config.js references all --color-* variables defined in theme.css', () => {
    const themeCss = readFile('src/styles/theme.css')
    const tailwindConfig = readFile('tailwind.config.js')

    // Extract all --color-* variable names defined in theme.css
    const colorVarRegex = /(--color-[\w-]+)\s*:/g
    const definedVars = new Set<string>()
    let match: RegExpExecArray | null
    while ((match = colorVarRegex.exec(themeCss)) !== null) {
      definedVars.add(match[1])
    }

    expect(definedVars.size).toBeGreaterThan(0)

    // Every --color-* variable should be referenced (used) in tailwind.config.js
    for (const varName of definedVars) {
      expect(
        tailwindConfig,
        `tailwind.config.js should reference CSS variable "${varName}"`
      ).toContain(varName)
    }
  })

  it('tailwind.config.js defines custom font sizes for the typographic scale', () => {
    const tailwindConfig = readFile('tailwind.config.js')

    const expectedFontSizes = ['body', 'lg', 'xl', '2xl']
    for (const size of expectedFontSizes) {
      expect(
        tailwindConfig,
        `tailwind.config.js should define fontSize "${size}"`
      ).toContain(`'${size}'`)
    }
  })

  it('tailwind.config.js defines custom line heights', () => {
    const tailwindConfig = readFile('tailwind.config.js')

    expect(tailwindConfig).toContain("'body': '1.6'")
    expect(tailwindConfig).toContain("'heading': '1.3'")
  })
})
