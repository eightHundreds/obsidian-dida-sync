# 滴答清单同步

[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg?style=flat-square)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

单向同步(滴答清单->obsidian)


if you use ticktick read this!!!! -> [English](./README.EN.md)

## 快速手上

0. 在配置中输入滴答清单账号密码，确保这个账号密码能在 https://dida365.com/signin 登录

1. 创建一个笔记,在笔记头部加上配置
```
---
dida: true
---
```
2. 执行命令`Dida Todo Sync: 同步待办`
**默认行为**

- 默认同步半年内的所有待办(包括已完成,未完成,不包括放弃的)
- 按时间降序排序

# 配置
配置在笔记头部的front-matter

- dida: 这篇笔记是否开启滴答清单同步
    - projectId: 项目id, 过滤出指定清单下的内容, projectId需要到滴答清单web版获取
    ![](./docs/dida.jpg)
    - tags: 过滤出包含指定标签内容, 数组类型
    - excludeTags：需要排除的标签，当任务的标签包含了excludeTags，那么这个任务是将被排除
    - startDate: 同步从哪天开始到现在的内容. 默认是半年前
    - taskId: 任务id,同步指定任务
    ![](./docs/task-dida.jpg)
    - status: 任务状态,支持 `uncompleted` 和 `completed`


## 举例

(要求 Obsidian 1.4.0)

**简单配置**
```
dida: true
```

<img width="546" alt="image" src="https://github.com/eightHundreds/obsidian-dida-sync/assets/18695431/fba6522d-4676-4179-92e0-a37742e3430c">

**配置projectId和tags**

```
dida.projectId: xxx
dida.tags:
    - 标签1
    - 标签2
dida.startDate: 2023-01-01
```

<img width="557" alt="image" src="https://github.com/eightHundreds/obsidian-dida-sync/assets/18695431/a2349208-3335-4fcb-9e2c-dee9ae18f4ab">



### 废弃的配置方式

**简单配置**

```
dida: true
```

**配置projectId和tags**

```
dida: 
  projectId: xxx
  tags: 
    - 标签1
    - 标签2
  startDate: 2023-01-01
```
(注意缩进是2个空格)

# TODO  

- [x] star过10个补充文档
- [x] star过20支持ticktick, 上架obsidian([进行中](https://github.com/obsidianmd/obsidian-releases/pull/2193))
