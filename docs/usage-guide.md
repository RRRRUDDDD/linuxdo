# Linux.do 自动浏览助手 v2 - 使用指南

## 版本更新 (v2.0)

### 新特性
- **无限滚动支持** - 自动滚动加载更多内容（话题列表和帖子回复）
- **浏览记录标记** - 已浏览的帖子会被标记，避免重复浏览
- **完整回复浏览** - 帖子详情页会滚动浏览所有回复，直到没有更多内容
- **自动返回列表** - 浏览完一个帖子后自动返回列表，继续下一个未浏览的帖子
- **视觉标记** - 已浏览的话题在列表中显示绿色勾号，透明度降低
- **清除记录功能** - 可以清除浏览历史，重新开始

### 工作流程
```
┌─────────────────────────────────────────────────────────┐
│  启动脚本                                                │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│  判断页面类型                                            │
│  - 话题列表页 (/latest, /new, /unread等)                │
│  - 帖子详情页 (/t/topic/xxx)                            │
└────────┬────────────────────────────┬───────────────────┘
         ▼                            ▼
┌─────────────────────┐    ┌─────────────────────────────┐
│  话题列表页          │    │  帖子详情页                  │
│  1. 滚动加载话题     │    │  1. 标记为已浏览             │
│  2. 标记已浏览话题   │    │  2. 从顶部开始滚动           │
│  3. 找到未浏览话题   │    │  3. 浏览每个回复             │
│  4. 点击进入        │    │  4. 随机点赞                 │
└─────────┬───────────┘    │  5. 滚动到底部加载更多       │
          │                │  6. 无更多内容时返回列表      │
          │                └──────────────┬──────────────┘
          │                               │
          └───────────────────────────────┘
                     (循环)
```

## 安装步骤

### 1. 安装 Tampermonkey 扩展

**Chrome 浏览器:**
1. 访问 [Chrome 网上应用店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. 点击"添加到 Chrome"

**Edge 浏览器:**
1. 访问 [Edge 扩展商店](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
2. 点击"获取"

**Firefox 浏览器:**
1. 访问 [Firefox 附加组件](https://addons.mozilla.org/firefox/addon/tampermonkey/)
2. 点击"添加到 Firefox"

### 2. 安装脚本

**方法一：直接导入**
1. 点击浏览器右上角的 Tampermonkey 图标
2. 选择"添加新脚本"
3. 删除编辑器中的默认内容
4. 复制 `src/linuxdo-automation.user.js` 的全部内容粘贴
5. 按 Ctrl+S 保存

**方法二：从文件安装**
1. 点击 Tampermonkey 图标 → 管理面板
2. 点击"实用工具"标签
3. 在"从文件导入"处选择 `linuxdo-automation.user.js` 文件

## 使用方法

### 启动自动浏览

1. 登录 https://linux.do
2. 页面右上角会出现"自动浏览助手"控制面板
3. 点击"开始自动浏览"按钮
4. 脚本会自动:
   - 在话题列表页面随机选择话题进入
   - 在帖子页面自动滚动浏览回复
   - 按概率随机点赞帖子
   - 浏览完成后自动跳转到下一个话题

### 控制面板说明

| 元素 | 说明 |
|------|------|
| 状态指示灯 | 绿色闪烁 = 运行中，红色 = 已停止 |
| 页面类型 | 当前页面类型 (topic = 帖子详情 / list = 话题列表) |
| 本次浏览 | 当前会话已浏览的话题数 |
| 本次点赞 | 当前会话已点赞的帖子数 |
| 总计浏览 | 历史累计浏览的话题数 (存储在本地) |
| 总计点赞 | 历史累计点赞的帖子数 (存储在本地) |
| 清除浏览记录 | 清除所有已浏览标记，允许重新浏览 |
| 最小化按钮 | 点击 `-` 可最小化面板，点击 `+` 展开 |

### 视觉标记

在话题列表页面，已浏览过的话题会有以下标记：
- 透明度降低 (变灰)
- 标题后显示绿色勾号 ✓

### 停止运行

- 点击"停止运行"按钮
- 或刷新页面
- 或关闭浏览器标签页

## 配置参数调整 (v2)

如需修改默认配置，编辑脚本中的 `CONFIG` 对象:

```javascript
const CONFIG = {
  // 滚动设置
  scrollStep: 300,              // 每次滚动距离 (像素)
  scrollInterval: 800,          // 滚动间隔 (毫秒)
  loadWaitTime: 1500,           // 等待新内容加载时间 (毫秒)
  noNewContentRetry: 3,         // 无新内容重试次数 (达到后认为加载完成)

  // 阅读设置
  minReadTime: 2000,            // 最小阅读时间 (毫秒)
  maxReadTime: 5000,            // 最大阅读时间 (毫秒)

  // 点赞设置
  likeChance: 0.15,             // 点赞概率 (0.15 = 15%)
  minLikeInterval: 3000,        // 最小点赞间隔 (毫秒)

  // 会话设置
  maxLikesPerSession: 50,       // 每次会话最大点赞数
  maxTopicsPerSession: 30,      // 每次会话最大浏览话题数

  // 返回列表设置
  returnToListDelay: 2000,      // 返回列表前延迟 (毫秒)

  // 调试
  debug: true                   // 是否在控制台输出日志
};
```

### 推荐配置

**保守模式 (推荐新手):**
```javascript
scrollInterval: 1200,          // 较慢的滚动速度
loadWaitTime: 2000,            // 更长的加载等待
minReadTime: 3000,             // 更长的阅读时间
maxReadTime: 6000,
likeChance: 0.1,               // 10% 点赞概率
maxLikesPerSession: 20,        // 最多20次点赞
maxTopicsPerSession: 15,       // 最多浏览15个话题
```

**正常模式 (默认):**
```javascript
scrollInterval: 800,
loadWaitTime: 1500,
minReadTime: 2000,
maxReadTime: 5000,
likeChance: 0.15,              // 15% 点赞概率
maxLikesPerSession: 50,
maxTopicsPerSession: 30,
```

**快速模式 (谨慎使用):**
```javascript
scrollInterval: 500,           // 更快的滚动
loadWaitTime: 1000,
minReadTime: 1000,             // 更短的阅读时间
maxReadTime: 3000,
likeChance: 0.2,               // 20% 点赞概率
maxLikesPerSession: 80,
maxTopicsPerSession: 50,
noNewContentRetry: 2,          // 更快判断加载完成
```

## 注意事项

### 安全建议

1. **不要长时间连续运行** - 建议每次运行 30-60 分钟后休息
2. **使用保守配置** - 避免触发网站的反滥用机制
3. **保持登录状态** - 脚本需要登录后才能正常工作
4. **定期更新脚本** - 网站更新后可能需要调整选择器

### 常见问题

**Q: 点赞按钮找不到怎么办？**
A: 网站可能更新了页面结构，需要更新脚本中的选择器。打开控制台(F12)查看具体错误。

**Q: 脚本没有反应？**
A: 检查以下几点：
1. 是否已登录 linux.do
2. Tampermonkey 是否启用了脚本
3. 打开浏览器控制台 (F12) 查看日志，搜索 `[LinuxDo自动化]`

**Q: 页面一直在滚动但不进入帖子？**
A: 可能是所有可见话题都已浏览过。尝试：
1. 点击"清除浏览记录"按钮
2. 或切换到其他列表页面 (/new, /unread)

**Q: 帖子浏览不完整就返回了？**
A: 检查 `noNewContentRetry` 配置，增大这个值可以让脚本等待更长时间确认内容加载完成。

**Q: 被限制访问了？**
A: 停止脚本，等待一段时间后再使用，并调整配置：
- 增大 `scrollInterval` (滚动间隔)
- 增大 `minReadTime` (阅读时间)
- 降低 `likeChance` (点赞概率)

**Q: 如何手动清除浏览记录？**
A: 方法1 - 点击控制面板的"清除浏览记录"按钮

方法2 - 打开浏览器控制台，执行:
```javascript
localStorage.removeItem('linuxdo_viewed_topics');
localStorage.removeItem('linuxdo_liked_posts');
localStorage.removeItem('linuxdo_auto_running');
```

**Q: 如何查看已浏览的话题ID？**
A: 打开控制台执行：
```javascript
JSON.parse(localStorage.getItem('linuxdo_viewed_topics'))
```

**Q: 脚本能在后台标签页运行吗？**
A: 浏览器会限制后台标签页的JavaScript执行，建议保持标签页在前台运行。

## 免责声明

1. 本脚本仅供学习研究使用
2. 使用本脚本产生的任何后果由使用者自行承担
3. 请遵守 Linux.do 网站的使用条款
4. 不得用于任何商业目的或恶意行为
