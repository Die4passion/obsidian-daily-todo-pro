## obsidian 插件 让你的每日日记更好用

- [灵感来自](https://github.com/shichongrui/obsidian-rollover-daily-todos)

> 日记增强，让你更好的处理所有待办

## 主要功能

- 日记自动导入昨日未完成待办。
- 往年今日
- 幸运日记

## 所有功能

- 导入昨日未完成待办
- ***b)*** 导入时删除昨日未完成待办 (可选)
- ***c)*** 忽略空的待办 (可选)
- ***a)*** 从日记模板中选择标题作为你需要同步的待办
  - 不选择 或者 没有模板 则获取全部 待办 并加到文章末尾
  - 如果选择标题，则只选择当前标题下的 待办 并保留子标题，一直截取到下一个同级标题
- ***d)*** 往年今日（底部）
  - ***e)*** 自选标题
  - ***f)*** 自选年份
- 幸运日记
  - 随机显示一篇日记

> 上面的 a b c d e f 对应设置里英文菜单的选项顺序

## 直接食用方法

- 打开 [release页面](https://github.com/Die4passion/obsidian-daily-todo-pro/releases)
- 点击下载 `main.js` `manifest.json` `versions.json` 三个文件
- 文件管理器打开你的 obsidian vault 目录下的  `.obsidian\plugins` 文件夹
- 新建文件夹 `obsidian-daily-pro-todo` ，将刚才下载的3个文件放入 
- 打开 obsidian 设置 第三方插件，选择 `todo -> pro` 打开
- 插件设置就在设置页面了
- 使用下面的命令操作
  
> 已提交pull request，争取能进第三方插件库，加油！

## 命令操作

1. 任意文件输入 `ctrl + p`  或者 `/`
2. 输入 `todo pro`
3. 选择 `Rollover Todos Now` 导入待办
4. 选择 `Undo last rollover` 撤销待办(5分钟以内)
5. 选择 `Lucky Note` 幸运日记

## 示例

- [论坛帖子有操作截图](https://forum-zh.obsidian.md/t/topic/6291)


