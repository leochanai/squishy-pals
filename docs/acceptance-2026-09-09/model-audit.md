# 2026-09-09 全伙伴重新验收：源码视角与结构证据

范围：只读检查全部 9 个注册伙伴的造型、视角与动态；未修改产品代码。本文件是本轮临时验收材料，不是长期产品契约。

## 结论与必验矩阵

依据 docs/PRODUCT.md「新增伙伴成功标准」第 1、2、4 条，9 只均需要侧面。全部已实现 view:side，六只还会在正常横向拖头时显露侧面。所有角色的静态造型或按附肢编号分相位的动态存在左右不对称，因此本轮完整矩阵是正面、左侧、右侧，共 27 项。

|伙伴|正面 yaw|两侧 yaw|结构源码事实|侧面必须核查|
|---|---|---|---|---|
|八爪鱼 octomochi|0|±π/2|8 腕、一体头身；腕尖均同向卷曲|后侧腕数、吸盘、腕根融合、机械外壳|
|墨鱼 cuttlemochi|0|±π/2|8 短腕＋2 长触腕；两条沿外套膜侧鳍|扁长外套膜、头与腕根关系、裙鳍贴合|
|鱿鱼 squidmochi|0|±π/2|8 短腕＋2 长触腕；2 片上部三角鳍|锥形外套膜、鳍厚度与根部、腕冠|
|金鱼 goldmochi|−0.2|±π/2|2 尾叶＋2 胸鳍＋1 背鳍；无腹鳍/臀鳍模型|双尾连接、五官偏转、下部鳍省略|
|鲸鱼 whalemochi|π/2|0、π|2 胸鳍＋水平双尾叶；无独立背鳍模型|头身比例、尾柄、水平尾叶、笑线|
|鲨鱼 sharkmochi|π/2|0、π|2 胸鳍＋2 背鳍＋垂直双尾叶；每侧 3 鳃裂；无腹鳍/臀鳍模型|尖吻、鳃裂、背鳍/尾叶比例、下部鳍省略|
|海豹 sealmochi|0|±π/2|连续俯卧躯干；2 前鳍＋2 后鳍；成对吻垫/胡须|头颈连续性、后肢、笑嘴贴肤、扑鳍恢复|
|海龟 turtlemochi|0|±π/2|独立头＋壳＋软体；4 鳍＋尾|头壳关系、尾部开口、前后鳍、缩头穿插|
|螃蟹 crabmochi|0|±π/2|8 步足＋2 螯足；双眼柄|步足遮挡/计数、螯指开口、举钳连接|

角度以 object.rotation.y 为准；不要假设所有模型正面均为 0。反侧须通过调试/截图流程设置，本轮不应新增用户视角按钮。

## 精确源码证据

以下路径相对于 /Users/farghost/GithubProjects/squishy-pals。

- scripts/test-views.ts:6–16 列出全部 9 只正面/单侧对应角度；该脚本只有 front→side→front，没有反侧，也不创建浏览器 Renderer。
- src/characters/octopus.ts:27–29：八爪鱼 wrapper 实现 front=0、side=π/2。
- src/characters/cuttlemochi.ts:219、squidmochi.ts:257、goldmochi.ts:242、whalemochi.ts:288、sharkmochi.ts:336、coastalmochi.ts:331：各模型 view 实现。
- src/characters/goldmochi.ts:22：默认 −0.2；whalemochi.ts:20 与 sharkmochi.ts:20：默认 π/2；coastalmochi.ts:26：默认 0。
- 横向拖头转向范围为默认朝向 ±π/2：goldmochi.ts:161、whalemochi.ts:207、sharkmochi.ts:255、coastalmochi.ts:250。
- 八爪鱼 ARM_COUNT=8：octomochi.ts:6；同向 curl 的静态非镜像：octomochi.ts:45–51；动态腕编号相位：octomochi.ts:422。
- 墨鱼成对裙鳍：cuttlemochi.ts:47；10 腕且 arm>=8 为长触腕：cuttlemochi.ts:69–74。
- 鱿鱼三角鳍：squidmochi.ts:54；10 腕且 i>=8 为长触腕：squidmochi.ts:84–93。
- 金鱼全部 5 片鳍：goldmochi.ts:92–96；五官统一偏转 +0.2：goldmochi.ts:99–103，使面部不与本体左右轴镜像。
- 鲸鱼全部 4 个附肢：whalemochi.ts:123–125；双尾在 z 两侧，属于水平尾叶。
- 鲨鱼全部 6 片鳍：sharkmochi.ts:158–162；每侧 3 条鳃裂：sharkmochi.ts:191。
- 海豹 2 前鳍/2 后鳍：coastalmochi.ts:133–137。
- 海龟头、四鳍、尾：coastalmochi.ts:151–157。
- 螃蟹 8 步足：coastalmochi.ts:167–182；2 螯足/双眼柄：coastalmochi.ts:184–188。
- 各模型按 handle 或附肢编号分相位摆动，左右动态不能以镜像替代：cuttlemochi.ts:129、squidmochi.ts:224、goldmochi.ts:130、whalemochi.ts:172、sharkmochi.ts:221、coastalmochi.ts:226。
- 海豹扑鳍、海龟缩头、螃蟹举钳：coastalmochi.ts:229–233；海豹压扁/弹起：coastalmochi.ts:287、299。

## 源码事实与待视觉裁定的界限

确定的结构省略包括：金鱼无腹鳍/臀鳍，鲨鱼无腹鳍/臀鳍且每侧只有 3 条鳃裂，鲸鱼无独立背鳍。不能因代码中的 finCount 断言通过就判生物结构通过。须由主验收结合真实动物参考、用户确认的萌化程度、当前实际渲染裁定是否影响辨识。鲸鱼背鳍尤其取决于参考物种，不宜按泛称强制添加。

未以源码推断网格没有破裂、五官不脱离、释放后视觉结构正确或桌面/手机可操作。上述项目必须由真实 WebGPU 渲染和正常输入的证据关闭。

## 独立黑盒核心旅程复核：未验证（环境阻塞）

主代理要求此子代理在独立内置浏览器 tab，从 http://localhost:5190/pals 进入并验证海豹/海龟/螃蟹交互、重置、切换，不改共享 viewport。

本子代理已读取 browser 技能。主代理已确认首选 browser-client 入口因 runtime 签名损坏失败，并在其主上下文通过 CUA 打开 iab。子代理尝试相同备用调用：

cua.createBrowserTab('iab', 'http://localhost:5190/pals', {visible:true})

结果：Browser is not available: iab。

随后 cua.listBrowsers() 只返回 id=1、name=Chrome、type=extension，没有 iab。子代理未继承主代理的内置浏览器 surface。遵守必须内置浏览器要求，未改用 Chrome，未操作主代理 tab，未改变 viewport，也未伪造截图。因此独立黑盒旅程仍是未验证，不能作为通过证据。主代理可在其可用 iab 环境继续相应正常用户旅程。
