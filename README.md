# 滴答清单同步

建议使用[obsidian42-brat](https://github.com/TfTHacker/obsidian42-brat)安装

## 快速手上

0. 在配置中输入滴答清单账号密码

1. 创建一个笔记, 加上配置
```
---
dida: true
---

```
2. 执行命令`Dida Todo Sync: 同步当前笔记`
**默认行为**

- 默认同步半年内的所有待办(无论是否完成)
- 按时间降序排序

# 配置
配置在笔记头部的front-matter

- dida: 这篇笔记是否开启滴答清单同步
- projectId: 项目id, 过滤出指定清单下的内容, projectId需要到滴答清单web版获取
![](./docs/dida.jpg)
- tags: 过滤出包含指定标签内容, 数组类型
- startDate: 同步从哪天开始到现在的内容. 默认是半年前


eg:
```
dida: true
projectId: xxx
tags: 
    - 标签1
    - 标签2
startDate: 2023-01-01
```

# TODO  

- [x] star过10个补充文档
- [ ] star过20支持ticktick, 上架obsidian
