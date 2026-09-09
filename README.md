# Squishy Pals · 软软伙伴

在浏览器里捏、拉、戳软软的海洋伙伴：糯糯八爪鱼、绵绵小墨鱼和啵啵小鱿鱼。

## 运行

需要 Node.js 22.13+（物理测试建议 22.18+）。

```sh
npm install
npm run dev
```

打开终端显示的本地地址。使用支持 WebGPU、开启硬件加速的浏览器；远程访问需要 HTTPS。应用直接创建 Three.js 的 `Renderer + WebGPUBackend`，不注册 WebGL 回退。设备不支持时显示说明。

## 交互

- 按住脑袋不移动：局部凹陷。
- 拖动脑袋或任意腕足：拉伸、牵动其他腕足；释放后重力落地、压扁回弹。
- 空格 /「戳一下」：缩腕、轻跳、摊开。
- 右侧：四种颜色、原有 / 果冻 / 机械材质、软硬、阻尼；「恢复原状」恢复姿态及默认参数。
- 六种伙伴均可切换材质，保留当前姿态、颜色和饰品；材质与软硬、阻尼独立。八爪鱼的机械模式使用分节外壳和关节，其他伙伴暂时沿用原有造型的机械涂装。机械八爪鱼不再是独立角色，旧链接跳转到八爪鱼页面。切换伙伴时保留当前选择的材质，「恢复原状」回到原有材质。
- 支持触屏指针输入；滑块可用方向键调整。空格在滑块或按钮获得焦点时保留控件本身的键盘行为。

## 结构

- `src/core/playground.ts`：WebGPU 生命周期、镜头、动画循环与尺寸适配。
- `src/core/lighting.ts`：共用摄影棚灯光、环境与接触阴影。
- `src/core/input.ts`：射线拾取、按压/拖动区分、指针捕获和键盘。
- `app/page.tsx`、`app/pals/page.tsx`：品牌落地页与小伙伴图鉴。
- `src/core/PlaygroundPage.tsx`、`app/globals.css`：共用控制面板、角色选择与响应式页面。
- `src/characters/types.ts`：精简角色接口。
- `src/characters/materials.ts`：身体表面的材质预设与实例复用，眼睛和饰品保持独立。
- `src/characters/octomochi.ts`：连续隐式表面、八组腕足弹簧链、蒙皮、表情、吸盘和专属动作。
- `src/characters/cuttlemochi.ts`：宽椭圆墨鱼、沿身体两侧的波浪鳍与十条腕足。
- `src/characters/squidmochi.ts`：细长鱿鱼、尾部三角鳍与十条腕足。
- `src/characters/registry.ts`：当前可选角色及默认参数。

新增伙伴时实现 `Character`，登记名称、默认参数及工厂即可。身体结构、可抓部位、形变、表情和专属动作由各角色定义，共用逻辑不依赖八条腕足。`diagnostics` 中的 `bodyX/bodyZ/bodyHeight` 可选值供接触阴影跟随。

## 实现边界与性能

八爪鱼在初始化时由平滑联合距离场生成闭合网格，运行时以弹簧链驱动表面；墨鱼和鱿鱼使用独立腕足弹簧与覆盖身体、鳍和表情的连续形变场，受力时局部拉伸，释放后惯性形变逐渐衰减。采用弹性上限、桌面约束、阻尼与落地压缩，侧重解压玩具手感，并非完整的体积有限元模拟。固定上限 1/120 秒物理子步；像素比封顶 1.6，避免高分屏过度填充。右上角 FPS 为实际动画帧间隔采样，目标约 60，具体取决于设备与浏览器。

```sh
npm run typecheck
npm run test:physics
npm run test:stage
npm run test:parameters
npm run test:heading
npm run test:switching
npm run test:materials
npm run build
```

物理测试覆盖章鱼八条腕足，以及墨鱼和鱿鱼的按压、拖拽、释放、软硬/阻尼极值、超范围拖动、戳跳、重置和资源释放。

舞台测试覆盖六种伙伴及八爪鱼机械形态的桌面、手机和窄屏取景、边缘拖动及释放。互动区按角色轮廓自动取景，扩大画布时保留移动余量；拖动边界随镜头更新，角色本地坐标中的移动约束同时作用于身体和松手后的惯性。

目标图：`docs/target-reference.png`。生成方式和最终提示词：`docs/visual-reference.md`。

技术依据：[Three.js WebGPU](https://threejs.org/manual/en/webgpurenderer)、[物理材质](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)。

### 首页与角色入口

- `/`：品牌落地页，只提供图鉴入口，不展示具体角色、不初始化 WebGPU。
- `/pals`：小伙伴图鉴，展示全部角色并进入各自试玩。
- `/pals/[id]`：对应角色的独立游玩页，例如 `/pals/octomochi`；未知角色返回 404。
- 新增动物：实现 `Character` 接口，在 `src/characters/registry.ts` 登记名称、介绍、封面、图标、默认参数与 `load` 动态加载函数。首页和游玩入口自动读取此列表，不需要修改首页或通用场景。
- `public/pals/*.png` 是 WebGPU 角色的实际渲染截图，用作图鉴封面及选择器缩略图。
