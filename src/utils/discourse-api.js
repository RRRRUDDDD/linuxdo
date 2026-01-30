/**
 * Discourse API 工具类
 * 封装常用的Discourse论坛API调用
 */

(function() {
  'use strict';

  class DiscourseAPI {
    constructor() {
      this.baseUrl = window.location.origin;
      this.csrfToken = this.getCsrfToken();
    }

    getCsrfToken() {
      const meta = document.querySelector('meta[name="csrf-token"]');
      if (meta) return meta.content;
      try {
        return Discourse?.Session?.currentProp?.('csrfToken');
      } catch (e) {
        return null;
      }
    }

    getHeaders() {
      return {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': this.csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      };
    }

    async request(endpoint, options = {}) {
      const url = this.baseUrl + endpoint;
      const defaultOptions = {
        headers: this.getHeaders(),
        credentials: 'same-origin'
      };

      try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('[Discourse API] 请求失败:', error);
        throw error;
      }
    }

    // ==================== 话题相关 ====================

    /**
     * 获取最新话题列表
     */
    async getLatestTopics(page = 0) {
      return this.request(`/latest.json?page=${page}`);
    }

    /**
     * 获取新话题列表
     */
    async getNewTopics() {
      return this.request('/new.json');
    }

    /**
     * 获取未读话题列表
     */
    async getUnreadTopics() {
      return this.request('/unread.json');
    }

    /**
     * 获取话题详情
     */
    async getTopic(topicId) {
      return this.request(`/t/${topicId}.json`);
    }

    /**
     * 获取话题的帖子
     */
    async getTopicPosts(topicId, postIds) {
      const params = postIds.map(id => `post_ids[]=${id}`).join('&');
      return this.request(`/t/${topicId}/posts.json?${params}`);
    }

    // ==================== 帖子相关 ====================

    /**
     * 点赞帖子
     * @param {number} postId - 帖子ID
     */
    async likePost(postId) {
      return this.request('/post_actions', {
        method: 'POST',
        body: `id=${postId}&post_action_type_id=2` // 2 = like
      });
    }

    /**
     * 取消点赞
     */
    async unlikePost(postId) {
      return this.request(`/post_actions/${postId}`, {
        method: 'DELETE',
        body: 'post_action_type_id=2'
      });
    }

    /**
     * 获取帖子详情
     */
    async getPost(postId) {
      return this.request(`/posts/${postId}.json`);
    }

    // ==================== 用户相关 ====================

    /**
     * 获取当前用户信息
     */
    async getCurrentUser() {
      return this.request('/session/current.json');
    }

    /**
     * 获取用户资料
     */
    async getUserProfile(username) {
      return this.request(`/u/${username}.json`);
    }

    /**
     * 获取用户活动
     */
    async getUserActivity(username) {
      return this.request(`/u/${username}/activity.json`);
    }

    // ==================== 分类相关 ====================

    /**
     * 获取所有分类
     */
    async getCategories() {
      return this.request('/categories.json');
    }

    /**
     * 获取分类下的话题
     */
    async getCategoryTopics(categorySlug, categoryId) {
      return this.request(`/c/${categorySlug}/${categoryId}.json`);
    }

    // ==================== 搜索相关 ====================

    /**
     * 搜索
     */
    async search(query, options = {}) {
      const params = new URLSearchParams({ q: query, ...options });
      return this.request(`/search.json?${params}`);
    }

    // ==================== 通知相关 ====================

    /**
     * 获取通知
     */
    async getNotifications() {
      return this.request('/notifications.json');
    }

    // ==================== 工具方法 ====================

    /**
     * 记录话题浏览 (模拟浏览行为)
     */
    async trackTopicView(topicId, postNumber = 1) {
      return this.request(`/t/${topicId}/timings`, {
        method: 'POST',
        body: `topic_id=${topicId}&topic_time=30000&timings[${postNumber}]=30000`
      });
    }

    /**
     * 获取站点信息
     */
    async getSiteInfo() {
      return this.request('/site.json');
    }
  }

  // 创建全局实例
  window.discourseAPI = new DiscourseAPI();

  console.log('[Discourse API] 已加载，使用 discourseAPI.方法名() 调用');
  console.log('可用方法: getLatestTopics, getTopic, likePost, getCurrentUser, search 等');

})();
