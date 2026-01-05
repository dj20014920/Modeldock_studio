# 🚀 ModelDock Studio
## 企业级多AI编排平台

<div align="center">
  
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-Serverless-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-MV3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**"一个屏幕，控制所有AI"**

[한국어](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

</div>

---

## 📑 目录

- [概述](#-概述)
- [核心功能](#-核心功能)
- [系统架构](#-系统架构)
- [技术栈](#-技术栈)
- [截图展示](#-截图展示)
- [BYOK系统](#-byok系统)
- [安全与隐私](#-安全与隐私)
- [安装与构建](#-安装与构建)
- [项目结构](#-项目结构)

---

## 🎯 概述

**ModelDock Studio** 是一款下一代Chrome扩展程序，支持在单一界面中同时使用11+主流AI模型。这是一个同时满足企业级架构要求和个人用户便利性的混合AI工作空间。

### 核心价值主张

- **🔀 混合路由**: iframe网页应用 + API(BYOK) 双模式支持
- **🧠 BrainFlow**: 通过AI模型协作实现的高级推理引擎
- **🔐 零服务器架构**: 所有数据本地存储（chrome.storage.local）
- **⚡ 实时同步**: 通过会话Cookie自动镜像完美保持登录状态
- **🌐 多语言支持**: 14种语言完整翻译（i18next）

### 支持的AI提供商（截至2025年12月）

**动态模型列表管理系统**

ModelDock Studio采用**双重混合模型加载方式**，始终提供最新模型：

1. **Cloudflare Worker代理缓存**（第一层）
   - 通过OpenRouter API实时同步200+模型元数据
   - 基于R2存储的6小时缓存（TTL）
   - 按提供商自动分类和热度排序

2. **基于用户API密钥的直接查询**（第二层）
   - 用户输入API密钥时
   - 直接请求各提供商的`/models`端点
   - 实时获取账户可用模型列表

```typescript
// 双重混合加载流程
User enters API Key
      ↓
1. Fetch from Cloudflare Worker Proxy (6h cache)
      ↓
2. Direct call to Provider's /models endpoint
      ↓
Merge & Display latest available models
```

| 提供商 | iframe | API(BYOK) | 动态加载 | 模型示例 |
|--------|--------|-----------|---------|---------|
| **OpenAI** | ✅ | ✅ | ✅ `/v1/models` | GPT-4o, o1, o3-mini |
| **Anthropic** | ✅ | ✅ | ✅ `/v1/models` | Claude 3.5 Sonnet, Opus |
| **Google** | ✅ | ✅ | ✅ `/v1beta/models` | Gemini 2.0 Flash, Pro |
| **DeepSeek** | ✅ | ✅ | ✅ `/v1/models` | R1, V3 |
| **xAI** | ✅ | ✅ | ✅ `/v1/models` | Grok 2, Vision |
| **Mistral** | ✅ | ✅ | ✅ `/v1/models` | Large 2, Codestral |
| **Qwen** | ✅ | ✅ | ✅ `/compatible-mode/v1/models` | QwQ-32B, Turbo |
| **Kimi** | ✅ | ✅ | ✅ `/v1/models` | Moonshot v1 |
| **OpenRouter** | ✅ | ✅ | ✅ `/api/v1/models` | 200+ 集成路由器 |
| **LM Arena** | ✅ | - | - | 仅盲测 |

> **💡 核心差异化优势**: **实时API驱动的模型列表更新**，而非静态硬编码——新模型发布后立即可用

---

## 🎨 核心功能

### 1️⃣ 多模型网格系统

![主界面](screen/main.jpeg)

**并发执行架构**
- **无限制同时运行**: 每个模型最多3个实例（19个标准模型 × 3 = 最多57个同时执行）
- 每个模型在独立的iframe沙盒中运行
- 实时状态监控（idle/sending/success/error）
- 响应式网格布局（根据屏幕大小自动调整，最小320px/模型）
- 拖放调整大小支持

**混合路由模式**
```typescript
// 手动模式（默认）- 100%安全
User → [复制/粘贴] → 各个模型

// 自动路由模式（可选）- 生产力最大化
User → Auto-Router → DOM注入 → 所有模型
                   ↓
              Content Script (content.js)
                   ↓
              模型特定选择器
```

### 2️⃣ BrainFlow™ 协作推理引擎

![BrainFlow](screen/brainflow.jpeg)

**三阶段思维链过程**

```typescript
// 阶段1: 策略制定（Main Brain）
Goal → Main Brain → [SLAVE:grok-1] "市场调研"
                 → [SLAVE:claude-1] "风险分析"
                 → [SLAVE:gemini-1] "技术验证"

// 阶段2: 并行执行（Slaves）
[Promise.all] → 同时执行所有从属模型 → 收集结果

// 阶段3: 综合（Main Brain）
收集的响应 → Main Brain → 生成最终报告
```

### 3️⃣ 侧边栏模式

![侧边栏](screen/사이드패널.jpeg)

**Chrome Side Panel API应用**
- 可在所有网页上叠加显示
- 独立状态管理（`sp_`前缀存储）
- 响应式UI（300px~600px自动调整）
- 与主应用完全分离的历史记录

### 4️⃣ BYOK（自带密钥）系统

![BYOK设置](screen/BYOK.jpeg)

**多态适配器模式**
```typescript
interface BYOKAdapter {
  validateKey(apiKey: string): Promise<boolean>;
  fetchModels(apiKey: string): Promise<BYOKModelVariant[]>;
  callAPI(params: APICallParams): Promise<APIResponse>;
}

// 提供商特定实现
class OpenAIAdapter extends AbstractBYOKAdapter { ... }
class AnthropicAdapter extends AbstractBYOKAdapter { ... }
class GoogleAdapter extends AbstractBYOKAdapter { ... }
```

**三阶段密钥验证策略**
1. `/models`端点查询（最经济）
2. `fetchModels()`调用（元数据丰富）
3. 超轻量级completion请求（maxTokens=1）

### 5️⃣ 提示词库

![提示词库](screen/prompt.jpeg)

**基于IndexedDB的无限存储**
- 分类管理（编程、写作、分析等）
- 一键注入（注入到所有模型）
- 模板变量支持（`{{variable}}`）
- 导入/导出（JSON）

---

## 🛠️ 技术栈

### 前端
- **React 18.2** - 函数式组件 + Hooks
- **TypeScript 5.4** - 完整类型安全
- **Vite 5.1** - 超快速HMR构建
- **TailwindCSS 3.4** - 实用优先样式
- **i18next** - 14语言国际化

### Chrome Extension APIs
- **Manifest V3** - 最新扩展标准
- **chrome.storage.local** - 持久数据存储
- **chrome.cookies** - 会话同步
- **chrome.sidePanel** - 侧边栏模式

### 后端（无服务器）
- **Cloudflare Workers** - 边缘计算
- **R2 Object Storage** - 模型元数据缓存

---

## 🔒 安全与隐私

### 设计原则

1. **零服务器架构**
   - 所有数据本地存储
   - 无中央服务器（Cloudflare Worker仅缓存元数据）

2. **API密钥保护**
   - 使用chrome.storage.local（操作系统级加密）
   - 网络传输仅使用HTTPS
   - 绝不记录日志

3. **沙盒隔离**
   - 每个模型在独立iframe中运行
   - Content Script仅持有受限权限

---

## 🚀 安装与构建

### 前置要求
- **Node.js** 18.0或更高版本
- **npm** 或 **yarn**
- **Chrome** 浏览器（支持Manifest V3）

### 本地开发环境搭建

```bash
# 1. 克隆仓库
git clone https://github.com/dj20014920/modeldock_studio.git
cd modeldock_studio

# 2. 安装依赖
npm install

# 3. 运行开发模式（支持HMR）
npm run dev

# 4. 生产构建
npm run build

# 5. 在Chrome中加载
# chrome://extensions/ → 启用开发者模式 → "加载已解压的扩展程序" → 选择dist文件夹
```

---

## 📂 项目结构

```
modeldock_studio/
├── public/                          # 静态文件和扩展核心
│   ├── manifest.json               # Chrome扩展配置
│   ├── background.js               # Service Worker
│   ├── content.js                  # Content Script
│   └── ai_model_dom_selectors.json # 模型特定DOM选择器
│
├── src/                             # React应用源码
│   ├── App.tsx                     # 主应用组件
│   ├── SidePanelApp.tsx            # 侧边栏组件
│   ├── components/                 # React组件（20+）
│   ├── services/                   # 业务逻辑层
│   │   ├── byokService.ts         # BYOK API集成（2,253行）
│   │   └── chain-orchestrator.ts  # BrainFlow（625行）
│   └── locales/                    # 多语言翻译文件（14种语言）
│
├── cloudflare-worker/              # Cloudflare Worker服务器
│   └── src/index.js               # 主Worker（492行）
│
└── README.md                       # 本文档
```

---

## 📄 许可证

**MIT License**

---

## 🙏 致谢

本项目受以下开源项目启发：

- **ChatHub** - 多聊天界面理念
- **OpenRouter** - 模型集成API
- **React** - UI框架
- **Cloudflare Workers** - 无服务器基础设施

---

## 📞 联系与支持

- **GitHub Issues**: [错误报告与功能请求](https://github.com/dj20014920/modeldock_studio/issues)
- **Email**: vinny4920@gmail.com
- **Website**: www.emozleep.space（计划部署到网站、npm等）

---

## 📊 统计数据

| 指标 | 数值 |
|------|------|
| **总代码行数** | ~15,000行 |
| **TypeScript文件** | 45+ |
| **React组件** | 20+ |
| **支持的AI模型** | 11+ |
| **BYOK提供商** | 10 |
| **语言** | 14 |
| **构建大小** | ~2.5 MB（压缩后） |

---

<div align="center">
  
### ⭐ 如果这个项目对您有帮助，请给个Star！

**Built with ❤️ by ModelDock Team**

[⬆ 返回顶部](#-modeldock-studio)

</div>
