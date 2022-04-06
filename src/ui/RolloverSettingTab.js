import { Setting, PluginSettingTab } from 'obsidian'
import { getDailyNoteSettings } from 'obsidian-daily-notes-interface'

export default class RolloverSettingTab extends PluginSettingTab {
  constructor (app, plugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  async getTemplateHeadings () {
    const { template } = getDailyNoteSettings()
    if (!template) return []

    let file = this.app.vault.getAbstractFileByPath(template)
    if (file == null) {
      file = this.app.vault.getAbstractFileByPath(template + '.md')
    }

    const templateContents = await this.app.vault.cachedRead(file)
    const allHeadings = Array.from(templateContents.matchAll(/#{1,} .*/g)).map(
      ([heading]) => heading
    )
    return allHeadings
  }

  async display () {
    const templateHeadings = await this.getTemplateHeadings()

    this.containerEl.empty()
    const headingDoc = `
    Which heading from your template should the todos go under. 
    ~~>_<~~ 1. 
    set -> '## todo'(recommended): 
    you will get all the todo under '## todo' till the next '##' tag like '## boring' 
    ~~>_<~~ 2. 
    Set -> none: 
    all the todos will be add to the end of today's diary
    `
    const delDesc = `
    Once todos are found, they are added to Today's Daily Note. 
    If successful, they are deleted from Yesterday's Daily note. 
    Enabling this is destructive and may result in lost data. 
    Keeping this disabled will simply duplicate them from yesterday's note and place them in the appropriate section. 
    Note that currently, duplicate todos will be deleted regardless of what heading they are in, and which heading you choose from above.
    `
    new Setting(this.containerEl)
      .setName('Template heading')
      .setDesc(headingDoc)
      .addDropdown(dropdown =>
        dropdown
          .addOptions({
            ...templateHeadings.reduce((acc, heading) => {
              acc[heading] = heading
              return acc
            }, {}),
            none: 'None'
          })
          .setValue(this.plugin?.settings.templateHeading)
          .onChange(value => {
            this.plugin.settings.templateHeading = value
            this.plugin.saveSettings()
          })
      )

    new Setting(this.containerEl)
      .setName('Delete todos from previous day')
      .setDesc(delDesc)
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.deleteOnComplete || false)
          .onChange(value => {
            this.plugin.settings.deleteOnComplete = value
            this.plugin.saveSettings()
          })
      )

    new Setting(this.containerEl)
      .setName('Remove empty todos in rollover')
      .setDesc(
        `If you have empty todos, they will not be rolled over to the next day.`
      )
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.removeEmptyTodos || false)
          .onChange(value => {
            this.plugin.settings.removeEmptyTodos = value
            this.plugin.saveSettings()
          })
      )

    // 是否选择 加上去年今日
    //
    new Setting(this.containerEl)
      .setName('Today in history')
      .setDesc(`Display today in history in the end of the file`)
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.displayTodayInHistory || false)
          .onChange(value => {
            this.plugin.settings.displayTodayInHistory = value
            this.plugin.saveSettings()
          })
      )

    // 指定header
    new Setting(this.containerEl)
      .setName('Custom today in history')
      .setDesc('Used for the header of history  (default ## Today in history)')
      .addText(text =>
        text
          .setPlaceholder(`start with #`)
          .setValue(
            this.plugin.settings.todayHistoryHeader || '## Today in history'
          )
          .onChange(value => {
            this.plugin.settings.todayHistoryHeader = value
            this.plugin.saveSettings()
          })
      )

    // 去年今日是否需要直接显示
    //
    new Setting(this.containerEl)
      .setName('History Content')
      .setDesc(`Display today in history content.`)
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.historyShowDirect || false)
          .onChange(value => {
            this.plugin.settings.historyShowDirect = value
            this.plugin.saveSettings()
          })
      )

    // 去年今日的 数量 默认1
    //
    new Setting(this.containerEl)
      .setName('History Count')
      .setDesc(`years you want to display in today in history section.`)
      .addDropdown(dropdown =>
        dropdown
          .addOptions({
            1: '1 year',
            2: '2 years',
            3: '3 years',
            4: '4 years',
            5: '5 years'
          })
          .setValue(this.plugin?.settings.todayHistoryCount || 1)
          .onChange(value => {
            this.plugin.settings.todayHistoryCount = value
            this.plugin.saveSettings()
          })
      )
  }
}
