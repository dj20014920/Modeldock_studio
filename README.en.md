# 🚀 ModelDock Studio
## Enterprise-Grade Multi-AI Orchestration Platform

<div align="center">
  
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-Serverless-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-MV3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**"Control All AI from One Screen"**

[한국어](./README.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [BYOK System](#-byok-system)
- [Security & Privacy](#-security--privacy)
- [Installation & Build](#-installation--build)
- [Project Structure](#-project-structure)

---

## 🎯 Overview

**ModelDock Studio** is a next-generation Chrome Extension that enables simultaneous use of 11+ major AI models from a single interface. It's a hybrid AI workspace that meets both enterprise-grade architecture requirements and individual user convenience.

### Core Value Proposition

- **🔀 Hybrid Routing**: Dual-mode support for iframe web apps + API (BYOK)
- **🧠 BrainFlow**: Advanced reasoning engine through AI model collaboration
- **🔐 Zero-Server Architecture**: All data stored locally (chrome.storage.local)
- **⚡ Real-time Sync**: Perfect login state maintenance with automatic session cookie mirroring
- **🌐 Multilingual**: Complete translation in 14 languages (i18next)

### Supported AI Providers (As of December 2025)

**Dynamic Model List Management System**

ModelDock Studio adopts a **dual-hybrid model loading approach** to always provide the latest models:

1. **Cloudflare Worker Proxy Caching** (Layer 1)
   - Real-time synchronization of 200+ model metadata via OpenRouter API
   - R2 storage-based 6-hour caching (TTL)
   - Automatic classification by provider and popularity sorting

2. **Direct Lookup via User API Key** (Layer 2)
   - When user enters their API key
   - Direct requests to each provider's `/models` endpoint
   - Real-time retrieval of account-specific available model lists

```typescript
// Dual-Hybrid Loading Flow
User enters API Key
      ↓
1. Fetch from Cloudflare Worker Proxy (6h cache)
      ↓
2. Direct call to Provider's /models endpoint
      ↓
Merge & Display latest available models
```

| Provider | iframe | API(BYOK) | Dynamic Loading | Model Examples |
|----------|--------|-----------|-----------------|----------------|
| **OpenAI** | ✅ | ✅ | ✅ `/v1/models` | GPT-4o, o1, o3-mini |
| **Anthropic** | ✅ | ✅ | ✅ `/v1/models` | Claude 3.5 Sonnet, Opus |
| **Google** | ✅ | ✅ | ✅ `/v1beta/models` | Gemini 2.0 Flash, Pro |
| **DeepSeek** | ✅ | ✅ | ✅ `/v1/models` | R1, V3 |
| **xAI** | ✅ | ✅ | ✅ `/v1/models` | Grok 2, Vision |
| **Mistral** | ✅ | ✅ | ✅ `/v1/models` | Large 2, Codestral |
| **Qwen** | ✅ | ✅ | ✅ `/compatible-mode/v1/models` | QwQ-32B, Turbo |
| **Kimi** | ✅ | ✅ | ✅ `/v1/models` | Moonshot v1 |
| **Perplexity** | ✅ | ✅ | ✅ `/models` | Sonar Pro |
| **OpenRouter** | ✅ | ✅ | ✅ `/api/v1/models` | 200+ integrated router |
| **LM Arena** | ✅ | - | - | Blind test only |

> **💡 Key Differentiator**: **Real-time API-based model list updates**, not static hardcoding—use new models immediately upon release

---

## 🎨 Core Features

### 1️⃣ Multi-Model Grid System

![Main Interface](screen/main.jpeg)

**Concurrent Execution Architecture**
- **Unlimited Simultaneous Operation**: Up to 3 instances per model (19 standard models × 3 = max 57 concurrent executions possible)
- Each model runs in an independent iframe sandbox
- Real-time status monitoring (idle/sending/success/error)
- Responsive grid layout (auto-adjusts based on screen size, minimum 320px/model)
- Drag-and-drop resizing support

**Hybrid Routing Modes**
```typescript
// Manual Mode (default) - 100% safe
User → [Copy/Paste] → Each Model

// Auto-Routing Mode (optional) - Maximum productivity
User → Auto-Router → DOM Injection → All Models
                   ↓
              Content Script (content.js)
                   ↓
              Model-specific Selectors
```

### 2️⃣ BrainFlow™ Collaborative Reasoning Engine

![BrainFlow](screen/brainflow.jpeg)

**3-Phase Chain-of-Thought Process**

```typescript
// Phase 1: Strategy Formation (Main Brain)
Goal → Main Brain → [SLAVE:grok-1] "Market Research"
                 → [SLAVE:claude-1] "Risk Analysis"
                 → [SLAVE:gemini-1] "Technical Validation"

// Phase 2: Parallel Execution (Slaves)
[Promise.all] → Execute all slaves simultaneously → Collect results

// Phase 3: Synthesis (Main Brain)
Collected responses → Main Brain → Generate final report
```

**Core Algorithms (`chain-orchestrator.ts`)**
- Adaptive Completion Detection
- Slave Prompt Parsing (Regex-based SLAVE block extraction)
- Skip/Cancel Mechanism (partial completion support)

### 3️⃣ Side Panel Mode

![Side Panel](screen/사이드패널.jpeg)

**Chrome Side Panel API Utilization**
- Overlay capability on all web pages
- Independent state management (`sp_` prefix storage)
- Responsive UI (300px ~ 600px auto-adjust)
- Completely separate history from main app

### 4️⃣ BYOK (Bring Your Own Key) System

![BYOK Settings](screen/BYOK.jpeg)

**Polymorphic Adapter Pattern**
```typescript
interface BYOKAdapter {
  validateKey(apiKey: string): Promise<boolean>;
  fetchModels(apiKey: string): Promise<BYOKModelVariant[]>;
  callAPI(params: APICallParams): Promise<APIResponse>;
}

// Provider-specific implementations
class OpenAIAdapter extends AbstractBYOKAdapter { ... }
class AnthropicAdapter extends AbstractBYOKAdapter { ... }
class GoogleAdapter extends AbstractBYOKAdapter { ... }
```

**3-Stage Key Validation Strategy**
1. `/models` endpoint lookup (cheapest)
2. `fetchModels()` call (metadata-rich)
3. Ultra-lightweight completion request (maxTokens=1)

**Supported Features**
- Real-time model list synchronization (Cloudflare Worker caching)
- Streaming responses (Server-Sent Events)
- Image input (Vision models)
- Reasoning mode (DeepSeek R1, o1)
- Advanced sampling parameters (temperature, top_p, top_k, etc.)

### 5️⃣ Prompt Library

![Prompt Library](screen/prompt.jpeg)

**IndexedDB-Based Unlimited Storage**
- Category-based classification (Coding, Writing, Analysis, etc.)
- One-touch injection (Inject to all models)
- Template variable support (`{{variable}}`)
- Import/Export (JSON)

---

## 🏗️ System Architecture

### Overall Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            React App (TypeScript)                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ App.tsx  │  │SidePanel │  │ Models   │          │   │
│  │  │          │  │App.tsx   │  │Grid      │          │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │   │
│  │       │             │             │                 │   │
│  │  ┌────▼─────────────▼─────────────▼─────┐          │   │
│  │  │     State Management Layer           │          │   │
│  │  │  (usePersistentState + chrome.storage)│         │   │
│  │  └────┬─────────────┬─────────────┬─────┘          │   │
│  │       │             │             │                 │   │
│  │  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐            │   │
│  │  │ BYOK    │  │ History │  │ Chain   │            │   │
│  │  │ Service │  │ Service │  │Orchestr.│            │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘            │   │
│  └───────┼────────────┼────────────┼─────────────────┘   │
│          │            │            │                      │
│  ┌───────▼────────────▼────────────▼─────────────────┐   │
│  │        Background Service Worker                   │   │
│  │  - Cookie Sync (partition mirroring)              │   │
│  │  - Message Routing                                 │   │
│  │  - Context Menu                                    │   │
│  └───────┬────────────┬────────────┬─────────────────┘   │
└──────────┼────────────┼────────────┼─────────────────────┘
           │            │            │
    ┌──────▼──────┐  ┌─▼────────┐  ┌▼──────────────┐
    │ Content.js  │  │ iframe   │  │ AI APIs       │
    │ (DOM Inject)│  │ (WebApps)│  │ (HTTPS/SSE)   │
    └─────────────┘  └──────────┘  └───────────────┘
           │            │            │
    ┌──────▼──────┐  ┌─▼────────┐  ┌▼──────────────┐
    │ ChatGPT     │  │ Claude.ai│  │ OpenAI API    │
    │ Gemini      │  │ Grok     │  │ Anthropic API │
    │ DeepSeek    │  │ ...      │  │ Google API... │
    └─────────────┘  └──────────┘  └───────────────┘
           
    ┌─────────────────────────────────────────────┐
    │   Cloudflare Worker (Edge Server)          │
    │   - OpenRouter model list caching (6 hours) │
    │   - R2 storage-based                        │
    └─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - Functional components + Hooks
- **TypeScript 5.4** - Complete type safety
- **Vite 5.1** - Lightning-fast HMR builds
- **TailwindCSS 3.4** - Utility-first styling
- **i18next** - 14-language internationalization

### Chrome Extension APIs
- **Manifest V3** - Latest extension standard
- **chrome.storage.local** - Persistent data storage
- **chrome.cookies** - Session synchronization
- **chrome.sidePanel** - Side panel mode
- **chrome.scripting** - Dynamic script injection
- **chrome.declarativeNetRequest** - CORS bypass

### Backend (Serverless)
- **Cloudflare Workers** - Edge computing
- **R2 Object Storage** - Model metadata caching
- **Wrangler** - Deployment automation

---

## 🔒 Security & Privacy

### Design Principles

1. **Zero-Server Architecture**
   - All data stored locally
   - No central server (Cloudflare Worker caches metadata only)

2. **API Key Protection**
   - Utilizes chrome.storage.local (OS-level encryption)
   - HTTPS only for network transmission
   - Never logged

3. **Sandbox Isolation**
   - Each model runs in an independent iframe
   - Content Script holds limited permissions only

---

## 🚀 Installation & Build

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn**
- **Chrome** browser (Manifest V3 support)

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/dj20014920/modeldock_studio.git
cd modeldock_studio

# 2. Install dependencies
npm install

# 3. Run development mode (with HMR)
npm run dev

# 4. Production build
npm run build

# 5. Load in Chrome
# chrome://extensions/ → Enable Developer Mode → "Load unpacked" → Select dist folder
```

### Build Output

```
dist/
├── index.html              # Main app entry
├── sidepanel.html          # Side panel entry
├── manifest.json           # Extension configuration
├── background.js           # Service Worker
├── content.js              # Content Script
├── assets/
│   ├── index-[hash].js     # React app bundle
│   ├── sidepanel-[hash].js # Side panel bundle
│   └── index-[hash].css    # Tailwind CSS
└── ai_model_dom_selectors.json  # Model-specific DOM selectors
```

---

## 📂 Project Structure

```
modeldock_studio/
├── public/                          # Static files & Extension core
│   ├── manifest.json               # Chrome Extension config (Manifest V3)
│   ├── background.js               # Service Worker (cookie sync, routing)
│   ├── content.js                  # Content Script (DOM injection, auto-routing)
│   └── ai_model_dom_selectors.json # Model-specific DOM selectors
│
├── src/                             # React application source
│   ├── App.tsx                     # Main app component (full screen)
│   ├── SidePanelApp.tsx            # Side panel component (compact layout)
│   ├── types.ts                    # TypeScript type definitions (357 lines)
│   ├── constants.ts                # Model configurations and constants
│   ├── byokProviders.ts            # BYOK provider metadata
│   │
│   ├── components/                 # React components
│   │   ├── ModelGrid.tsx          # Multi-model grid layout
│   │   ├── BYOKChat.tsx           # BYOK API chat interface
│   │   ├── BrainFlowModal.tsx     # BrainFlow configuration modal
│   │   └── ... (20+ components)
│   │
│   ├── services/                   # Business logic layer
│   │   ├── byokService.ts         # BYOK API integration (2,253 lines)
│   │   ├── chain-orchestrator.ts  # BrainFlow orchestrator (625 lines)
│   │   └── ... (6 services)
│   │
│   └── locales/                    # Multi-language translation files
│       ├── en.ts                  # English
│       ├── ja.ts                  # Japanese
│       ├── zh-CN.ts               # Simplified Chinese
│       └── ... (14 languages)
│
├── cloudflare-worker/              # Cloudflare Worker server
│   ├── src/
│   │   └── index.js               # Main Worker (492 lines)
│   └── wrangler.toml              # Cloudflare deployment config
│
└── README.md                       # This document
```

---

## 📄 License

**MIT License**

---

## 🙏 Acknowledgments

This project was inspired by the following open-source projects:

- **ChatHub** - Multi-chat interface idea
- **OpenRouter** - Model integration API
- **React** - UI framework
- **Cloudflare Workers** - Serverless infrastructure

---

## 📞 Contact & Support

- **GitHub Issues**: [Bug Reports & Feature Requests](https://github.com/dj20014920/modeldock_studio/issues)
- **Email**: vinny4920@gmail.com
- **Website**: www.emozleep.space (deployment to website, npm, etc. planned)

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | ~15,000 lines |
| **TypeScript Files** | 45+ |
| **React Components** | 20+ |
| **Supported AI Models** | 11+ |
| **BYOK Providers** | 10 |
| **Languages** | 14 |
| **Build Size** | ~2.5 MB (minified) |

---

<div align="center">
  
### ⭐ If you find this project useful, please give it a Star!

**Built with ❤️ by ModelDock Team**

[⬆ Back to Top](#-modeldock-studio)

</div>
