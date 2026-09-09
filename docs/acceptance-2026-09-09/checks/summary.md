# 全伙伴内部回归检查结果

首轮共 16 条顶层执行命令：14 通过、2 失败。恢复原始源码后补跑最终 typecheck/build 均通过，累计 18 条命令：16 通过、2 失败。9 个 npm test:* 中 8 通过，test:physics 失败；test-smiles/typecheck/build 通过，lint 失败；3 个补跑均通过。未修改产品代码、测试或配置。

环境：Node v22.17.0 / npm 11.10.1；起始 Git HEAD ac441c4d3107c2122ffaf02bbc7dc9ab0da8c9f9，起始工作区干净。

**最终源码核验：** 主代理已移除 playground/input 临时调试；本次补跑前后 `git diff -- src` 均为空。最终原始源码的 typecheck 与 build 均通过，见 final-typecheck.log、final-build.log、final-results.json、final-source-state.txt。首轮 lint 失败位置均不在临时调试文件。

| 命令 | 结果 | 秒 | 日志 |
| --- | --- | ---: | --- |
| `npm run test:physics` | 失败 exit 1 | 45.608 | [test-physics.log](test-physics.log) |
| `npm run test:coastal` | 通过 | 41.257 | [test-coastal.log](test-coastal.log) |
| `npm run test:stage` | 通过 | 252.439 | [test-stage.log](test-stage.log) |
| `npm run test:parameters` | 通过 | 47.749 | [test-parameters.log](test-parameters.log) |
| `npm run test:views` | 通过 | 6.682 | [test-views.log](test-views.log) |
| `npm run test:heading` | 通过 | 20.799 | [test-heading.log](test-heading.log) |
| `npm run test:accessories` | 通过 | 2.383 | [test-accessories.log](test-accessories.log) |
| `npm run test:switching` | 通过 | 1.053 | [test-switching.log](test-switching.log) |
| `npm run test:materials` | 通过 | 2.752 | [test-materials.log](test-materials.log) |
| `node --experimental-strip-types scripts/test-smiles.ts` | 通过 | 1.510 | [test-smiles.log](test-smiles.log) |
| `npm run typecheck` | 通过 | 2.402 | [typecheck.log](typecheck.log) |
| `npm run lint` | 失败 exit 1 | 1.238 | [lint.log](lint.log) |
| `npm run build` | 通过 | 7.197 | [build.log](build.log) |
| `node --experimental-strip-types scripts/test-cephalopods.ts createWhaleMochi` | 通过 | 23.430 | [physics-whale.log](physics-whale.log) |
| `node --experimental-strip-types scripts/test-cephalopods.ts createSharkMochi` | 通过 | 31.133 | [physics-shark.log](physics-shark.log) |
| `node --experimental-strip-types scripts/test-physics.ts --mechanical` | 通过 | 5.216 | [physics-mechanical.log](physics-mechanical.log) |

## 工厂覆盖

| 注册伙伴 | 物理 | 其他通过的内部检查 |
| --- | --- | --- |
| octomochi 八爪鱼 | 软体通过；机械单独补跑通过 | stage/parameters/views/accessories/materials；注册组合工厂 switching、materials 专门结构切换 |
| cuttlemochi 墨鱼 | 通过 | stage/parameters/views/accessories/materials |
| squidmochi 鱿鱼 | 通过 | stage/parameters/views/accessories/materials |
| goldmochi 金鱼 | **侧鳍拾取断言失败**，之前身体流程执行通过；后续鳍拖动/恢复和销毁被跳过 | stage/parameters/views/heading/accessories/materials |
| whalemochi 鲸鱼 | 过滤工厂单独补跑通过 | stage/parameters/views/heading/accessories/materials/smiles/switching |
| sharkmochi 鲨鱼 | 过滤工厂单独补跑通过 | stage/parameters/views/heading/accessories/materials/smiles |
| sealmochi 海豹 | coastal 通过 | views；coastal 含专属动作/材质/饰品/约束/转向，但详尽度有缺口 |
| turtlemochi 海龟 | coastal 通过 | views；coastal 含专属动作/材质/饰品/约束/转向，但详尽度有缺口 |
| crabmochi 螃蟹 | coastal 通过 | views；coastal 含专属动作/材质/饰品/约束/转向，但详尽度有缺口 |

## 失败定位

1. `scripts/test-cephalopods.ts:89:12`：`side fin must be independently pickable`，actual null。前两工厂墨鱼/鱿鱼打印通过，失败工厂金鱼。第 88 行从金鱼局部 `(1.23,6,0.44)` 转世界后向下投射未命中；`test-heading.ts` 的金鱼侧鳍样例 `(1.23,6,-0.03)` 本轮通过。只能确定这条测试失败，尚不能据此区分真实拾取缺陷与过时测试坐标。
2. `npm run lint`：30 条错误。精确位置与规则如下；都是本轮起始源码已存在的文件，验收代理未修改。

- components/ui/button-group.tsx:32:7: error jsx-a11y(prefer-tag-over-role): Prefer `address, details, fieldset, hgroup, optgroup` over `role` attribute `group`
- components/ui/input-group.tsx:15:7: error jsx-a11y(prefer-tag-over-role): Prefer `address, details, fieldset, hgroup, optgroup` over `role` attribute `group`
- components/ui/input-group.tsx:52:5: error jsx-a11y(click-events-have-key-events): Enforce a clickable non-interactive element has at least one keyboard event listener
- components/ui/input-group.tsx:52:6: error jsx-a11y(no-noninteractive-element-interactions): Non-interactive elements should not be assigned mouse or keyboard event listeners
- components/ui/input-group.tsx:53:7: error jsx-a11y(prefer-tag-over-role): Prefer `address, details, fieldset, hgroup, optgroup` over `role` attribute `group`
- components/ui/pagination.tsx:58:9: error jsx-a11y(anchor-has-content): Missing accessible content when using `a` elements
- components/ui/input-otp.tsx:78:7: error jsx-a11y(prefer-tag-over-role): Prefer `hr` over `role` attribute `separator`
- components/ui/spinner.tsx:8:7: error jsx-a11y(prefer-tag-over-role): Prefer `output` over `role` attribute `status`
- components/ui/label.tsx:9:5: error jsx-a11y(label-has-associated-control): A form label must be associated with a control
- components/ui/breadcrumb.tsx:66:7: error jsx-a11y(prefer-tag-over-role): Prefer `a, area` over `role` attribute `link`
- hooks/use-mobile.ts:16:5: error react(react-compiler): EffectSetState: Calling setState synchronously within an effect can trigger cascading renders help: Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)
- components/ui/field.tsx:79:7: error jsx-a11y(prefer-tag-over-role): Prefer `address, details, fieldset, hgroup, optgroup` over `role` attribute `group`
- components/ui/carousel.tsx:98:5: error react(react-compiler): EffectSetState: Calling setState synchronously within an effect can trigger cascading renders help: Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)
- components/ui/carousel.tsx:124:9: error jsx-a11y(prefer-tag-over-role): Prefer `section` over `role` attribute `region`
- components/ui/carousel.tsx:161:7: error jsx-a11y(prefer-tag-over-role): Prefer `address, details, fieldset, hgroup, optgroup` over `role` attribute `group`
- src/core/PlaygroundPage.tsx:55:5: error react(react-compiler): EffectSetState: Calling setState synchronously within an effect can trigger cascading renders help: Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)
- src/core/PlaygroundPage.tsx:68:5: error react(react-compiler): EffectSetState: Calling setState synchronously within an effect can trigger cascading renders help: Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)
- src/core/PlaygroundPage.tsx:92:9: error next(no-html-link-for-pages): Do not use `<a>` elements to navigate between Next.js pages
- src/core/PlaygroundPage.tsx:98:64: error jsx-a11y(prefer-tag-over-role): Prefer `output` over `role` attribute `status`
- src/core/PlaygroundPage.tsx:116:74: error jsx-a11y(label-has-associated-control): A form label must be associated with a control
- src/core/PlaygroundPage.tsx:117:74: error jsx-a11y(label-has-associated-control): A form label must be associated with a control
- app/pals/page.tsx:9:9: error next(no-html-link-for-pages): Do not use `<a>` elements to navigate between Next.js pages
- app/pals/page.tsx:10:9: error next(no-html-link-for-pages): Do not use `<a>` elements to navigate between Next.js pages
- app/page.tsx:7:9: error next(no-html-link-for-pages): Do not use `<a>` elements to navigate between Next.js pages
- app/page.tsx:8:9: error next(no-html-link-for-pages): Do not use `<a>` elements to navigate between Next.js pages
- app/page.tsx:17:11: error next(no-html-link-for-pages): Do not use `<a>` elements to navigate between Next.js pages
- components/ui/item.tsx:12:7: error jsx-a11y(prefer-tag-over-role): Prefer `menu, ol, ul` over `role` attribute `list`
- components/ui/chart.tsx:155:20: error typescript(restrict-template-expressions): Invalid type used in template literal expression.
- components/ui/chart.tsx:203:28: error typescript(restrict-template-expressions): Invalid type used in template literal expression.
- components/ui/chart.tsx:302:26: error typescript(restrict-template-expressions): Invalid type used in template literal expression.

## 覆盖限制

见 [coverage.md](coverage.md)。全部 Node 检查均不创建浏览器 Renderer，不能证明真实形态、WebGPU 编译/渲染、真实输入/触屏/键盘、九伙伴逐视角动态状态、图鉴封面与缩略图一致性。最终体验结论须由主任务补充真实运行证据。

构建非阻断提示：部分 chunk 大于 500 kB；Vinext 部分路由静态分类 Unknown。

## 恢复原始源码后的最终复查

| 命令 | 结果 | 秒 | 日志 |
| --- | --- | ---: | --- |
| `npm run typecheck` | 通过 | 2.327 | [final-typecheck.log](final-typecheck.log) |
| `npm run build` | 通过 | 7.244 | [final-build.log](final-build.log) |
