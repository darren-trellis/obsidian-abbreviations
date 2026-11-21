import { type App, PluginSettingTab, Setting } from 'obsidian'
import type AbbreviationsPlugin from './main'

export interface AbbreviationsSettings {
  /** Name of the note property that holds abbreviations */
  fieldName: string
  /** Property name that Omnisearch's index was last updated for */
  indexedFieldName: string | null
}

export const DEFAULT_SETTINGS: AbbreviationsSettings = {
  fieldName: 'abbreviations',
  indexedFieldName: null,
}

export class AbbreviationsSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: AbbreviationsPlugin
  ) {
    super(app, plugin)
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    new Setting(containerEl)
      .setName('Abbreviation property')
      .setDesc(
        'Name of the note property that holds abbreviations. Its values are treated as aliases, so Omnisearch finds notes by their abbreviations.'
      )
      .addText(text =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.fieldName)
          .setValue(this.plugin.settings.fieldName)
          .onChange(async value => {
            await this.plugin.setFieldName(value)
          })
      )
  }
}
