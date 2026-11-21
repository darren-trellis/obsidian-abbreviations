type Frontmatter = Record<string, unknown>

const ALIAS_KEY = /^alias(es)?$/i

/**
 * Reads a property value as a list of strings, the way Obsidian reads aliases:
 * a list is taken as is, a single string is split on commas
 */
export function toStringList(value: unknown): string[] {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [value]
  return items
    .filter(item => typeof item === 'string' || typeof item === 'number')
    .map(item => String(item).trim())
    .filter(Boolean)
}

export function getAbbreviations(
  frontmatter: Frontmatter | undefined,
  field: string
): string[] {
  const name = field.trim().toLowerCase()
  if (!frontmatter || !name) return []
  const key = Object.keys(frontmatter).find(k => k.toLowerCase() === name)
  return key === undefined ? [] : toStringList(frontmatter[key])
}

/**
 * Returns a copy of the metadata whose aliases also contain the abbreviations.
 * The original metadata is never modified.
 */
export function withAbbreviations<T extends { frontmatter?: Frontmatter }>(
  cache: T,
  field: string
): T {
  const { frontmatter } = cache
  const abbreviations = getAbbreviations(frontmatter, field)
  if (!frontmatter || !abbreviations.length) return cache

  const aliases: string[] = []
  const rest: Frontmatter = {}
  for (const [key, value] of Object.entries(frontmatter)) {
    if (ALIAS_KEY.test(key)) {
      aliases.push(...toStringList(value))
    } else {
      rest[key] = value
    }
  }

  return {
    ...cache,
    frontmatter: {
      ...rest,
      aliases: [...new Set([...aliases, ...abbreviations])],
    },
  }
}
