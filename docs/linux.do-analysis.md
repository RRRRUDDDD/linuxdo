# Linux.do 网站自动化分析报告

## 1. 网站基本信息

- **网站地址**: https://linux.do
- **论坛系统**: Discourse (开源论坛软件)
- **主要页面**:
  - `/latest` - 最新话题
  - `/new` - 新话题
  - `/unread` - 未读话题
  - `/t/topic/{topic_id}` - 帖子详情页

## 2. 页面结构分析

### 2.1 话题列表页面结构

```
- region#main
  - banner (顶部导航栏)
    - button "边栏"
    - link "/" (Logo)
    - textbox "搜索"
    - navigation (用户菜单)
  - main#main-outlet-wrapper
    - region#d-sidebar (左侧边栏)
    - region (话题列表区域)
      - heading "所有最新话题"
      - list#navigation-bar (导航标签: 最新/新/未读/排行榜/热门/类别等)
      - 话题列表项 (每个话题包含):
        - heading > link (话题标题)
        - link (分类)
        - list "标签" (话题标签)
        - 发帖人头像链接
        - 回复数/浏览量/活动时间
```

### 2.2 帖子详情页面结构

```
- region#topic
  - article#post_1 (主帖)
    - 用户头像/用户名
    - 帖子内容
    - region (操作区域)
      - navigation
        - button "此帖子有 X 条回复"
        - 表情统计 (heart, +1, open_mouth等)
        - button "点赞此帖子" (关键元素)
        - button "将此帖子的链接复制到剪贴板"
        - button "显示更多"
        - button "回复"
  - article#post_2 (回复1)
    - 同上结构
  - article#post_3 (回复2)
    - ...
```

### 2.3 关键DOM元素选择器

| 功能 | 选择器 |
|------|--------|
| 点赞按钮 | `button[title="点赞此帖子"]` 或 `.btn-toggle-reaction-like` |
| 帖子列表 | `article[id^="post_"]` |
| 话题链接 | `a[href^="/t/topic/"]` |
| 回复按钮 | `button[class*="reply"]` |
| 滚动进度 | `#ember49` (右侧进度条) |

## 3. API接口分析

### 3.1 关键请求头

```javascript
{
  "X-CSRF-Token": "从页面meta标签或cookie获取",
  "X-Requested-With": "XMLHttpRequest",
  "Discourse-Logged-In": "true",
  "Discourse-Present": "true",
  "Accept": "application/json, text/javascript, */*; q=0.01"
}
```

### 3.2 获取CSRF Token方法

```javascript
// 方法1: 从meta标签获取
document.querySelector('meta[name="csrf-token"]')?.content

// 方法2: 从Discourse对象获取
Discourse.Session.currentProp('csrfToken')
```

### 3.3 主要API端点

| 接口 | 方法 | 说明 |
|------|------|------|
| `/t/topic/{id}.json` | GET | 获取帖子详情 |
| `/t/topic/{id}/posts.json?post_ids[]=xxx` | GET | 获取特定回复 |
| `/post_actions` | POST | 点赞操作 |
| `/latest.json` | GET | 获取最新话题列表 |
| `/new.json` | GET | 获取新话题列表 |
| `/unread.json` | GET | 获取未读话题列表 |
| `/message-bus/{client_id}/poll` | POST | 长轮询消息总线 |

### 3.4 点赞API

```javascript
// POST /post_actions
{
  "id": post_id,           // 帖子ID
  "post_action_type_id": 2 // 2 = like
}
```

## 4. 安全机制分析

### 4.1 指纹检测

网站使用 `discourse_fingerprint` 插件收集浏览器指纹:
- 字体列表
- Canvas指纹
- Audio指纹
- 屏幕分辨率
- 硬件并发数
- 时区
- 插件列表
- 数学运算指纹

### 4.2 速率限制

- Message-bus轮询有速率限制 (429 Too Many Requests)
- API请求需要合理间隔

### 4.3 会话验证

- 需要有效的登录Cookie
- 每个请求需要CSRF Token

## 5. 自动化浏览实现要点

### 5.1 滚动浏览

```javascript
// Discourse使用虚拟滚动，需要触发滚动事件加载更多内容
function scrollToLoadPosts() {
  const scrollContainer = document.querySelector('.topic-body');
  // 平滑滚动
  window.scrollBy({
    top: 300,
    behavior: 'smooth'
  });
}
```

### 5.2 检测帖子进入视口

```javascript
// 使用IntersectionObserver检测帖子可见性
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 帖子进入视口，记录浏览时间
      const postId = entry.target.id;
      console.log(`浏览帖子: ${postId}`);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('article[id^="post_"]').forEach(post => {
  observer.observe(post);
});
```

### 5.3 点赞实现

```javascript
async function likePost(postId) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

  const response = await fetch('/post_actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRF-Token': csrfToken,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: `id=${postId}&post_action_type_id=2`
  });

  return response.ok;
}
```

## 6. 注意事项

1. **速率控制**: 所有操作需要添加随机延迟，避免触发反爬机制
2. **登录状态**: 需要确保用户已登录
3. **指纹一致性**: 避免修改浏览器指纹相关信息
4. **合规使用**: 仅用于个人学习研究，遵守网站使用条款
