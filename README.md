# ClassicGamesHub 🎮

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-5_Languages-FF6B6B?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

一个基于 **React** 和 **TypeScript** 构建的经典游戏合集，拥有丝滑的加载体验、完整的多语言支持（5种语言）、以及极致的性能优化。

## 🎮 在线体验 (Live Demo)

无需安装，点击下方链接直接开始游玩：

👉 **[https://games.xiaoclab.top](https://games.xiaoclab.top)** 👈

---

## ⚡ 核心特性

- **20+经典游戏** - 从传统的贪吃蛇、俄罗斯方块到现代的2048、数独等
- **5种语言支持** - 完整的i18n国际化：英文、中文、俄文、日文、韩文
- **代码分割优化** - 游戏级别的代码分割，每个游戏独立加载（chunks目录）
- **Gzip压缩** - 最高级别(9)的gzip压缩，生产构建自动生成.gz文件
- **ESM格式** - 现代ES模块加载，充分利用浏览器缓存机制
- **响应式设计** - 完美支持桌面、平板、手机设备
- **性能监测** - 详细的构建统计和压缩比率显示

## 🛠️ 快速开始 (Quick Start)

### 1. 环境准备

确保已安装 [Node.js](https://nodejs.org/) (建议18.0+)。

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式

启动热重载开发服务器：

```bash
npm run dev
```

### 4. 生产构建

构建优化版本（包含代码分割、压缩、gzip）：

```bash
npm run build
```

构建完成后，输出目录结构如下：

```
dist/
├── index.html           # 主入口
├── main-[hash].js       # 主应用代码
├── chunks/
│   ├── common-[hash].js      # 通用库代码
│   ├── locale-[hash].js      # i18n语言包
│   ├── [game-name]-[hash].js # 每个游戏独立chunk
│   └── ...
├── assets/
│   ├── [asset-hash].png
│   └── ...
├── main-[hash].css           # 样式文件
└── *.gz                       # gzip压缩版本（自动生成）
```

## 📊 构建优化说明

### 代码分割策略

- **entry chunk**: `main-[hash].js` - 应用主入口和通用代码
- **game chunks**: 每个游戏作为独立chunk放在`chunks/`目录
- **命名规则**: `[type]-[hash]` 确保缓存友好

### Gzip压缩

生产构建自动为所有`.js`和`.css`文件生成`.gz`压缩版本：

```bash
✓ main-abc123.js (45KB) → main-abc123.js.gz (12KB) [73.3% 压缩率]
✓ chunks/snake-def456.js (8.5KB) → chunks/snake-def456.js.gz (2.1KB) [75.3% 压缩率]
✓ main-789ghi.css (25KB) → main-789ghi.css.gz (5KB) [80% 压缩率]
```

### 性能指标

- 初始加载时间：< 2s（gzip压缩后）
- 单个游戏加载：< 500ms
- 总包体积（gzip）：< 150KB

## 🌍 国际化支持 (i18n)

项目支持5种语言，完全国际化实现：

| 语言 | 代码 | 文件 |
|------|------|------|
| English | en | `src/i18n/locales/en.json` |
| 中文 | zh | `src/i18n/locales/zh.json` |
| Русский | ru | `src/i18n/locales/ru.json` |
| 日本語 | ja | `src/i18n/locales/ja.json` |
| 한국어 | ko | `src/i18n/locales/ko.json` |

每个语言文件包含 **105个翻译键**：
- 75个通用键（UI、按钮、提示等）
- 10个仪表板键（Dashboard相关）
- 20个游戏键（游戏内文本）

### 切换语言

在应用中使用`LanguageSwitcher`组件自动切换语言，选择自动保存到`localStorage`。

### 添加新语言

1. 在 `src/i18n/locales/` 创建新文件，如 `de.json`
2. 参考已有的en.json填充所有键值对
3. 在 `src/i18n/config.ts` 中注册新语言
4. 在 `LanguageSwitcher.tsx` 中添加语言选项

## 🎮 游戏列表 (20 Classic Games)

| 游戏 | 类别 | 技术 |
|------|------|------|
| 贪吃蛇 (Snake) | 益智 | Canvas |
| 俄罗斯方块 (Tetris) | 益智 | Canvas |
| 2048 | 拼图 | DOM |
| 数独 (Sudoku) | 逻辑 | React |
| 扫雷 (Minesweeper) | 逻辑 | React |
| 记忆配对 (Memory Match) | 反应 | React |
| 打地鼠 (Whack A Mole) | 反应 | Canvas |
| 水果切割 (Fruit Slicer) | 反应 | Canvas |
| 打鸟 (Flappy Bird) | 障碍 | Canvas |
| 恐龙跑酷 (Dino Run) | 障碍 | Canvas |
| 迷宫 (Maze Generator) | 生成 | Canvas |
| 的生命游戏 (Game of Life) | 元胞自动机 | Canvas |
| PacMan | 冒险 | Canvas |
| 大球吃小球 (Agario) | 策略 | Canvas |
| 乒乓球 (Pong) | 对战 | Canvas |
| 玩具钢琴 (Simon Says) | 记忆 | Audio |
| 滑动拼图 (Sliding Puzzle) | 拼图 | React |
| 打字速度 (Typing Speed) | 技能 | React |
| 彩色方块 (Breakout) | 益智 | Canvas |
| 井字棋 (Tic Tac Toe) | 策略 | React |

## 📁 项目结构

```
src/
├── App.tsx                    # 主应用组件
├── main.tsx                   # 入口点
├── components/
│   ├── LanguageSwitcher.tsx   # 语言切换器
│   ├── PageTransition.tsx     # 页面过渡动画
│   └── ui/                    # shadcn/ui组件库
├── hooks/
│   ├── use-mobile.tsx         # 移动设备检测
│   └── use-toast.ts           # 通知提示
├── i18n/
│   ├── config.ts              # i18next配置
│   └── locales/               # 语言包 (5个文件)
├── layouts/
│   └── MainLayout.tsx         # 主布局组件
├── lib/
│   ├── games.ts               # 游戏元数据
│   └── utils.ts               # 工具函数
├── pages/
│   ├── Dashboard.tsx          # 游戏列表页
│   ├── Home.tsx               # 首页
│   └── games/                 # 20个游戏组件
└── services/
    └── playtimeService.ts     # 游戏时长统计

scripts/
└── build.mjs                  # esbuild构建脚本（2,150+ 字节）
```

## 🔧 技术栈

- **前端框架**: React 18.3.1 + React Router 7.5.3
- **编程语言**: TypeScript 5.x
- **样式**: Tailwind CSS 3.4.17
- **国际化**: i18next 25.1.2 + react-i18next 15.5.1
- **构建工具**: esbuild 0.25.4
- **UI组件**: shadcn/ui
- **字体**: Geist Mono

## 🚀 性能优化

1. **代码分割** - 游戏级别的chunk分割，独立缓存
2. **Gzip压缩** - 自动生成.gz文件，压缩率70-80%
3. **Tree-shaking** - 移除未使用代码，减少包体积
4. **ESM格式** - 现代模块格式，支持浏览器缓存优化
5. **PostCSS优化** - Autoprefixer为CSS自动添加前缀
6. **资源预加载** - 智能prefetch/preload策略

## 📝 配置文件说明

- **tsconfig.json** - TypeScript编译配置
- **tailwind.config.js** - Tailwind CSS主题配置
- **postcss.config.js** - PostCSS处理器配置
- **.browserslistrc** - 浏览器兼容性目标
- **index.html** - HTML模板（支持ESM加载）

更详细的优化说明见 [BUILD_OPTIMIZATION.md](./BUILD_OPTIMIZATION.md)

## 📄 许可证

MIT License - 自由使用和修改

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新**: 2024年 | **版本**: 2.0.0-optimization
