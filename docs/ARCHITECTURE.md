# 架构与开发入口

## 项目与技术栈

浏览器端 3D 互动应用，使用 React 19、TypeScript strict、Three.js WebGPU；页面采用 Next 风格 App Router，实际运行与构建由 Vinext + Vite 提供。界面使用 Tailwind CSS 4、Base UI / shadcn 和 Lucide。准确依赖版本及脚本以 [package.json](../package.json) 和 [package-lock.json](../package-lock.json) 为准。

[vite.config.ts](../vite.config.ts) 集成 Vinext、Sites、Cloudflare 与 Tailwind PostCSS。Cloudflare 使用 `vinext/server/fetch-handler`、`nodejs_compat` 和 `rsc` / `ssr` 环境；[next.config.ts](../next.config.ts) 当前为空配置，不使用标准 `next dev/build` 命令。

## 开发与调试环境

- 在仓库根目录运行命令。本机工作区为 `/Users/farghost/GithubProjects/squishy-pals`，环境为 macOS / zsh；项目没有要求专用容器。
- Node.js 声明下限为 22.13，包管理器为 npm。本机核对值为 Node 22.17.0、npm 11.10.1；不是新增版本锁定。README 建议物理测试使用 Node 22.18+。
- 浏览器必须提供 `navigator.gpu` 与可用 adapter，并开启硬件加速；本地使用 localhost，远程访问使用 HTTPS。渲染器直接创建 `Renderer + WebGPUBackend` 且 `getFallback: null`，没有 WebGL 回退。
- 开发地址以启动终端输出为准，不把临时端口、PID 或已启动状态写入文档。复用本轮已知开发实例；日志首先查看启动终端。
- Wrangler 日志目录配置为 `.wrangler/logs`，默认 `WRANGLER_WRITE_LOGS=false`；Miniflare registry 为 `.wrangler/registry`。`CODEX_SANDBOX=seatbelt` 时配置使用 polling 支持 HMR，其余环境使用默认文件监听。
- 当前应用无必需业务环境变量、数据库、测试账号或外部 API。应用环境值放在 Git 忽略的 `.env*`，不写入源码、Harness 或日志。
- 上述环境和机制于 2026-09-09 依据包清单、Vite 配置、渲染入口及本机版本命令核对；这是文档事实核对，不代表已完成浏览器兼容或构建验收。

## 运行命令

```sh
npm ci
npm run dev
```

已有依赖可直接启动；`npm ci` 用于按锁文件安装，显式变更依赖时才更新清单和锁文件。

```sh
npm run typecheck
npm run lint
npm run build
npm run start
```

`build` 执行 `vinext build`；`start` 执行 Wrangler 本地预览，依赖先生成的 `dist/server/wrangler.json`，不是线上发布命令。`format` 为写操作，只在需要格式调整的范围使用，避免格式化无关文件。

## 模块与数据流

| 位置 | 职责与边界 |
| --- | --- |
| [app/page.tsx](../app/page.tsx) | 品牌首页，可直接进入八爪鱼或图鉴，不加载角色与 WebGPU |
| [app/pals/page.tsx](../app/pals/page.tsx) | 从注册表读取角色，生成图鉴入口 |
| [app/pals/layout.tsx](../app/pals/layout.tsx) | 根据路径挂载共用试玩页，角色间客户端导航保留画布；离开角色路径卸载 |
| [app/pals/[id]/page.tsx](../app/pals/[id]/page.tsx) | 校验角色 ID、404 与旧链接重定向；实际画布在父布局 |
| [PlaygroundPage.tsx](../src/core/PlaygroundPage.tsx) | React 控件状态、路由选择、引擎动态加载、错误与重试；同步参数至引擎 |
| [playground.ts](../src/core/playground.ts) | Renderer、Scene、Camera、尺寸、动画循环、角色/输入/饰品生命周期 |
| [character-cache.ts](../src/core/character-cache.ts) | 按 ID 合并准备请求、缓存角色及静态凸包取景轮廓、确保最新选择生效、失败重试与卸载 |
| [input.ts](../src/core/input.ts) | 射线拾取、按压与拖动区分、指针捕获/取消、空格与失焦处理；悬浮命中复查 |
| [grab-hand.ts](../src/core/grab-hand.ts) | 相机朝向的四指卡通手套，软胶/果冻/机械材质，跟随命中与抓取目标并释放资源 |
| [stage.ts](../src/core/stage.ts) / [lighting.ts](../src/core/lighting.ts) | 取景、屏幕边缘阻力、本地移动约束；摄影棚环境、灯光与接触阴影 |
| [registry.ts](../src/characters/registry.ts) / [types.ts](../src/characters/types.ts) | 轻量角色元数据、默认值、动态加载工厂；角色与引擎接口 |
| [src/characters](../src/characters) | 各角色造型、物理、抓取、表情、动作；`octopus.ts` 组合八爪鱼软体/机械实例，`coastalmochi.ts` 实现海豹/海龟/螃蟹 |
| [materials.ts](../src/characters/materials.ts) | 显式身体表面的材质预设、实例复用及面部显示适配；不统一替换饰品 |
| [accessory-options.ts](../src/core/accessory-options.ts) / [accessories.ts](../src/core/accessories.ts) | 饰品选项与槽位互斥；按角色定位、变形跟随及资源释放 |
| [components/ui](../components/ui) / [app/globals.css](../app/globals.css) | 通用控件适配与产品页面样式 |

### 接口与状态

- `RegisteredCharacter` 提供显示元数据、默认参数、可选镜头和异步 `load()`；工厂再创建 `Character`。首页、图鉴和选择器不应直接导入重型角色实现。
- `Character` 持有 Three Group，提供拾取、抓取开始/移动/结束、更新、专属动作、参数、重置、约束和释放接口。共享输入将 `GrabHit.handle` 原样传回，不解释角色部位编号。
- `CharacterParameters` 包含颜色、材质、软硬、阻尼及可选 `view`；材质类型为 `original | jelly | mechanical`。页面滑块 0–100 映射到模型的 0–1；`view` 是模型接口，当前页面没有独立视角切换控件。
- `setMovementConstraint` 在角色本地空间约束位置及可选速度，角色求解器负责应用，包括释放后的惯性；`deformAccessory` 是可选的本地空间形变接口。
- React 管理当前控件选择，引擎管理活动角色及材质/饰品选择，角色管理物理状态。状态保留和重置的产品契约见 [PRODUCT](PRODUCT.md#状态与操作语义)。没有 localStorage、数据库或其他持久化层。

### 加载、切换与释放

1. 试玩页动态导入引擎，角色模块可与渲染器初始化并行加载；选择器 hover/focus 预热路由和角色。缓存复用角色准备 Promise，引擎依次预编译三种材质。
2. 切换以递增请求序号保证最新请求生效；较慢旧请求可留在缓存，但不覆盖当前选择。切换准备期间保留旧场景，释放旧输入，设置控件禁用。
3. 准备成功后替换场景角色及饰品，重置角色、应用参数，重新取景和绑定输入。准备失败清理失败缓存及实例，已有场景可重新绑定输入，界面允许重试。
4. 上述恢复针对加载/准备失败；激活回调没有通用事务回滚。WebGPU 初始化失败显示支持环境说明，页面内重试按钮只针对引擎已就绪后的角色加载。
5. 卸载停止动画、断开 ResizeObserver、释放输入/饰品并移除 canvas；缓存等待在途准备结束后销毁角色，再释放场景、环境和渲染器。关闭后不允许再次激活角色。

动画循环限制单帧步长，页面隐藏时跳过更新和渲染；物理子步与形变规则由角色负责。画布采样比取设备像素比并限制在 1.5–2，以改善低像素比显示器上的模型轮廓。诊断可读取 canvas 的 `data-backend`、`data-pal`、`data-diagnostics`，其中角色诊断的 `bodyX/bodyZ/bodyHeight` 供阴影跟随；`data-hand` / `data-hand-material` 记录手套可见阶段和材质。手机外观模式沿用同一 canvas，通过 CSS 固定预览，模式切换不重建引擎。引擎保留可选 `onFps` 回调，当前页面未接入 FPS 显示。

## 扩展角色

先按 [新增伙伴成功标准](PRODUCT.md#新增伙伴成功标准) 确定必验视角。内部验收可调用已有 `setParameters({ view: 'front' })` 或 `setParameters({ view: 'side' })` 设置对应视角，并在真实 WebGPU 场景中截图；该接口不要求在右侧工具栏提供视角控件。具体左右朝向以角色实现核实，不假设所有角色的正面对应相同旋转角。

1. 实现 [Character 接口](../src/characters/types.ts)，保留角色自己的身体结构、可抓部位、形变与动作；不要让共用场景假定八条腕足。
2. 在注册表登记稳定 ID、展示内容、默认参数、封面及 `load()`；提供图鉴封面和 `public/pals/<id>-front.png` 正面缩略图。
3. 同步 [accessories.ts](../src/core/accessories.ts) 中按 ID 必填的 `fits`。眼镜定位通常依赖 `left-eye` / `right-eye` 命名节点，部分角色有专用坐标；必要时提供 `deformAccessory`。仅登记工厂不足以完成饰品接入。
4. 按角色结构检查拾取、约束、重置、材质、饰品和释放，并把新角色纳入相关测试或专属脚本。多个脚本枚举固定工厂，新增注册项不会自动获得测试覆盖。

## 样式与参考输入

样式入口为 [app/layout.tsx](../app/layout.tsx) 导入 `app/globals.css`；首页、图鉴和游乐场分别使用 `app/home.module.css`、`app/pals/catalogue.module.css` 与 `src/core/playground.module.css`。全局 CSS 保留 Tailwind、主题及既有历史规则，当前页面布局以模块样式为准。公共控件由 `components/ui` 持有。Three.js 的灯光、材质和几何由渲染代码管理，不由页面 CSS 定义。

当前实际设计见根目录 [DESIGN.md](../DESIGN.md)，由本轮界面重设计形成；没有独立 `brand.css`，具体规则在上述页面模块中。已有 [目标图](target-reference.png)、[生成说明](visual-reference.md)、[角色优化记录](character-fidelity.md) 和 [局部角色审阅图](coastal-review) 可作为相关任务的参考入口；这些文件并不自动构成所有页面、状态和设备的批准基线。Harness 只记录工程接入，不审计或改写其设计内容。

## 验证命令与覆盖边界

按 [QUALITY-GATES](QUALITY-GATES.md) 的风险等级选择命令；以下是检查能力清单，不是每轮必跑列表。

| 命令 | 当前覆盖 |
| --- | --- |
| `npm run typecheck` / `npm run lint` | TypeScript 检查 / Oxlint 静态检查 |
| `npm run test:physics` | 八爪鱼软体与机械实例，以及墨鱼、鱿鱼、金鱼、鲸鱼、鲨鱼的求解器、抓取、边界、重置和释放 |
| `npm run test:faces` | 鲸鱼眼睛、鱿鱼五官的真实顶点与身体同场形变，覆盖按压、拖动、材质切换、眨眼与恢复 |
| `npm run test:coastal` | 海豹、海龟、螃蟹的形变、附肢、专属动作、材质、饰品、转向与视口约束 |
| `npm run test:stage` | 原六类伙伴及机械八爪鱼的取景、拖动边界与释放 |
| `npm run test:parameters` | 原六类伙伴及机械八爪鱼的软硬/阻尼差异 |
| `npm run test:heading` | 头足类与鱼类的头部转向、材质/饰品跟随及不应转向的反例 |
| `npm run test:views` | 九类伙伴的默认朝向、模型视角接口、各材质下的拖动与饰品 |
| `npm run test:materials` / `npm run test:accessories` | 原六类伙伴及机械八爪鱼的材质切换、饰品互斥/跟随和资源释放 |
| `npm run test:switching` | 缓存复用、过期选择、准备失败重试、关闭与几何准备耗时；编译回调为模拟 |
| `node --experimental-strip-types scripts/test-smiles.ts` | 鲸鱼与鲨鱼嘴部网格、贴肤及变形；未注册 npm 别名 |
| `npm run build` | Vinext / Vite / Cloudflare 构建链 |

现有测试使用 Node 的类型擦除与 `node:assert/strict`，运行模型、几何及缓存逻辑，不创建浏览器 Renderer。不能以这些脚本通过推断 GPU 编译、网页路由、真实指针输入、触屏或视觉已通过；涉及这些结果需按质量门禁补运行证据。

## 外部服务与托管边界

[.openai/hosting.json](../.openai/hosting.json) 保存既有 Sites 项目标识，保留其归属。Vite 支持按该配置读取可选 D1/R2 绑定，当前未声明绑定，应用也未实现业务 API、认证或存储；不将脚手架能力写成已启用功能。

构建输出在 `dist/`，本地平台状态在 `.wrangler/`，均为忽略产物。不要手改生成输出代替修改源码。实际托管操作沿用 Sites 工作流和当前用户授权；生成或维护 Harness 文档不需要发布网站或修改托管配置。
