# TickTick Sync for Obsidian

[中文](./README.md)

## Quick Start

0. Enter your TickTick account and password in the settings.
1. Create a note and add the following configuration to the front matter:

```
---
ticktick: true
---
```
2. Execute the command `Dida Todo Sync: Sync ToDo List`.

**Default Behavior**

- Sync all todos within the past six months (regardless of completion status) by default.
- Sort by time in descending order.


# Configuration  

Configuration in the front matter of the note

- ticktick: Whether to enable TickTick synchronization for this note
  - projectId: Project ID, filter out the content under the specified list, projectId needs to be obtained from the web version of TickTick
  ![](./docs/ticktick.jpg)
  - tags: Filter out content containing specified tags, array type
  - startDate: Synchronize content from which day to now. The default is six months ago.
  - taskId: task id sync specified task
    ![](./docs/task-ticktick.jpg)


## Example

**Simple configuration**

```
ticktick: true
```


**Configure projectId and tags**

```
dida: 
  projectId: xxx
  tags: 
    - myTag1
    - myTag2
  startDate: 2023-01-01
```
(Note that the indentation is 2 spaces)
