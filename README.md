# Squishy Pals · 软软伙伴

在浏览器里捏、拉、戳一只软软的 OctoMochi · 糯糯八爪鱼。

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
- 右侧：四种颜色、软硬、阻尼；「恢复原状」恢复姿态及默认参数。
- 支持触屏指针输入；滑块可用方向键调整。空格在滑块或按钮获得焦点时保留控件本身的键盘行为。

## 结构

- `src/core/playground.ts`：WebGPU 生命周期、镜头、动画循环与尺寸适配。
- `src/core/lighting.ts`：共用摄影棚灯光、环境与接触阴影。
- `src/core/input.ts`：射线拾取、按压/拖动区分、指针捕获和键盘。
- `app/page.tsx`、`app/globals.css`：共用控制面板与响应式页面。
- `src/characters/types.ts`：精简角色接口。
- `src/characters/octomochi.ts`：连续隐式表面、八组腕足弹簧链、蒙皮、表情、吸盘和专属动作。
- `src/characters/registry.ts`：当前可选角色及默认参数。

新增伙伴时实现 `Character`，登记名称、默认参数及工厂即可。身体结构、可抓部位、形变、表情和专属动作由各角色定义，共用逻辑不依赖八条腕足。`diagnostics` 中的 `bodyX/bodyZ/bodyHeight` 可选值供接触阴影跟随。

## 实现边界与性能

外形在初始化时由平滑联合距离场生成闭合网格；运行时用低分辨率弹簧节点驱动高分辨率表面。采用弹性上限、桌面约束、阻尼与落地压缩，侧重解压玩具手感，并非完整的体积有限元模拟。固定上限 1/120 秒物理子步；像素比封顶 1.6，避免高分屏过度填充。右上角 FPS 为实际动画帧间隔采样，目标约 60，具体取决于设备与浏览器。

```sh
npm run typecheck
npm run test:physics
npm run build
```

物理测试覆盖所有八条腕足、软硬/阻尼极值、超范围拉伸、局部压痕、抬起落地、戳跳和重置。

目标图：`docs/target-reference.png`。生成方式和最终提示词：`docs/visual-reference.md`。

技术依据：[Three.js WebGPU](https://threejs.org/manual/en/webgpurenderer)、[物理材质](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)。
