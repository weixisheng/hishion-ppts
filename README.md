基于 [html-ppt-skill](https://github.com/lewislulu/html-ppt-skill) 制作的 HTML 演示文档集合，统一管理共享资源（字体、主题、runtime），每份 PPT 独立子目录。

## 目录结构

```
hishion-ppts/
├── index.html                  # 导航首页（列出所有 PPT）
├── assets/                     # 共享资源（所有 PPT 引用 ../assets/）
│   ├── fonts.css
│   ├── base.css
│   ├── runtime.js
│   ├── themes/                 # 4 个主题（T 键循环切换）
│   │   ├── corporate-clean.css
│   │   ├── swiss-grid.css
│   │   ├── minimal-white.css
│   │   └── tokyo-night.css
│   └── animations/
│       └── animations.css
└── shiwan-retrospective/       # 石湾赋码采集关联系统项目复盘
    ├── index.html
    ├── style.css
    └── README.md
```

## 现有 PPT

| 子目录 | 标题 | 主题 | 页数 |
|---|---|---|---|
| `shiwan-retrospective/` | 赋码采集关联系统（石湾版）项目复盘 | corporate-clean | 22 |

## 本地预览

直接双击 `index.html` 即可。如果需要更接近 GitHub Pages 真实环境（推荐演讲者模式联调时使用）：

```bash
python -m http.server 8080
```

浏览器访问 `http://localhost:8080`。

## 键盘操作

- `S` 进入演讲者模式（弹出独立窗口，含 当前页 / 下一页 / 逐字稿 / 计时器 4 个磁吸卡片）
- `← →` / 空格 / PgUp PgDn 翻页
- `T` 切换主题
- `F` 全屏
- `O` 总览
- `R` 重置计时器（演讲者模式下）
- `Esc` 关闭浮层

## 新增一份 PPT

1. 复制 `shiwan-retrospective/` 为新目录（如 `cookbook-2026/`）
2. 修改 `index.html` 标题、`<title>`、内容
3. 修改 `style.css` 自定义样式（如果有）
4. 在根目录 `index.html` 的导航卡片中添加入口

## 部署到 GitHub Pages

```bash
# 在本目录初始化（如果还未初始化）
git init
git add .
git commit -m "init: hishion-ppts collection"

# 创建 GitHub 仓库并推送
gh repo create hishion-ppts --public --source=. --push
gh repo edit --enable-pages --pages-source main:/
```

部署后访问：`https://<你的 GitHub 用户名>.github.io/hishion-ppts/`

## 与 hishion 笔记仓库的关系

- 此目录位于 `hishion/hishion-ppts/`
- 在 `hishion/.gitignore` 中已忽略 `/hishion-ppts/`
- 两个仓库**完全独立**：obsidian 笔记仓库不追踪 PPT，PPT 仓库自己独立 git 管理
