# 全伙伴修复与复验 · 2026-09-09

> 后续决定：用户已明确停止剩余验收，并授权提交全部修改。下列未验证项保留原状态，不视为通过。

本轮已从只列问题改为「发现 → 修改 → 内置浏览器同条件复查」。下列已发现的形态、交互和兼容性缺陷已完成修复。9个伙伴、正面及两侧共27个视角都有实际WebGPU观察记录；新增转向另从正常页面用真实指针验证，调试切角不再被当成拖动转向的证据。

**严格总验收仍未全部完成**：真机触摸、持续按住/中途取消的逐视角连续视觉证据仍缺少，不能把已修复和已测项扩大为全部成功标准通过。验收阶段没有发布或提交；后续按用户授权提交。

## 修复与同条件复验

| 伙伴 | 差异与修复 | 本轮实际复验结果及证据 |
| --- | --- | --- |
| 八爪鱼 | 原来只有视角接口，无正常横拖转向；补主体横拖连续转向，软胶/机械状态同步。 | 正常无audit页面左右横拖已见侧面；竖拖不误转，手机布局可转。[向右](fixes/octomochi-gesture-right.png)、[向左](fixes/octomochi-gesture-left.png)、[最终无调试](fixes/final-normal-octopus-turn.png)。 |
| 墨鱼 | 补主体转向；修复移动/转向后旧包围盒造成附肢拾取落空。 | 正常横拖左右可转，果冻+眼镜跟随。独立评审指定、主代理执行的横转→侧向竖拉→释放恢复成立。[黑盒复核](fixes/independent-cephalopod-gesture-review.md)。 |
| 鱿鱼 | 补主体转向并排除拉鳍/拉腕；修复帽檐穿鳍，以及材质/视角切换后单帧腮红离体。五官实际顶点和身体使用同一变形。 | 正面/双侧、手机横拖通过；三材质帽子12帧复查、原腮红触发序列重复3轮共12帧未再现。[帽子](fixes/squidmochi-hat-v2-机械-drag.png)、[五官](fixes/squidmochi-face-final-2-2.png)。 |
| 金鱼 | 补成对腹鳍及双尾品系的成对臀鳍；校准失效的旧侧鳍测试射线。 | 默认正面/双侧、独立鳍抓取、三材质、拖动/回弹均补查。[正面](fixes/goldmochi-front.png)、[侧A](fixes/goldmochi-side-a.png)、[侧B](fixes/goldmochi-side-b.png)。 |
| 鲸鱼 | 修帽子露蓝色头部、耳机头带穿帽；眼面与皮肤同步变形；侧颊眼睛略前移、嘴线与蓝白边界错开以改善实际小头像。 | 三视角形态复查，三材质27帧戳动无旧浮眼；最终戴/不戴帽组合19帧无头带穿出且无帽时可见。[侧面](fixes/whalemochi-face-v3-side-a.png)、[最终组合](fixes/whalemochi-headphones-final-poke.png)、[独立复核](fixes/independent-whale-avatar-review.md)。 |
| 鲨鱼 | 初次仅补鳍数量仍不合格。按用户红框反馈把厚叶片胸/腹鳍改为薄、宽根后掠鳍，缩小臀鳍、留出尾柄间隔；每侧5鳃裂。 | 默认三视角、三材质及戳动复查；浏览器新腹鳍/臀鳍分别命中fin-8/fin-9。[正面](fixes/sharkmochi-front-v2.png)、[侧A](fixes/sharkmochi-side-a-v2.png)、[侧B](fixes/sharkmochi-side-b-v2.png)、[独立形态复核](fixes/independent-shark-v2-review.md)。 |
| 海豹 | 嘴线拟合皮肤，消除被误认作悬空嘴的下垂长胡须；改短细扇形胡须、各自扎入吻垫。 | 修后正面/双侧及身体、前后鳍拖动、戳动、三材质复查。[正面](fixes/sealmochi-front.png)、[侧A](fixes/sealmochi-side-a.png)、[侧B](fixes/sealmochi-side-b.png)。 |
| 海龟 | 本轮未发现需要改动的模型形态；更新与实际模型一致的头像和封面。 | 复用本轮已完成的三视角/拖动/缩头观察，补最终桌面/手机头像。[正面](turtlemochi-front.png)、[侧A](turtlemochi-side-a.png)、[侧B](turtlemochi-side-b.png)。 |
| 螃蟹 | 重做双钳：掌部缩小，螯指宽根收尖、相向夹合并留明确夹口。描述同步为“张开的小钳子”。 | 正面/双侧均可读出钳子；举钳和独立抓钳未变回圆球。正面抓点按新几何重新定位，确认claw-1命中。[正面](fixes/crabmochi-front-v1.png)、[侧A](fixes/crabmochi-side-a-v1.png)、[侧B](fixes/crabmochi-side-b-v1.png)。 |

形态依据为[可信机构与论文资料](anatomy-sources.md)，不能把物种器官数量当成位置/比例/轮廓通过。鲨鱼追加在内置浏览器实际查看[Florida Museum带标注照片](fixes/shark-anatomy-reference-iab.png)，并据此纠正“后腹像一排脚”。其余资料的照片访问限制仍按原资料记录，不声称所有伙伴都有完整实拍三视图。

## 头像、封面与交互

九张正面头像均直接由最终默认模型的内置WebGPU画布导出，统一留白、保持比例，取消scale(1.35)硬裁切。封面也与最终模型一致，移除导出底色和旧照片校色造成的色块：[图鉴最终全页](fixes/catalogue-final-full.png)、[背景衔接复查](fixes/catalogue-final-background.png)。

实际48px头像、64px按钮逐个检查；桌面1440×1000、手机390px和窄屏320px均逐项选择，已覆盖选中/未选中、首中末焦点及列表滚动到达。手机选择后当前项完整可见，document.scrollWidth等于视口宽度。焦点底部与横滚条重叠首次修复不足，增大底留白后复查关闭。[选择与边界数据](fixes/avatar-checks.json)、[末项焦点v2](fixes/avatar-390-last-focus-v2.png)、[头像独立结论](fixes/independent-whale-avatar-review.md)。

手机补验时视口控制工具没有改变原标签页尺寸，因此采用内置浏览器内明确390/320px宽iframe作为真实CSS布局视口；截图灰色区域是测试外框，不属于产品。这不是手机硬件或触摸测试。初轮原生390×844/320×740截图保留，不能和iframe阶段混写。

初轮九伙伴三材质、调色、软硬/阻尼、重置、快速切换、108种合法饰品选择状态的记录仍可复用；受模型或饰品修改影响的路径另在fixes补查，没有宣称全部状态的笛卡尔积均已穷举。基础形态先在无饰品默认材质下判断。

## 对应检查

- 最终移除临时代码后：[typecheck通过](fixes/final-typecheck.log)、[build通过](fixes/final-build.log)、[本轮TS文件定向lint通过](fixes/final-targeted-lint.log)、[test:faces通过](fixes/final-faces.log)。
- 修复中完整test:heading、test:views、test:accessories、test:coastal均通过；新增断言覆盖真实抓取反例、舞台投影边界、鳍独立形变和五官接触。金鱼5710帧、鲨鱼5080帧、鱿鱼2770帧相关物理回归通过。执行结果来自本任务工具记录；没有将CPU检查当成WebGPU验收。
- [全仓lint仍失败](fixes/final-lint.log)，现有未改动页面/通用组件有既有无障碍、React/链接等错误；未为刷绿改无关功能。
- 最终新开的内置浏览器页面逐个切换9只，canvas均为WebGPU，选择对应，错误日志为空：[最终运行记录](fixes/final-browser.json)。编辑过程旧标签页曾记录中间态HMR解析错误，已修正；没有清空旧日志后声称从未发生。

## 未验证与退出边界

1. 真机触摸点选、滑动、取消与画布外滚动未实测，头像A8的真机部分仍未验证。
2. 工具只有完整单段drag，没有分离pointerdown/move/up能力。持续按压、手势保持返回起点、取消/失焦的逐视角连续WebGPU画面尚未完整获得；Node持续交互测试只作补充，不能替代这些实际输入证据。
3. 独立评审已做逐项截图复核，并独立指定一条由主代理按真实入口执行的黑盒路径。评审未亲自控制浏览器。该路径里的触腕命中未被可靠确认，保留未验证，不以画面未转向反推抓取成功。

因此已修复项与已测项可关闭，但仍不应声称9个伙伴满足全部新增伙伴成功标准。没有以迭代次数、构建通过或用户不再指出问题作为整体通过依据。

## 证据版本与清理

- 起始HEAD为ac441c4d3107c2122ffaf02bbc7dc9ab0da8c9f9；macOS、Node22.17.0、npm11.10.1，产品浏览器操作只使用Codex内置浏览器。
- [首轮历史报告](INITIAL-REPORT.md)保留原发现，但不代表当前代码。根目录螃蟹和海豹的6张静态图曾在复拍时覆盖为修复版，不能再当旧形态证据；旧动态图仍保留。新的判定均显式引用fixes及版本号。
- 临时7/8/9切角、0导出、拾取记录已从src移除；手机临时页面已从public移除。复现用副本留在[取证补丁](fixes/audit-instrumentation.patch)与[视口测试页](fixes/acceptance-viewport.html)。它们不是产品功能。
- 保留其他任务对PRODUCT头像标准、参考图删除及头像专项报告的修改；未回退，全部纳入后续授权提交。
