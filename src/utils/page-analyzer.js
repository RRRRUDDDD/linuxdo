/**
 * 页面分析工具 - 分析Linux.do页面结构
 * 用于快速定位关键元素和调试
 */

(function() {
  'use strict';

  const PageAnalyzer = {
    /**
     * 获取页面基本信息
     */
    getPageInfo() {
      return {
        url: window.location.href,
        path: window.location.pathname,
        pageType: this.getPageType(),
        isLoggedIn: this.isLoggedIn(),
        currentUser: this.getCurrentUsername(),
        csrfToken: this.getCsrfToken()?.substring(0, 20) + '...',
        topicId: this.getTopicId(),
        categoryId: this.getCategoryId()
      };
    },

    /**
     * 判断页面类型
     */
    getPageType() {
      const path = window.location.pathname;
      if (path.match(/^\/t\/topic\/\d+/)) return 'topic';
      if (path === '/latest') return 'latest';
      if (path === '/new') return 'new';
      if (path === '/unread') return 'unread';
      if (path === '/top') return 'top';
      if (path === '/hot') return 'hot';
      if (path.startsWith('/c/')) return 'category';
      if (path.startsWith('/u/')) return 'user';
      if (path === '/') return 'home';
      return 'other';
    },

    /**
     * 检查登录状态
     */
    isLoggedIn() {
      return document.querySelector('#current-user') !== null;
    },

    /**
     * 获取当前用户名
     */
    getCurrentUsername() {
      try {
        return Discourse?.User?.current()?.username ||
               document.querySelector('.header-dropdown-toggle img')?.alt ||
               null;
      } catch (e) {
        return null;
      }
    },

    /**
     * 获取CSRF Token
     */
    getCsrfToken() {
      return document.querySelector('meta[name="csrf-token"]')?.content;
    },

    /**
     * 获取当前话题ID
     */
    getTopicId() {
      const match = window.location.pathname.match(/\/t\/topic\/(\d+)/);
      return match ? match[1] : null;
    },

    /**
     * 获取当前分类ID
     */
    getCategoryId() {
      const match = window.location.pathname.match(/\/c\/[^\/]+\/(\d+)/);
      return match ? match[1] : null;
    },

    /**
     * 分析话题列表页面
     */
    analyzeTopicList() {
      const topics = document.querySelectorAll('.topic-list-item, [data-topic-id]');
      const result = [];

      topics.forEach((topic, index) => {
        const titleLink = topic.querySelector('.title a, .link-top-line a');
        const topicId = topic.dataset.topicId ||
                       titleLink?.href?.match(/\/t\/topic\/(\d+)/)?.[1];

        result.push({
          index: index,
          topicId: topicId,
          title: titleLink?.textContent?.trim()?.substring(0, 50),
          href: titleLink?.href,
          category: topic.querySelector('.category-name, .badge-category')?.textContent?.trim(),
          replies: topic.querySelector('.posts, .replies')?.textContent?.trim(),
          views: topic.querySelector('.views')?.textContent?.trim()
        });
      });

      return result;
    },

    /**
     * 分析帖子详情页面
     */
    analyzeTopicPage() {
      const posts = document.querySelectorAll('article[id^="post_"]');
      const result = [];

      posts.forEach((post, index) => {
        const postId = post.id.replace('post_', '');
        const username = post.querySelector('.username a, .names .username')?.textContent?.trim();
        const content = post.querySelector('.cooked, .post-body')?.textContent?.trim();
        const likeBtn = post.querySelector('button[title="点赞此帖子"]');
        const likeCount = post.querySelector('.reactions .count, .like-count')?.textContent?.trim();

        result.push({
          index: index,
          postId: postId,
          username: username,
          contentPreview: content?.substring(0, 100) + '...',
          hasLikeButton: !!likeBtn,
          isLiked: likeBtn?.classList.contains('has-like') || likeBtn?.classList.contains('my-likes'),
          likeCount: likeCount || '0',
          isVisible: this.isElementInViewport(post)
        });
      });

      return result;
    },

    /**
     * 检查元素是否在视口中
     */
    isElementInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    },

    /**
     * 查找所有可点击的点赞按钮
     */
    findLikeButtons() {
      const buttons = document.querySelectorAll(
        'button[title="点赞此帖子"], ' +
        'button.btn-toggle-reaction-like, ' +
        '.post-controls button.like'
      );

      return Array.from(buttons).map((btn, index) => {
        const post = btn.closest('article[id^="post_"]');
        return {
          index: index,
          postId: post?.id?.replace('post_', ''),
          isLiked: btn.classList.contains('has-like') || btn.classList.contains('my-likes'),
          isDisabled: btn.disabled,
          isVisible: this.isElementInViewport(btn)
        };
      });
    },

    /**
     * 获取页面滚动信息
     */
    getScrollInfo() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

      return {
        scrollTop: scrollTop,
        scrollHeight: scrollHeight,
        clientHeight: clientHeight,
        scrollPercent: scrollPercent + '%',
        isAtTop: scrollTop < 100,
        isAtBottom: scrollTop + clientHeight >= scrollHeight - 100
      };
    },

    /**
     * 打印完整分析报告
     */
    printReport() {
      console.group('=== Linux.do 页面分析报告 ===');

      console.log('页面信息:', this.getPageInfo());
      console.log('滚动状态:', this.getScrollInfo());

      const pageType = this.getPageType();
      if (pageType === 'topic') {
        console.log('帖子列表:', this.analyzeTopicPage());
        console.log('点赞按钮:', this.findLikeButtons());
      } else if (['latest', 'new', 'unread', 'category', 'home'].includes(pageType)) {
        console.log('话题列表:', this.analyzeTopicList());
      }

      console.groupEnd();
    }
  };

  // 导出到全局
  window.pageAnalyzer = PageAnalyzer;

  console.log('[Page Analyzer] 已加载');
  console.log('使用 pageAnalyzer.printReport() 打印完整分析报告');
  console.log('其他方法: getPageInfo, analyzeTopicList, analyzeTopicPage, findLikeButtons, getScrollInfo');

})();
