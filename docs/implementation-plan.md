# Linux.do 自动化浏览实现方案 v2

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    LinuxDoAutomation                        │
│                      (主控制器)                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Storage    │  │  Browsing   │  │  ScrollController   │ │
│  │  (存储管理)  │  │  History    │  │  (滚动控制)          │ │
│  │             │  │  (浏览记录)  │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │   TopicBrowser       │  │   TopicListBrowser       │    │
│  │   (帖子详情浏览器)    │  │   (话题列表浏览器)        │    │
│  │                      │  │                          │    │
│  │  - 滚动浏览回复       │  │  - 滚动加载话题          │    │
│  │  - 随机点赞          │  │  - 标记已浏览            │    │
│  │  - 检测加载完成       │  │  - 选择未浏览话题        │    │
│  │  - 返回列表          │  │  - 切换列表页面          │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 方案对比

| 特性 | 油猴脚本 (Tampermonkey) | 浏览器插件 (Chrome Extension) |
|------|------------------------|------------------------------|
| 开发难度 | 低 | 中等 |
| 安装便捷性 | 高 (直接导入) | 中 (需要开发者模式) |
| 权限控制 | 受限 | 完整 |
| 跨页面通信 | 困难 | 简单 |
| 后台运行 | 不支持 | 支持 |
| 适合场景 | 简单自动化 | 复杂功能 |

## 推荐方案: 油猴脚本

考虑到需求相对简单（自动浏览、滚动、随机点赞），推荐使用油猴脚本实现，原因：
1. 开发和部署简单
2. 用户安装方便
3. 代码维护容易
4. 足够满足需求

## 功能需求清单

1. **自动浏览话题列表**
   - 从 /latest、/new、/unread 获取话题
   - 随机选择话题进入

2. **帖子内滚动浏览**
   - 模拟人类阅读行为
   - 滚动速度随机化
   - 确保每个回复都在视口中停留一段时间

3. **随机点赞**
   - 按概率随机点赞帖子
   - 避免连续点赞
   - 记录已点赞帖子避免重复

4. **安全机制**
   - 随机延迟
   - 操作间隔控制
   - 异常处理

## 核心代码实现

### 配置参数

```javascript
const CONFIG = {
  // 浏览设置
  minReadTime: 3000,        // 最小阅读时间 (ms)
  maxReadTime: 8000,        // 最大阅读时间 (ms)
  scrollStep: 200,          // 每次滚动距离 (px)
  scrollInterval: 1000,     // 滚动间隔 (ms)

  // 点赞设置
  likeChance: 0.3,          // 点赞概率 (30%)
  minLikeInterval: 5000,    // 最小点赞间隔 (ms)

  // 页面切换
  minStayTime: 30000,       // 单个帖子最小停留时间 (ms)
  maxStayTime: 120000,      // 单个帖子最大停留时间 (ms)

  // 安全设置
  maxLikesPerSession: 50,   // 每次会话最大点赞数
  cooldownTime: 300000,     // 冷却时间 (5分钟)
};
```

### 工具函数

```javascript
// 随机延迟
function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// 获取CSRF Token
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ||
         Discourse?.Session?.currentProp?.('csrfToken');
}

// 检查是否已登录
function isLoggedIn() {
  return document.querySelector('#current-user') !== null;
}

// 获取当前页面类型
function getPageType() {
  const path = window.location.pathname;
  if (path.match(/^\/t\/topic\/\d+/)) return 'topic';
  if (path === '/latest' || path === '/new' || path === '/unread') return 'list';
  return 'other';
}
```

### 点赞功能

```javascript
class LikeManager {
  constructor() {
    this.likedPosts = new Set(JSON.parse(localStorage.getItem('linuxdo_liked') || '[]'));
    this.sessionLikes = 0;
  }

  async likePost(postElement) {
    const postId = postElement.id.replace('post_', '');

    // 检查是否已点赞
    if (this.likedPosts.has(postId)) {
      console.log(`帖子 ${postId} 已点赞，跳过`);
      return false;
    }

    // 检查会话限制
    if (this.sessionLikes >= CONFIG.maxLikesPerSession) {
      console.log('达到会话点赞上限');
      return false;
    }

    // 查找点赞按钮
    const likeBtn = postElement.querySelector('button[title="点赞此帖子"]');
    if (!likeBtn) {
      console.log('未找到点赞按钮');
      return false;
    }

    // 检查是否可点赞 (未点赞状态)
    if (likeBtn.classList.contains('has-like') || likeBtn.classList.contains('my-likes')) {
      console.log('帖子已被点赞');
      return false;
    }

    try {
      // 模拟点击
      likeBtn.click();

      // 记录
      this.likedPosts.add(postId);
      this.sessionLikes++;
      localStorage.setItem('linuxdo_liked', JSON.stringify([...this.likedPosts]));

      console.log(`成功点赞帖子 ${postId}`);
      return true;
    } catch (e) {
      console.error('点赞失败:', e);
      return false;
    }
  }

  shouldLike() {
    return Math.random() < CONFIG.likeChance;
  }
}
```

### 滚动浏览功能

```javascript
class ScrollBrowser {
  constructor(likeManager) {
    this.likeManager = likeManager;
    this.isRunning = false;
    this.viewedPosts = new Set();
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('开始自动浏览...');

    while (this.isRunning) {
      await this.scrollOnce();
      await randomDelay(CONFIG.scrollInterval * 0.8, CONFIG.scrollInterval * 1.2);
    }
  }

  stop() {
    this.isRunning = false;
    console.log('停止自动浏览');
  }

  async scrollOnce() {
    // 获取当前可见的帖子
    const posts = document.querySelectorAll('article[id^="post_"]');
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;

    for (const post of posts) {
      const rect = post.getBoundingClientRect();

      // 检查帖子是否在视口中
      if (rect.top >= 0 && rect.bottom <= viewportHeight) {
        const postId = post.id;

        if (!this.viewedPosts.has(postId)) {
          this.viewedPosts.add(postId);
          console.log(`浏览帖子: ${postId}`);

          // 随机决定是否点赞
          if (this.likeManager.shouldLike()) {
            await randomDelay(1000, 3000);
            await this.likeManager.likePost(post);
          }
        }
      }
    }

    // 检查是否到达底部
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollY + clientHeight >= scrollHeight - 100) {
      console.log('已到达页面底部');
      await this.goToNextTopic();
      return;
    }

    // 平滑滚动
    window.scrollBy({
      top: CONFIG.scrollStep + Math.random() * 100 - 50,
      behavior: 'smooth'
    });
  }

  async goToNextTopic() {
    console.log('准备跳转到下一个话题...');
    await randomDelay(CONFIG.minStayTime, CONFIG.maxStayTime);

    // 跳转到话题列表
    const listUrls = ['/latest', '/new', '/unread'];
    const randomUrl = listUrls[Math.floor(Math.random() * listUrls.length)];
    window.location.href = randomUrl;
  }
}
```

### 话题列表浏览

```javascript
class TopicListBrowser {
  constructor() {
    this.visitedTopics = new Set(JSON.parse(localStorage.getItem('linuxdo_visited') || '[]'));
  }

  async selectRandomTopic() {
    await randomDelay(2000, 5000);

    const topicLinks = document.querySelectorAll('a[href^="/t/topic/"]');
    const unvisitedTopics = [...topicLinks].filter(link => {
      const topicId = link.href.match(/\/t\/topic\/(\d+)/)?.[1];
      return topicId && !this.visitedTopics.has(topicId);
    });

    if (unvisitedTopics.length === 0) {
      console.log('所有话题已浏览，清除历史记录');
      this.visitedTopics.clear();
      localStorage.removeItem('linuxdo_visited');
      return this.selectRandomTopic();
    }

    const randomTopic = unvisitedTopics[Math.floor(Math.random() * unvisitedTopics.length)];
    const topicId = randomTopic.href.match(/\/t\/topic\/(\d+)/)?.[1];

    this.visitedTopics.add(topicId);
    localStorage.setItem('linuxdo_visited', JSON.stringify([...this.visitedTopics]));

    console.log(`选择话题: ${topicId}`);
    randomTopic.click();
  }
}
```

### 主控制器

```javascript
class LinuxDoAutomation {
  constructor() {
    this.likeManager = new LikeManager();
    this.scrollBrowser = new ScrollBrowser(this.likeManager);
    this.topicListBrowser = new TopicListBrowser();
    this.isEnabled = false;
  }

  init() {
    // 创建控制面板
    this.createControlPanel();

    // 检查登录状态
    if (!isLoggedIn()) {
      console.warn('请先登录');
      return;
    }

    console.log('Linux.do 自动化脚本已加载');
  }

  createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'linuxdo-automation-panel';
    panel.innerHTML = `
      <style>
        #linuxdo-automation-panel {
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 10000;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          font-size: 14px;
          min-width: 200px;
        }
        #linuxdo-automation-panel h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
        }
        #linuxdo-automation-panel button {
          width: 100%;
          padding: 8px;
          margin: 5px 0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        #linuxdo-automation-panel .btn-start {
          background: #4CAF50;
          color: white;
        }
        #linuxdo-automation-panel .btn-stop {
          background: #f44336;
          color: white;
        }
        #linuxdo-automation-panel .status {
          margin-top: 10px;
          padding: 5px;
          background: #f5f5f5;
          border-radius: 4px;
        }
      </style>
      <h3>Linux.do 自动化</h3>
      <button class="btn-start" id="btn-auto-start">开始自动浏览</button>
      <button class="btn-stop" id="btn-auto-stop" style="display:none;">停止</button>
      <div class="status">
        <div>点赞数: <span id="like-count">0</span></div>
        <div>状态: <span id="auto-status">未启动</span></div>
      </div>
    `;

    document.body.appendChild(panel);

    // 绑定事件
    document.getElementById('btn-auto-start').addEventListener('click', () => this.start());
    document.getElementById('btn-auto-stop').addEventListener('click', () => this.stop());
  }

  async start() {
    this.isEnabled = true;
    document.getElementById('btn-auto-start').style.display = 'none';
    document.getElementById('btn-auto-stop').style.display = 'block';
    document.getElementById('auto-status').textContent = '运行中';

    const pageType = getPageType();

    if (pageType === 'topic') {
      await this.scrollBrowser.start();
    } else if (pageType === 'list') {
      await this.topicListBrowser.selectRandomTopic();
    }
  }

  stop() {
    this.isEnabled = false;
    this.scrollBrowser.stop();
    document.getElementById('btn-auto-start').style.display = 'block';
    document.getElementById('btn-auto-stop').style.display = 'none';
    document.getElementById('auto-status').textContent = '已停止';
  }

  updateStats() {
    document.getElementById('like-count').textContent = this.likeManager.sessionLikes;
  }
}

// 初始化
const automation = new LinuxDoAutomation();
automation.init();
```

## v2 核心改进

### 1. 滚动控制器 (ScrollController)

```javascript
class ScrollController {
  // 检测是否到达底部
  isAtBottom() {
    const { scrollTop, scrollHeight, clientHeight } = this.getScrollInfo();
    return scrollTop + clientHeight >= scrollHeight - 100;
  }

  // 检测是否有新内容加载
  hasNewContent() {
    const currentHeight = document.documentElement.scrollHeight;
    if (currentHeight > this.lastScrollHeight) {
      this.lastScrollHeight = currentHeight;
      this.noNewContentCount = 0;
      return true;
    }
    this.noNewContentCount++;
    return false;
  }

  // 判断内容是否完全加载
  isContentFullyLoaded() {
    return this.noNewContentCount >= CONFIG.noNewContentRetry;
  }
}
```

### 2. 浏览记录管理 (BrowsingHistory)

```javascript
class BrowsingHistory {
  // 使用 Set 存储已浏览/已点赞的ID
  viewed = new Set();  // 已浏览话题ID
  liked = new Set();   // 已点赞帖子ID

  // 持久化到 localStorage
  save() {
    Storage.set('viewed_topics', [...this.viewed]);
    Storage.set('liked_posts', [...this.liked]);
  }
}
```

### 3. 帖子详情页浏览流程

```
开始 → 标记话题为已浏览 → 滚动到顶部
  ↓
循环: {
  处理可见帖子 (阅读+随机点赞)
  ↓
  到达底部?
    是 → 等待加载 → 有新内容?
           是 → 继续循环
           否 → 重试次数够了? → 是 → 退出循环
    否 → 继续滚动
}
  ↓
返回话题列表
```

### 4. 话题列表页浏览流程

```
开始 → 扫描可见话题
  ↓
循环: {
  遍历话题行 {
    已浏览? → 标记视觉效果 → 跳过
    未浏览? → 检查会话限制 → 点击进入 → 退出
  }
  ↓
  没找到未浏览话题?
    到达底部? → 等待加载 → 有新内容?
                  是 → 继续循环
                  否 → 切换到其他列表
    否 → 继续滚动
}
```

## 文件结构

```
linuxdo/
├── README.md                              # 项目说明
├── docs/
│   ├── linux.do-analysis.md              # 网站分析文档
│   ├── implementation-plan.md            # 实现方案文档
│   └── usage-guide.md                    # 使用指南
└── src/
    ├── linuxdo-automation.user.js        # 油猴脚本 (v2)
    ├── hooks/                            # 调试Hook脚本
    └── utils/                            # 工具脚本
```

## 已完成

- [x] 网站结构分析
- [x] API接口分析
- [x] 油猴脚本v1基础功能
- [x] 油猴脚本v2重构
  - [x] 无限滚动支持
  - [x] 浏览记录管理
  - [x] 完整回复浏览
  - [x] 自动返回列表
  - [x] 视觉标记
- [x] 调试工具集
- [x] 使用文档

## 后续优化方向

1. **性能优化** - 减少DOM查询次数
2. **错误恢复** - 网络错误自动重试
3. **智能调度** - 根据时间段调整行为
4. **数据统计** - 导出浏览/点赞统计报告
