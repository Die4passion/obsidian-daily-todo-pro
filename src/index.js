import { Notice, Plugin, Setting, PluginSettingTab } from 'obsidian'
import {
  getDailyNoteSettings,
  getAllDailyNotes,
  getDailyNote
} from 'obsidian-daily-notes-interface'
import UndoModal from './ui/UndoModal'
import RolloverSettingTab from './ui/RolloverSettingTab'

const MAX_TIME_SINCE_CREATION = 5000 // 5 seconds
// Just some boilerplate code for recursively going through subheadings for later
// function createRepresentationFromHeadings (headings) {
//   let i = 0
//   const tags = []

//   ;(function recurse (depth) {
//     let unclosedLi = false
//     while (i < headings.length) {
//       const [hashes, data] = headings[i].split('# ')
//       if (hashes.length < depth) {
//         break
//       } else if (hashes.length === depth) {
//         if (unclosedLi) tags.push('</li>')
//         unclosedLi = true
//         tags.push('<li>', data)
//         i++
//       } else {
//         tags.push('<ul>')
//         recurse(depth + 1)
//         tags.push('</ul>')
//       }
//     }
//     if (unclosedLi) tags.push('</li>')
//   })(-1)
//   return tags.join('\n')
// }

export default class RolloverTodosPlugin extends Plugin {
  async loadSettings () {
    const DEFAULT_SETTINGS = {
      templateHeading: 'none',
      deleteOnComplete: false,
      removeEmptyTodos: false,
      displayTodayInHistory: false,
      todayHistoryHeader: '## Today in history',
      historyShowDirect: false,
      todayHistoryCount: '1'
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings () {
    await this.saveData(this.settings)
  }

  isDailyNotesEnabled () {
    const dailyNotesPlugin = this.app.internalPlugins.plugins['daily-notes']
    const dailyNotesEnabled = dailyNotesPlugin && dailyNotesPlugin.enabled

    const periodicNotesPlugin = this.app.plugins.getPlugin('periodic-notes')
    const periodicNotesEnabled =
      periodicNotesPlugin && periodicNotesPlugin.settings?.daily?.enabled

    return dailyNotesEnabled || periodicNotesEnabled
  }

  shuffle (array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1)) // 从 0 到 i 的随机索引

      // 交换元素 array[i] 和 array[j]
      // 我们使用“解构分配（destructuring assignment）”语法来实现它
      // 你将在后面的章节中找到有关该语法的更多详细信息
      // 可以写成：
      // let t = array[i]; array[i] = array[j]; array[j] = t
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  // createSelectedFileStore () {
  //   const store = writable(null)
  //   return Object.assign(
  //     {
  //       setFile: file => {
  //         const id = getDateUIDFromFile(file)
  //         store.set(id)
  //       }
  //     },
  //     store
  //   )
  // }

  getLastDailyNote (random = false) {
    const { moment } = window
    const { folder, format } = getDailyNoteSettings()

    // get all notes in directory that aren't null
    const dailyNoteFiles = this.app.vault
      .getAllLoadedFiles()
      .filter(file => file.path.startsWith(folder))
      .filter(file => file.basename != null)

    // remove notes that are from the future
    const todayMoment = moment()
    let dailyNotesTodayOrEarlier = []
    dailyNoteFiles.forEach(file => {
      if (moment(file.basename, format).isSameOrBefore(todayMoment, 'day')) {
        dailyNotesTodayOrEarlier.push(file)
      }
    })

    // sort by date
    const sorted = dailyNotesTodayOrEarlier.sort(
      (a, b) =>
        moment(b.basename, format).valueOf() -
        moment(a.basename, format).valueOf()
    )
    if (random === false) {
      return sorted[1]
    } else {
      sorted.shift()
      // sorted.shift()
      // console.log(sorted)
      this.shuffle(sorted)
      return sorted[0]
    }
  }

  async getAllUnfinishedTodos (file, templateHeading) {
    // get unfinished todos from yesterday, if exist
    const contents = await this.app.vault.read(file)
    // 标签# 长度

    // check if there is a daily note from yesterday

    let unfinishedTodosRegex = /\t*- \[ \].*/g
    let my_todo = []

    if (templateHeading !== 'none') {
      const templateHeadingLength = templateHeading.match(/#{1,}/)[0].length
      unfinishedTodosRegex = new RegExp(
        '\\t*((- \\[ \\])|(#{' + String(templateHeadingLength) + ',})) .*',
        'g'
      )
      // console.log(unfinishedTodosRegex)
      const my_headerIdentify = '#'.repeat(templateHeadingLength) + ' '
      let header_count = 0
      let my_todo_start_now = false

      let todos_yesterday = Array.from(
        contents.matchAll(unfinishedTodosRegex),
        m => m[0]
      )

      for (let i = 0; i < todos_yesterday.length; i++) {
        // 1. 筛选 等于templateHeading才开始循环
        if (todos_yesterday[i].startsWith(templateHeading)) {
          my_todo_start_now = true
          continue
        }
        if (my_todo_start_now) {
          if (todos_yesterday[i].startsWith(my_headerIdentify)) {
            if (header_count > 0) {
              break
            }
            header_count++
          } else {
            if (todos_yesterday[i].startsWith('# ')) {
              if (i > 0 && todos_yesterday[i - 1].endsWith('\n')) {
                todos_yesterday[i] = todos_yesterday[i] + '\n'
              } else {
                todos_yesterday[i] = '\n' + todos_yesterday[i] + '\n'
              }
            }
          }
          my_todo.push(todos_yesterday[i])
        }
      }

      // for (let todo of todos_yesterday) {
      //   if (todo.startsWith(my_headerIdentify)) {
      //     if (header_count > 0) {
      //       break
      //     }
      //     header_count++
      //   } else {
      //     if (todo.startsWith('#')) {
      //       todo = '\n' + todo + '\n'
      //     }
      //     // 如果连续的# 没有 - [] 会多一个空行
      //     //
      //     my_todo.push(todo)
      //   }
      // }
    } else {
      my_todo = Array.from(contents.matchAll(unfinishedTodosRegex), m => m[0])
    }

    // console.log(contents)
    // const unfinishedTodosRegex = /\t*- \[ \].*/g
    // const unfinishedTodos = Array.from(
    //   contents.matchAll(unfinishedTodosRegex)
    // ).map(([todo]) => todo)

    return my_todo
  }

  // async sortHeadersIntoHeirarchy (file) {
  //   ///console.log('testing')
  //   const templateContents = await this.app.vault.read(file)
  //   const allHeadings = Array.from(templateContents.matchAll(/#{1,} .*/g)).map(
  //     ([heading]) => heading
  //   )

  //   console.log(allHeadings)

  //   if (allHeadings.length > 0) {
  //     console.log(createRepresentationFromHeadings(allHeadings))
  //   }
  // }

  async rollover (file = undefined) {
    /*** First we check if the file created is actually a valid daily note ***/
    const { folder, format } = getDailyNoteSettings()
    let ignoreCreationTime = false

    // Rollover can be called, but we need to get the daily file
    if (file == undefined) {
      const allDailyNotes = getAllDailyNotes()
      file = getDailyNote(window.moment(), allDailyNotes)
      ignoreCreationTime = true
    }
    if (!file) return

    // is a daily note
    if (!file.path.startsWith(folder)) return

    // is today's daily note
    const today = new Date()
    const todayFormatted = window.moment(today).format(format)
    if (todayFormatted !== file.basename) return

    // was just created
    if (
      today.getTime() - file.stat.ctime > MAX_TIME_SINCE_CREATION &&
      !ignoreCreationTime
    )
      return

    /*** Next, if it is a valid daily note, but we don't have daily notes enabled, we must alert the user ***/
    if (!this.isDailyNotesEnabled()) {
      new Notice(
        'RolloverTodosPlugin unable to rollover unfinished todos: Please enable Daily Notes, or Periodic Notes (with daily notes enabled).',
        10000
      )
    } else {
      const {
        templateHeading,
        deleteOnComplete,
        removeEmptyTodos,
        displayTodayInHistory,
        todayHistoryHeader,
        historyShowDirect,
        todayHistoryCount
      } = this.settings

      // check if there is a daily note from yesterday
      const lastDailyNote = this.getLastDailyNote()
      if (lastDailyNote == null) return

      // TODO: Rollover to subheadings (optional)
      // this.sortHeadersIntoHeirarchy(lastDailyNote)

      // get unfinished todos from yesterday, if exist
      let todos_yesterday = await this.getAllUnfinishedTodos(
        lastDailyNote,
        templateHeading
      )
      if (todos_yesterday.length == 0) {
        console.log(
          `rollover-daily-todos: 0 todos found in ${lastDailyNote.basename}.md`
        )
        return
      }

      // setup undo history
      let undoHistoryInstance = {
        previousDay: {
          file: undefined,
          oldContent: ''
        },
        today: {
          file: undefined,
          oldContent: ''
        }
      }

      // Potentially filter todos from yesterday for today
      let todosAdded = 0
      let emptiesToNotAddToTomorrow = 0
      let todos_today = !removeEmptyTodos ? todos_yesterday : []
      if (removeEmptyTodos) {
        todos_yesterday.forEach((line, i) => {
          const trimmedLine = (line || '').trim()
          if (trimmedLine != '- [ ]' && trimmedLine != '- [  ]') {
            todos_today.push(line)
            todosAdded++
          } else {
            emptiesToNotAddToTomorrow++
          }
        })
      } else {
        todosAdded = todos_yesterday.length
      }

      // get today's content and modify it
      let templateHeadingNotFoundMessage = ''
      const templateHeadingSelected = templateHeading !== 'none'


      if (todos_today.length > 0) {
        let dailyNoteContent = await this.app.vault.read(file)
        undoHistoryInstance.today = {
          file: file,
          oldContent: `${dailyNoteContent}`
        }
        let todos_todayString = `\n${todos_today.join('\n')}`

        // '\n' + [[20210403]] + '\n'

        // If template heading is selected, try to rollover to template heading
        if (templateHeadingSelected) {
          const contentAddedToHeading = dailyNoteContent.replace(
            templateHeading,
            `${templateHeading}${todos_todayString}`
          )
          if (contentAddedToHeading == dailyNoteContent) {
            templateHeadingNotFoundMessage = `Rollover couldn't find '${templateHeading}' in today's daily not. Rolling todos to end of file.`
          } else {
            dailyNoteContent = contentAddedToHeading
          }
        }

        // Rollover to bottom of file if no heading found in file, or no heading selected
        if (
          !templateHeadingSelected ||
          templateHeadingNotFoundMessage.length > 0
        ) {
          dailyNoteContent += todos_todayString
        }

        // 是否选择去年今日

        // 如果选择去年今日

        /**
         * 1. 显示几年？
         * 2. 默认显示1年
         * 3. 最多显示5年
         * 4. 显示双链还是反链
         * 5. 标题自定义
         */
        if (displayTodayInHistory) {
          let lastYearToday = ['\n' + todayHistoryHeader + '\n']

          // const today = new Date()

          const now = window.moment()
          const [year, month, day] = now.format('YYYY-MM-DD').split('-')

          // 显示双链还是反链
          let historyBeginWith = `- [[`
          if (historyShowDirect) {
            historyBeginWith = `- ![[`
          }

          for (let i = 1; i <= todayHistoryCount; i++) {
            // if (historyShowDirect) {
            lastYearToday.push(
              `${historyBeginWith}${year - i}-${month}-${day}]]`
            )
            // }
          }

          const lastYearToday_String = `\n${lastYearToday.join('\n')}`


          dailyNoteContent += lastYearToday_String
        }
        // return

        // 最终执行 更改文件
        await this.app.vault.modify(file, dailyNoteContent)
      }

      // if deleteOnComplete, get yesterday's content and modify it
      if (deleteOnComplete) {
        let lastDailyNoteContent = await this.app.vault.read(lastDailyNote)
        undoHistoryInstance.previousDay = {
          file: lastDailyNote,
          oldContent: `${lastDailyNoteContent}`
        }
        let lines = lastDailyNoteContent.split('\n')

        for (let i = lines.length; i >= 0; i--) {
          if (todos_yesterday.includes(lines[i])) {
            lines.splice(i, 1)
          }
        }

        const modifiedContent = lines.join('\n')

        await this.app.vault.modify(lastDailyNote, modifiedContent)
      }

      // Let user know rollover has been successful with X todos
      const todosAddedString =
        todosAdded == 0
          ? ''
          : `- ${todosAdded} todo${todosAdded > 1 ? 's' : ''} rolled over.`
      const emptiesToNotAddToTomorrowString =
        emptiesToNotAddToTomorrow == 0
          ? ''
          : deleteOnComplete
          ? `- ${emptiesToNotAddToTomorrow} empty todo${
              emptiesToNotAddToTomorrow > 1 ? 's' : ''
            } removed.`
          : ''
      const part1 =
        templateHeadingNotFoundMessage.length > 0
          ? `${templateHeadingNotFoundMessage}`
          : ''
      const part2 = `${todosAddedString}${
        todosAddedString.length > 0 ? ' ' : ''
      }`
      const part3 = `${emptiesToNotAddToTomorrowString}${
        emptiesToNotAddToTomorrowString.length > 0 ? ' ' : ''
      }`

      let allParts = [part1, part2, part3]
      let nonBlankLines = []
      allParts.forEach(part => {
        if (part.length > 0) {
          nonBlankLines.push(part)
        }
      })

      const message = nonBlankLines.join('\n')
      if (message.length > 0) {
        new Notice(message, 4000 + message.length * 3)
      }
      this.undoHistoryTime = new Date()
      this.undoHistory = [undoHistoryInstance]
    }
  }

  async onload () {
    await this.loadSettings()
    this.undoHistory = []
    this.undoHistoryTime = new Date()

    this.addSettingTab(new RolloverSettingTab(this.app, this))

    this.registerEvent(
      this.app.vault.on('create', async file => {
        this.rollover(file)
      })
    )

    this.addCommand({
      id: 'obsidian-daily-todo-pro-rollover',
      name: 'Rollover Todos Now',
      callback: () => this.rollover()
    })

    this.addCommand({
      id: 'obsidian-daily-todo-pro-random',
      name: 'Lucky Note',
      callback: () => {
        // const activeFile = this.createSelectedFileStore();
        const existingFile = this.getLastDailyNote(1)
        const { workspace } = this.app
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // const mode = this.app.vault.getConfig("defaultViewMode");
        const leaf = workspace.getUnpinnedLeaf()
        leaf.openFile(existingFile)
        // activeFile.setFile(existingFile);
      }
    })

    this.addCommand({
      id: 'obsidian-daily-todo-pro-undo',
      name: 'Undo last rollover',
      checkCallback: checking => {
        // no history, don't allow undo
        if (this.undoHistory.length > 0) {
          const now = window.moment()
          const lastUse = window.moment(this.undoHistoryTime)
          const diff = now.diff(lastUse, 'seconds')
          // 5+ mins since use: don't allow undo
          if (diff > 5 * 60) {
            return false
          }
          if (!checking) {
            new UndoModal(this).open()
          }
          return true
        }
        return false
      }
    })
  }
}
