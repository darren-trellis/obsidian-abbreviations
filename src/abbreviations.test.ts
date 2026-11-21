import { describe, expect, it } from 'vitest'
import {
  getAbbreviations,
  toStringList,
  withAbbreviations,
} from './abbreviations'

describe('toStringList', () => {
  it('should keep list items as they are', () => {
    expect(toStringList(['MK', 'Mortal, Kombat'])).toEqual([
      'MK',
      'Mortal, Kombat',
    ])
  })

  it('should split a single string on commas', () => {
    expect(toStringList('MK, MK1')).toEqual(['MK', 'MK1'])
  })

  it('should keep numbers and drop empty or unsupported values', () => {
    expect(toStringList([42, '', ' ', null, { a: 1 }])).toEqual(['42'])
    expect(toStringList(null)).toEqual([])
  })
})

describe('getAbbreviations', () => {
  it('should read the property case-insensitively', () => {
    expect(
      getAbbreviations({ Abbreviations: ['MK'] }, 'abbreviations')
    ).toEqual(['MK'])
  })

  it('should return nothing without a property name or value', () => {
    expect(getAbbreviations({ abbreviations: ['MK'] }, ' ')).toEqual([])
    expect(getAbbreviations({ other: ['MK'] }, 'abbreviations')).toEqual([])
    expect(getAbbreviations(undefined, 'abbreviations')).toEqual([])
  })
})

describe('withAbbreviations', () => {
  it('should add abbreviations to the existing aliases', () => {
    const cache = {
      frontmatter: { aliases: ['Mortal Kombat 1'], abbreviations: ['MK1'] },
    }
    expect(withAbbreviations(cache, 'abbreviations').frontmatter).toEqual({
      aliases: ['Mortal Kombat 1', 'MK1'],
      abbreviations: ['MK1'],
    })
  })

  it('should merge a singular alias property into aliases', () => {
    const cache = { frontmatter: { alias: 'MK, Kombat', abbreviations: 'MK' } }
    expect(withAbbreviations(cache, 'abbreviations').frontmatter).toEqual({
      abbreviations: 'MK',
      aliases: ['MK', 'Kombat'],
    })
  })

  it('should not modify the original metadata', () => {
    const cache = {
      headings: [],
      frontmatter: { aliases: ['A'], abbreviations: ['B'] },
    }
    const result = withAbbreviations(cache, 'abbreviations')
    expect(result).not.toBe(cache)
    expect(result.headings).toBe(cache.headings)
    expect(cache.frontmatter.aliases).toEqual(['A'])
  })

  it('should return the same metadata when there are no abbreviations', () => {
    const cache = { frontmatter: { aliases: ['A'] } }
    expect(withAbbreviations(cache, 'abbreviations')).toBe(cache)
    const empty = {}
    expect(withAbbreviations(empty, 'abbreviations')).toBe(empty)
  })
})
