# 论文百科

DeepSeek Harness Web 插件。沿用「代码百科」的文档库、章节目录和正文排版，读取本地 PDF 论文，并生成带页码引用的中文讲解。

## 安装

需要 Node.js 22.13.0 或更高版本。进入项目目录后运行：

```sh
npm ci
npm run check
npm pack
dsh plugin --profile web add ./dsh-paper-wiki-0.1.3.tgz
```

也可在 DSH「插件 → 添加插件」中输入安装包的绝对路径，安装后启用。如果 DSH 提示重启，使用原启动命令重启 Web 服务。依赖 PDF.js 会随插件安装，首次安装需要访问 npm 或已有依赖缓存。

## 使用

1. 在侧栏打开「论文百科」，点击右上角「新建 Wiki」，选择论文。
2. 手动点击「生成讲解」，插件读取 PDF 后生成讲解。选择文件、打开或刷新页面都不会自动调用模型；没有单独的导入步骤。
3. 生成完成后，按「论文概览、研究问题与贡献、方法与关键概念、实验与主要结果、局限与阅读建议」阅读中文说明。界面仅展示讲解，不展示 PDF 或提取的逐页文字。
4. 讲解中的页码标注提供原文依据，讲解可以导出为 Markdown。

任务在 DSH 服务后台运行，切换面板或刷新页面后可查看进度；取消后可以重新生成。重启 DSH 会中断正在执行的任务。重新生成成功后更新讲解，失败时保留此前保存的版本。

模型输出中的引用须指向已提取的有效页码，引用原句须能在对应页文字中找到。插件还会请求模型检查事实依据；未通过时最多修订一次，仍不通过则报告失败。此检查不能保证对公式、图表或研究结论的解释完全准确，阅读时可用页码引用核对原文。

## 第一版范围

支持有可提取文字的 PDF，单文件最多 30 MiB、150 页，提取文字最多 600,000 字符。中文讲解最多处理 120,000 字符的提取文字；超过限制会明确提示，不会截断后声称已读完整篇论文。

扫描件、仅含图片的 PDF 和加密 PDF 会提示无法读取。没有文字层的图表、复杂排版和公式可能无法完整提取；可在 PDF 原文中查看。导入成功不代表每个图表都已被模型读取。

## 模型配置与数据

默认使用 DSH 当前默认模型及其凭据。若需要与「代码百科」使用同一个单独配置的服务，可为本插件设置相同的 `modelConfigFile`；它不会自动继承其他插件的设置。

在当前 profile 的 `cordis.patch.yml` 中设置：

```yaml
- id: dsh-paper-wiki
  config:
    modelConfigFile: /absolute/path/config.local.json
```

该 JSON 文件沿用「代码百科」的 `judge` 配置格式，例如：

```json
{
  "judge": {
    "url": "https://your-provider.example/v1/chat/completions",
    "model": "your-model",
    "api_key_env": "YOUR_MODEL_API_KEY"
  }
}
```

PDF 文字提取在本地完成。手动点击「生成讲解」后，插件会把提取的论文文字、引用及讲解草稿发送到所选模型服务。模型配置文件和凭据不随插件打包。

数据保存在当前 DSH profile：

```text
dsh-paper-wiki/
└── papers/
    └── <论文编号>/
        ├── paper.json
        └── original.pdf
```

`paper.json` 保存论文元数据、逐页文字及已通过检查的讲解；`original.pdf` 保存导入时的 PDF。删除论文会删除这两项存档，源文件不受影响。

## 开发检查

```sh
npm test
npm run build
npm run check:package
```

`npm run check` 顺序执行以上检查。安装包检查在临时目录离线安装生成的包，验证发布文件清单、JavaScript 语法、入口导出、PDF.js 依赖和浏览器构建产物。离线安装需要先完成一次 `npm ci`，让依赖进入 npm 缓存。模型输出的内容质量及真实 DSH 浏览器交互还需实际试用确认。
