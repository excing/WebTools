# Google Firebase 认证页面

这是一个完整的 Google Firebase 认证页面，提供了用户友好的界面和完整的认证功能。

## 功能特性

### 🔐 认证功能
- **Google 登录**: 使用弹窗方式进行 Google OAuth 认证
- **重定向登录**: 适用于移动设备的重定向认证方式
- **自动登录检测**: 页面加载时自动检测用户登录状态
- **安全登出**: 完整的登出流程

### 🎨 用户界面
- **响应式设计**: 适配桌面和移动设备
- **现代化 UI**: 使用 Tailwind CSS 构建的美观界面
- **状态指示**: 清晰的登录/未登录状态显示
- **加载状态**: 操作过程中的加载动画

### 📊 用户信息展示
- **用户头像**: 显示 Google 账户头像
- **基本信息**: 显示用户名、邮箱等基本信息
- **验证状态**: 显示邮箱验证状态
- **账户详情**: 显示账户创建时间、最后登录时间等
- **信息复制**: 一键复制用户信息到剪贴板

### 🛡️ 错误处理
- **详细错误信息**: 针对不同错误类型显示相应提示
- **用户友好提示**: 易于理解的错误说明
- **错误恢复**: 可关闭错误提示继续操作

### 📝 操作日志
- **实时日志**: 显示所有操作的时间戳日志
- **操作追踪**: 记录登录、登出、错误等操作
- **日志管理**: 可清除历史日志

## 技术实现

### 前端技术栈
- **Svelte 5**: 使用最新的 Svelte 5 语法和 runes
- **TypeScript**: 完整的类型安全
- **Tailwind CSS**: 现代化样式框架
- **Firebase Auth**: Google 官方认证服务

### 核心依赖
```json
{
  "firebase": "^12.0.0",
  "svelte": "^5.0.0",
  "tailwindcss": "^4.0.0"
}
```

### 文件结构
```
src/routes/ft/auth/google/
├── +page.svelte          # 主页面组件
└── README.md             # 文档说明
```

## 使用方法

### 环境配置

1. **Firebase 配置**: 确保 `PUBLIC_GOOGLE_FIREBASE_CONFIG` 环境变量已正确设置
2. **域名配置**: 在 Firebase Console 中添加授权域名

### 页面访问

访问 `/ft/auth/google` 路径即可使用认证功能。

### 认证流程

1. **首次访问**: 页面显示登录按钮
2. **点击登录**: 弹出 Google 认证窗口
3. **授权确认**: 在 Google 页面确认授权
4. **登录成功**: 返回页面显示用户信息
5. **登出操作**: 点击登出按钮安全退出

## API 接口

### 主要方法

```typescript
// 弹窗登录
async function handleLogin(): Promise<void>

// 重定向登录
async function handleLoginWithRedirect(): Promise<void>

// 登出
async function handleLogout(): Promise<void>

// 复制用户信息
async function copyUserInfo(): Promise<void>
```

### 状态管理

```typescript
let isLoading = $state(false);      // 加载状态
let isLogin = $state(false);        // 登录状态
let user = $state<User | null>(null); // 用户信息
let error = $state<string | null>(null); // 错误信息
let messages = $state<string[]>([]);  // 操作日志
```

## 错误处理

页面能够处理以下常见错误：

- `auth/popup-closed-by-user`: 用户关闭登录窗口
- `auth/popup-blocked`: 浏览器阻止弹窗
- `auth/cancelled-popup-request`: 登录请求被取消
- `auth/network-request-failed`: 网络连接失败

## 安全考虑

- **HTTPS 要求**: 生产环境必须使用 HTTPS
- **域名验证**: Firebase 会验证请求来源域名
- **Token 安全**: 认证 Token 由 Firebase 自动管理
- **会话管理**: 支持自动会话恢复和过期处理

测试覆盖：
- 页面渲染测试
- 登录/登出功能测试
- 错误处理测试
- 用户状态管理测试

## 浏览器兼容性

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 移动设备支持

- 响应式设计适配移动设备
- 提供重定向登录方式
- 触摸友好的交互设计

## 后续扩展

可以考虑添加的功能：
- 其他登录方式（Facebook、Twitter 等）
- 用户资料编辑
- 密码重置功能
- 多因素认证
- 账户删除功能
