import {
  type CachedMetadata,
  debounce,
  type MetadataCache,
  Notice,
  Plugin,
} from 'obsidian'
import { getAbbreviations, withAbbreviations } from './abbreviations'
import {
  type AbbreviationsSettings,
  AbbreviationsSettingTab,
  DEFAULT_SETTINGS,
} from './settings'

type OmnisearchApi = {
  registerOnIndexed(cb: () => void): void
  unregisterOnIndexed(cb: () => void): void
  reindexNotes?: (paths: string[]) => Promise<void>
}

type GetCache = (this: MetadataCache, path: string) => CachedMetadata | null

export default class AbbreviationsPlugin extends Plugin {
  settings: AbbreviationsSettings = { ...DEFAULT_SETTINGS }
  private withAbbreviationsCache = new WeakMap<CachedMetadata, CachedMetadata>()
  private omnisearchSync: Promise<void> = Promise.resolve()
  private requestOmnisearchSync = debounce(
    () => void this.syncOmnisearch(),
    2000,
    true
  )

  async onload(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<AbbreviationsSettings> | null
    )

    this.patchMetadataCache()
    this.addSettingTab(new AbbreviationsSettingTab(this.app, this))

    this.addCommand({
      id: 'update-omnisearch-index',
      name: 'Re-index notes in Omnisearch',
      callback: () => void this.syncOmnisearch(true),
    })

    this.app.workspace.onLayoutReady(() => this.syncWhenOmnisearchIsIndexed())
  }

  async setFieldName(fieldName: string): Promise<void> {
    this.settings.fieldName = fieldName
    this.withAbbreviationsCache = new WeakMap()
    await this.saveData(this.settings)
    this.requestOmnisearchSync()
  }

  /**
   * Obsidian has no API to add aliases at runtime, so the metadata cache
   * lookup is wrapped to return a copy with the abbreviations added as aliases
   */
  private patchMetadataCache(): void {
    const { metadataCache } = this.app
    const original: GetCache = Reflect.get(metadataCache, 'getCache')
    const hadOwnGetCache = Object.hasOwn(metadataCache, 'getCache')
    const addAbbreviations = (cache: CachedMetadata) =>
      this.addAbbreviations(cache)
    let active = true

    const patched: GetCache = function (path) {
      const cache = original.call(this, path)
      return active && cache ? addAbbreviations(cache) : cache
    }
    metadataCache.getCache = patched

    this.register(() => {
      active = false
      if (metadataCache.getCache !== patched) return
      if (hadOwnGetCache) {
        metadataCache.getCache = original
      } else {
        Reflect.deleteProperty(metadataCache, 'getCache')
      }
    })
  }

  private addAbbreviations(cache: CachedMetadata): CachedMetadata {
    let result = this.withAbbreviationsCache.get(cache)
    if (!result) {
      result = withAbbreviations(cache, this.settings.fieldName)
      this.withAbbreviationsCache.set(cache, result)
    }
    return result
  }

  private getOmnisearch(): OmnisearchApi | undefined {
    return (window as unknown as { omnisearch?: OmnisearchApi }).omnisearch
  }

  private syncWhenOmnisearchIsIndexed(): void {
    const omnisearch = this.getOmnisearch()
    if (!omnisearch) return
    const onIndexed = () => void this.syncOmnisearch()
    omnisearch.registerOnIndexed(onIndexed)
    this.register(() => omnisearch.unregisterOnIndexed(onIndexed))
  }

  /**
   * Omnisearch only re-indexes notes whose files changed, so notes it indexed
   * before the property name was set must be re-indexed explicitly
   */
  syncOmnisearch(force = false): Promise<void> {
    this.omnisearchSync = this.omnisearchSync
      .then(() => this.updateOmnisearchIndex(force))
      .catch(e => console.error('Abbreviations - Omnisearch update failed', e))
    return this.omnisearchSync
  }

  private async updateOmnisearchIndex(force: boolean): Promise<void> {
    const fieldName = this.settings.fieldName.trim()
    const { indexedFieldName } = this.settings
    if (!force && fieldName === indexedFieldName) return

    const omnisearch = this.getOmnisearch()
    if (!omnisearch?.reindexNotes) {
      if (force) {
        new Notice(
          'Abbreviations - Omnisearch is not enabled, or this version cannot re-index notes.'
        )
      }
      return
    }

    const fields = [fieldName, indexedFieldName ?? ''].filter(Boolean)
    const paths = this.app.vault
      .getMarkdownFiles()
      .filter(file => {
        const frontmatter =
          this.app.metadataCache.getFileCache(file)?.frontmatter
        return fields.some(f => getAbbreviations(frontmatter, f).length > 0)
      })
      .map(file => file.path)

    if (paths.length) {
      await omnisearch.reindexNotes(paths)
    }
    this.settings.indexedFieldName = fieldName
    await this.saveData(this.settings)
    if (force) {
      new Notice(`Abbreviations - updated ${paths.length} notes in Omnisearch.`)
    }
  }
}
