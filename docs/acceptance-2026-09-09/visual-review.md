# 2026-09-09 独立截图复核

这是独立静态截图复核，不是子代理执行真实黑盒操作。子代理的 iab surface 不可用；截图由主代理生成。截至追加复核，实际看了252张不同原图：27基线、54动作单帧、36材质/饰品、18手机390基线/拖动后单帧、108原始软胶合法饰品组合、9张手机320基线。

原图目录：`/Users/farghost/GithubProjects/squishy-pals/docs/acceptance-2026-09-09`。

复核方法：按伙伴制作3×3接触表，行依次front/side-a/side-b、列依次基线/drag-release/poke，逐格看全部81张；另对眼口、裙鳍、腕根及螯口疑点从对应原图裁切并放大2倍。36饰品图按伙伴四配置逐格看；18手机图以完整页面图并排看。接触表与放大副本仅在`/tmp/squishy-review-sheets`，原图未改动。135张原图的已查看版本摘要在文末，用于区别未来修复后的覆盖版本。

## 结论

1. **明确失败：海豹两侧笑嘴悬空。** `sealmochi-side-a.png`、`sealmochi-side-b.png`及对应`-poke.png`放大都有下方黑弧线与身体/吻垫之间的背景间隙。主代理已结合源码确认是笑嘴未贴曲面。正面不足以发现这一失败。
2. **形态待裁定：螃蟹螯口。** 放大前视和侧视可见球形掌上两枚圆凸块，只有浅V缺口；整体仍能辨识为蟹，但夹持钳结构偏弱。不是网格裂口，不在此擅自宣布物种结构通过或失败。
3. **鲸鱼眼镜结论经单配对照收窄：** 追加的none-00/01/10/11放大显示，戴眼镜后双侧黑眼仍可见，镜架横杆经过眼睛中段；耳罩位于眼睛上方。旧版“几乎遮没眼睛”的观察过强，不能据此认定完全挡眼失败。另发现hat-00帽冠下缘与帽檐之间露出蓝色头部弧段，列帽子贴合/穿插疑点，待主代理确认。
4. 其他已看截图未发现明确大面积网格裂口、眼口整块脱落、饰品整体漂浮。金鱼两侧眼睛曝光明显不对称（A仅边缘单眼，B双眼），属于已知面部偏转造型的视觉结果，未见眼睛完全脱离。
5. **手机18帧取景通过局部截图检查：** 9只默认及拖动后帧中角色完整可见，没有屏幕左右或上下裁切。主要设置位于首屏以下；本次无法从静态图证明滚动、触屏抓取/取消或完整操作路径。

## 27个伙伴×视角逐项记录

每行实际查看了三张原图：`<行名>.png`、`<行名>-drag-release.png`、`<行名>-poke.png`。以下“未见”只约束这些截图，不代表完整动态/全验收通过。

|行名|独立观察|
|---|---|
|octomochi-front|球形头部与腕根连续；吸盘在边缘可见。动作帧脸部跟随，未见裂口。|
|octomochi-side-a|近侧脸在轮廓边缘；腕根/头部连续，动作帧未见脱离。|
|octomochi-side-b|与A侧独立查看：脸在反侧轮廓，腕布局不同；未见明显破裂。|
|cuttlemochi-front|8短腕及两条较长外伸触腕可辨，裙鳍与头体连接；动作帧未见裂口。|
|cuttlemochi-side-a|长椭圆外套膜+环绕裙鳍；腕根呈宽扇面，眼/口集中前端；未见背景贯穿裂口。|
|cuttlemochi-side-b|反侧亦保持外套膜/裙鳍/腕连接；头与外套膜未明显分开，物种结构仍须参考裁定。|
|squidmochi-front|尖外套膜、双三角鳍、长短腕可辨；动作帧保持连接。|
|squidmochi-side-a|鳍在侧向呈叶状嵌入轮廓，放大未见背景贯穿；腕冠与外套膜连接。|
|squidmochi-side-b|与A独立看：反侧鳍/腕冠连续；长腕俱乐部状末端可见。|
|goldmochi-front|球形身体、胸鳍、背/尾后缘可辨；drag-release有转向，眼/口仍贴身。|
|goldmochi-side-a|单眼仅在前端轮廓露出；尾/背/胸鳍完整；未见眼完全离体。|
|goldmochi-side-b|可同时露出两只前置眼，与A明显不对称；独立放大无明确间隙，列造型疑点。|
|whalemochi-front|宽头/白腹/双侧眼/胸鳍可见；口线贴在分色边界，未见悬空。|
|whalemochi-side-a|侧向头身/尾柄连续、水平尾叶/胸鳍完整；动作帧没有明显裂口。|
|whalemochi-side-b|反側同样连续；尾叶关系保持，未见眼/口明显脱离。|
|sharkmochi-front|吻部/背鳍/双胸鳍完整，动作帧嘴线仍贴肤；正面辨识成立。|
|sharkmochi-side-a|尖吻、背鳍、垂直尾与3鳃裂可见；无下部腹鳍/臀鳍的省略仍待形态裁定。|
|sharkmochi-side-b|反侧亦能看到3鳃裂，眼/嘴/胸鳍连接；动作帧未见明显裂口。|
|sealmochi-front|圆头、吻垫、胡须、前鳍可辨；正面难看出下侧笑线问题。|
|sealmochi-side-a|失败：基线与poke放大均有下方黑弧线悬离脸缘，背景间隙清楚；主代理确认是笑嘴未贴曲面。|
|sealmochi-side-b|失败：反侧基线与poke同样看到笑嘴悬空；不能把它当作自由伸出的正常胡须。|
|turtlemochi-front|头/壳/前鳍关系清楚；poke头部后缩，眼/嘴仍附着。|
|turtlemochi-side-a|侧向壳/腹甲/两鳍/尾完整；poke头缩到壳旁但截图未见明显裂口或头眼脱离。|
|turtlemochi-side-b|独立查看反侧：头/壳/尾与鳍连接完整；单帧不能证明缩头全过程无穿插。|
|crabmochi-front|扁宽甲壳、眼柄、步足与双螯辨识为蟹；双螯近似球掌+双圆凸块，仅浅V口，钳结构辨识偏弱。|
|crabmochi-side-a|近侧四步足轮廓可辨；螯/眼柄在投影中重叠，未见背景贯穿或连接断开；钳口仍弱。|
|crabmochi-side-b|反侧步足/螯完整；动作帧举钳仍连身，双凸块式钳子在侧面近似拳头。|

## 36张材质与饰品截图

每只实际看四张：`<id>-original-accessories.png`、`<id>-jelly-accessories.png`、`<id>-mechanical-accessories.png`、`<id>-mechanical-bow.png`。前三种为耳机+眼镜+帽子组合，第四为耳机+眼镜+蝴蝶结；只覆盖这些配置及该正面截图。

|伙伴|四配置观察|
|---|---|
|octomochi|三材质区别可见；镜圈围眼、耳机沿头顶、帽子/蝴蝶结在头顶；机械腕形态独立变化。未见明确整体悬空。|
|cuttlemochi|镜圈对应双眼，裙鳍/腕仍可辨；机械线条是表面分段，不当成网格裂口。|
|squidmochi|镜框在下部双眼前，帽子遮住尖端部分但三角鳍仍可见；无明确眼睛整块消失。|
|goldmochi|镜圈/眼睛关系可辨，头戴物与后方背/尾轮廓有遮挡但单帧无确证穿模；果冻可见高光变化。|
|whalemochi|挡眼疑点：正面只有侧面镜圈与贯脸镜架，双侧黑眼几乎不可见。已补看original原图。|
|sharkmochi|侧置镜圈与贯脸镜架占据眼睛附近，但仍能见黑眼边缘；帽子与背鳍投影叠合，不能凭前视断言穿模。已补看original原图。|
|sealmochi|正面眼睛在镜圈内、吻垫可辨；侧面笑嘴问题未因饰品覆盖而关闭。|
|turtlemochi|镜圈围眼，耳机/帽子或蝴蝶结均位于头部；壳纹/四肢保留，未见明确漂浮。|
|crabmochi|镜圈罩住眼柄顶部，头戴物在眼柄后方；帽子配置有遮挡但黑眼可辨。mechanical-bow原图仍能看清双眼。|

## 18张手机截图

每只实际看`<id>-mobile-390.png`与`<id>-mobile-drag.png`；均为390×844。九只逐项结论如下：

|伙伴|基线|drag单帧|
|---|---|---|
|octomochi|头/全部可见轮廓在画布内|移位后无边缘裁切|
|cuttlemochi|两长触腕及裙鳍完整可见|移位后仍完整|
|squidmochi|尖端和长腕末端完整|上移后尖端/长腕仍完整|
|goldmochi|背部高鳍和侧鳍完整|转向/上移后完整|
|whalemochi|头/胸鳍完整|转向后尾叶露出，未被屏幕裁切|
|sharkmochi|背鳍和胸鳍完整|转向后尾鳍仍在屏内|
|sealmochi|小体量角色在画布中心，未裁切|侧转后的躯干/后鳍完整|
|turtlemochi|头、壳、前鳍完整|转向后头/壳/鳍完整|
|crabmochi|横向双螯/步足完整|侧转/上移后双螯/步足完整|

## 放大查看记录

从原图追加裁切/2倍显示：`crabmochi-front`、`crabmochi-side-a`、`sealmochi-side-a`、`sealmochi-side-a-poke`、`sealmochi-side-b`、`sealmochi-side-b-poke`、`goldmochi-side-a`、`goldmochi-side-b`、`cuttlemochi-side-a`、`squidmochi-side-a`、`turtlemochi-side-a-poke`、`octomochi-front`、`whalemochi-front`。此外完整单独查看`sealmochi-front.png`、`whalemochi-original-accessories.png`、`sharkmochi-original-accessories.png`、`crabmochi-mechanical-bow.png`。

## 证据边界

- 一张drag-release帧不能证明抓取期间无网格破裂，也不能证明释放后最终恢复；一张poke帧不能证明全过程无短暂/持续穿插。
- 未从文件名推断真实指针事件已成功执行；真实操作证据由主代理另外提供。
- 静态视图中的投影遮挡不等于三维穿模。无明确背景间隙或关系破坏时仅列疑点。
- 仅截图复核不能代替真实动物参考逐视角对照；螯结构、金鱼面部、鲨鱼3鳃裂等由主验收按形态标准裁定。
- 36张饰品图不覆盖所有允许组合、所有视角、所有颜色、所有拖动状态；手机图不证明触屏语义或下方控件可滚动操作。

## 实际查看原图版本

SHA-256前16位（用于复核版本，非通过判据）：

- `octomochi-front.png` — `9e150e3deff5dafc`
- `octomochi-front-drag-release.png` — `3e635e3386d72d29`
- `octomochi-front-poke.png` — `9db18f4f08ebbd34`
- `octomochi-side-a.png` — `0459b9d518097144`
- `octomochi-side-a-drag-release.png` — `880c004fe0844dcd`
- `octomochi-side-a-poke.png` — `cc2e7ee152b975f2`
- `octomochi-side-b.png` — `04d15c5df0c6c115`
- `octomochi-side-b-drag-release.png` — `9a88c8b48829b9de`
- `octomochi-side-b-poke.png` — `f5ac915d081c564a`
- `octomochi-original-accessories.png` — `bdcfa6000e89f27f`
- `octomochi-jelly-accessories.png` — `8906b600693b9718`
- `octomochi-mechanical-accessories.png` — `99fb1281eac564b4`
- `octomochi-mechanical-bow.png` — `a1c3e01c2df0fb9b`
- `octomochi-mobile-390.png` — `d5c379efb428a68e`
- `octomochi-mobile-drag.png` — `ea8a6262c064579a`
- `cuttlemochi-front.png` — `5a8c83cb55e8525c`
- `cuttlemochi-front-drag-release.png` — `9046e9cb00072bc8`
- `cuttlemochi-front-poke.png` — `794b47a01afab42b`
- `cuttlemochi-side-a.png` — `cd5d9a5e0becb0c4`
- `cuttlemochi-side-a-drag-release.png` — `8c3c0acd41d5cfa0`
- `cuttlemochi-side-a-poke.png` — `a07d78ac3066e36d`
- `cuttlemochi-side-b.png` — `53d8861b8ca02c34`
- `cuttlemochi-side-b-drag-release.png` — `87f413edcca20b0e`
- `cuttlemochi-side-b-poke.png` — `511525961702f23c`
- `cuttlemochi-original-accessories.png` — `2d4cccb2b10da362`
- `cuttlemochi-jelly-accessories.png` — `23a3564040f56e98`
- `cuttlemochi-mechanical-accessories.png` — `f490a057856bbed9`
- `cuttlemochi-mechanical-bow.png` — `611104bf7affff9e`
- `cuttlemochi-mobile-390.png` — `cf0669c18f3e222b`
- `cuttlemochi-mobile-drag.png` — `b3a59cc94aaeec1c`
- `squidmochi-front.png` — `ed462e34a921aeef`
- `squidmochi-front-drag-release.png` — `8c0fc83ce586a9b0`
- `squidmochi-front-poke.png` — `cc902afb9993c8db`
- `squidmochi-side-a.png` — `f196688ddf22e126`
- `squidmochi-side-a-drag-release.png` — `8b687856f4a6e245`
- `squidmochi-side-a-poke.png` — `b559d45e1ffdb6ff`
- `squidmochi-side-b.png` — `c61f9e3935412eb5`
- `squidmochi-side-b-drag-release.png` — `d52da3b15dac6cc7`
- `squidmochi-side-b-poke.png` — `039fbe7ea2b77746`
- `squidmochi-original-accessories.png` — `722e573391a0ad3f`
- `squidmochi-jelly-accessories.png` — `0d43c2e73be63405`
- `squidmochi-mechanical-accessories.png` — `16b2b88050fcc356`
- `squidmochi-mechanical-bow.png` — `626ea30ea9f41b21`
- `squidmochi-mobile-390.png` — `6e0098108073225b`
- `squidmochi-mobile-drag.png` — `342e291c202b2d7f`
- `goldmochi-front.png` — `8dc3a75b7442e849`
- `goldmochi-front-drag-release.png` — `d151d29d84138622`
- `goldmochi-front-poke.png` — `0e90b7c39d445d5b`
- `goldmochi-side-a.png` — `f9047c08dc90e504`
- `goldmochi-side-a-drag-release.png` — `a4e91c0e03857aec`
- `goldmochi-side-a-poke.png` — `7c097138df636b24`
- `goldmochi-side-b.png` — `833af8c5f84bfc9e`
- `goldmochi-side-b-drag-release.png` — `ecde33ad8147114a`
- `goldmochi-side-b-poke.png` — `05a2c97a4c5c7c5f`
- `goldmochi-original-accessories.png` — `26ad2db95190c6f5`
- `goldmochi-jelly-accessories.png` — `47f1e47e4305774c`
- `goldmochi-mechanical-accessories.png` — `abafb1d32af7601c`
- `goldmochi-mechanical-bow.png` — `d6223dd12b36a4d8`
- `goldmochi-mobile-390.png` — `d0d13a00b61cbb4d`
- `goldmochi-mobile-drag.png` — `3cce3b1f6a5d694e`
- `whalemochi-front.png` — `0d222202a46cd103`
- `whalemochi-front-drag-release.png` — `a50b7ec970f403bb`
- `whalemochi-front-poke.png` — `b43457fd681c718e`
- `whalemochi-side-a.png` — `c69cb8c7081a38bd`
- `whalemochi-side-a-drag-release.png` — `a2973bba4a24ed84`
- `whalemochi-side-a-poke.png` — `591f9cce52205d46`
- `whalemochi-side-b.png` — `761387ad14628ad6`
- `whalemochi-side-b-drag-release.png` — `77620285710bae27`
- `whalemochi-side-b-poke.png` — `1ae6a6194910bb8e`
- `whalemochi-original-accessories.png` — `1392433490bac34f`
- `whalemochi-jelly-accessories.png` — `4185927367632247`
- `whalemochi-mechanical-accessories.png` — `b65a5a939e31b8e2`
- `whalemochi-mechanical-bow.png` — `afa8099cb0696d69`
- `whalemochi-mobile-390.png` — `a0092bbda9bd11d6`
- `whalemochi-mobile-drag.png` — `66e34d342b627e13`
- `sharkmochi-front.png` — `8995f02995e20ccb`
- `sharkmochi-front-drag-release.png` — `eb03d0a9cf18bee0`
- `sharkmochi-front-poke.png` — `288277318a77acca`
- `sharkmochi-side-a.png` — `52135e7dcbe0890b`
- `sharkmochi-side-a-drag-release.png` — `dc04f4ab3f256eaf`
- `sharkmochi-side-a-poke.png` — `037c1088f93d77cf`
- `sharkmochi-side-b.png` — `b77f0849884977e8`
- `sharkmochi-side-b-drag-release.png` — `eba2f49fbf4af182`
- `sharkmochi-side-b-poke.png` — `2d7445d8a770b15f`
- `sharkmochi-original-accessories.png` — `dc2e76b4f0e1a5e7`
- `sharkmochi-jelly-accessories.png` — `c0d1d9ee637acfa6`
- `sharkmochi-mechanical-accessories.png` — `887d803d4bfb57c9`
- `sharkmochi-mechanical-bow.png` — `4ada5bfcb4e6f462`
- `sharkmochi-mobile-390.png` — `e1040d8284742c62`
- `sharkmochi-mobile-drag.png` — `4676ecb75445f9bf`
- `sealmochi-front.png` — `f75dfbab5d39254e`
- `sealmochi-front-drag-release.png` — `12d162d850893b89`
- `sealmochi-front-poke.png` — `0c53b1cb53d061c6`
- `sealmochi-side-a.png` — `1227d5c20a340b61`
- `sealmochi-side-a-drag-release.png` — `c293043322294502`
- `sealmochi-side-a-poke.png` — `6c0fe3161df15e2a`
- `sealmochi-side-b.png` — `ebe9a8fb7ef8dbfd`
- `sealmochi-side-b-drag-release.png` — `fe179b429ce9922d`
- `sealmochi-side-b-poke.png` — `0cff86a7d35ab147`
- `sealmochi-original-accessories.png` — `3d7c8d59096cfdef`
- `sealmochi-jelly-accessories.png` — `25c02e68d437eb38`
- `sealmochi-mechanical-accessories.png` — `957ebaff19a869bd`
- `sealmochi-mechanical-bow.png` — `54e3b41cab00cc5a`
- `sealmochi-mobile-390.png` — `b4a18eec9b7841a3`
- `sealmochi-mobile-drag.png` — `0df8a103aea4b4ab`
- `turtlemochi-front.png` — `42072769daa1309f`
- `turtlemochi-front-drag-release.png` — `1f4a5fcd943997c9`
- `turtlemochi-front-poke.png` — `b879fd97cfca96c0`
- `turtlemochi-side-a.png` — `868293bb417633e2`
- `turtlemochi-side-a-drag-release.png` — `36a4711a796da924`
- `turtlemochi-side-a-poke.png` — `41761b42e1a7587b`
- `turtlemochi-side-b.png` — `4b09286b43f3af19`
- `turtlemochi-side-b-drag-release.png` — `898c046c497fe907`
- `turtlemochi-side-b-poke.png` — `feb22fcff92df182`
- `turtlemochi-original-accessories.png` — `e33c3c59a8d33e02`
- `turtlemochi-jelly-accessories.png` — `aecf9cdb971db55d`
- `turtlemochi-mechanical-accessories.png` — `982fa06ed07c4766`
- `turtlemochi-mechanical-bow.png` — `09fe84e475ef8890`
- `turtlemochi-mobile-390.png` — `56efbf62ac35c30f`
- `turtlemochi-mobile-drag.png` — `ea3b0a38fc99bfe9`
- `crabmochi-front.png` — `ef109127738e4407`
- `crabmochi-front-drag-release.png` — `0731dac73804986b`
- `crabmochi-front-poke.png` — `d1935cad212eafc5`
- `crabmochi-side-a.png` — `6db82f601341e5e4`
- `crabmochi-side-a-drag-release.png` — `2ff384f34adb7eb6`
- `crabmochi-side-a-poke.png` — `854c0c8e19c94420`
- `crabmochi-side-b.png` — `312e51c302f26bed`
- `crabmochi-side-b-drag-release.png` — `d1018be19d047ccc`
- `crabmochi-side-b-poke.png` — `a3956d847497dc7b`
- `crabmochi-original-accessories.png` — `8f3c8a9d4de0fbde`
- `crabmochi-jelly-accessories.png` — `ead8afefd1d5ae2e`
- `crabmochi-mechanical-accessories.png` — `7a56b3787b2feb64`
- `crabmochi-mechanical-bow.png` — `3f54a4c06642ccc3`
- `crabmochi-mobile-390.png` — `045f136bd7363c6f`
- `crabmochi-mobile-drag.png` — `ae64988aac0ac9b5`

## 追加：全部108合法饰品组合的原始软胶截图

追加开始时实际存在：前6只各12张，海豹2张，海龟/螃蟹0张；未把缺图当通过。主代理通知生成结束后，重新获取最后3只全部36张并逐格查看。最终9只各12张全部实际存在且已查看。

命名：`<id>-combo-{none,hat,bow}-{00,01,10,11}.png`。视觉状态中00=不加耳机/眼镜，01=眼镜，10=耳机，11=耳机+眼镜；none/hat/bow为头顶无饰品/帽子/蝴蝶结。逐伙伴采用3行×4列接触表，对照每一个组合；不是只核文件计数。

|伙伴|none×00/01/10/11|hat×00/01/10/11|bow×00/01/10/11|
|---|---|---|---|
|octomochi|四格均查看，双眼及嘴可见，镜框围眼、耳机贴头|四格均查看，帽子不遮五官|四格均查看，蝴蝶结不遮五官|
|cuttlemochi|四格均查看，镜圈在双眼外、耳机位于上方|四格均查看，裙鳍/五官仍辨认|四格均查看，五官及腕冠完整|
|squidmochi|四格均查看，双眼及嘴可见，耳机绕尖端|四格均查看，帽子替代尖端部分轮廓，未见五官消失|四格均查看，尖端蝴蝶结不遮眼|
|goldmochi|四格均查看，镜圈围眼，耳机不遮双眼|四格均查看，帽子与背鳍的前后投影叠合；仅前视不足判穿模|四格均查看，双眼嘴可见|
|whalemochi|四格均查看并放大00/01/10；眼镜横杆经过双眼中段，眼睛并未完全消失；耳机不挡眼|四格均查看，帽冠下缘/帽檐之间露蓝色头部弧段，新增贴合疑点|四格均查看，蝴蝶结靠头顶侧方；镜架遮挡结论同none|
|sharkmochi|四格均查看，侧眼仍可见，镜架横贯脸部|四格均查看，帽子与背鳍投影叠合、五官仍可辨|四格均查看，头顶蝴蝶结不遮眼|
|sealmochi|四格均查看，镜圈围眼、耳机在两側上方|四格均查看，帽子无正面五官遮挡|四格均查看，蝴蝶结无正面五官遮挡；既有侧面笑嘴失败未关闭|
|turtlemochi|四格均查看，眼镜/耳机附在独立头部，嘴可见|四格均查看，帽子在头部上方，双眼可辨|四格均查看，蝴蝶结在前头顶，双眼可辨|
|crabmochi|四格均查看，镜圈围眼柄顶部，耳机在甲壳后侧|四格均查看，帽檐投影遮住眼柄下段，但双黑眼露在帽两侧，不能说眼睛被完全遮挡|四格均查看，蝴蝶结紧邻右眼后侧但黑眼仍可辨|

鲸鱼的精确对照：`whalemochi-combo-none-00.png`无饰品双侧黑眼清楚；`-none-01.png`单眼镜黑眼仍在镜架内侧可见，棕色横杆横穿其高度；`-none-10.png`单耳机耳罩在眼球上方。由此撤回“耳机/眼镜令眼睛几乎消失”的宽泛判断，保留“镜架改变正面眼睛可读性”的事实；没有设置“戴眼镜后必须像无镜框一样无遮挡”的额外验收条件。

鲸鱼帽子疑点：`whalemochi-combo-hat-00.png`单帽放大可见帽冠与帽檐之间蓝色弧段，颜色/轮廓与鲸鱼头一致；已传给主代理复核。因尚未观察该配置侧面，不把猜测的三维穿模机制当成已证实结论。

## 追加：9张手机320截图

实际原图尺寸逐一核实均为320×740（不是390截图缩放）。`octomochi`、`cuttlemochi`、`squidmochi`、`goldmochi`、`whalemochi`、`sharkmochi`、`sealmochi`、`turtlemochi`、`crabmochi`的`-mobile-320.png`全部存在且逐格查看。9只模型、头部、突出附肢都完整位于画布内，无屏幕边缘裁切；名字完整可读，颜色选择在首屏底部可见。伙伴选择器左右边缘截断非当前项并显示横向滚动位置，当前选中项可见；这是横向列表取景，不能据此推断伙伴模型被裁切。控件滚动/真实触屏操作仍不由静态图证明。

## 追加已查看原图版本摘要

- `octomochi-combo-none-00.png` — `aaa8862919da58cf`
- `octomochi-combo-none-01.png` — `b30cb91b7172c22a`
- `octomochi-combo-none-10.png` — `2e2ba3b27aeff84f`
- `octomochi-combo-none-11.png` — `7f1b0c544bd649e0`
- `octomochi-combo-hat-00.png` — `22a886df2db6d65b`
- `octomochi-combo-hat-01.png` — `b400d1e339bf7022`
- `octomochi-combo-hat-10.png` — `29a35ca05f58298b`
- `octomochi-combo-hat-11.png` — `5c1fabb79f194aca`
- `octomochi-combo-bow-00.png` — `c1b16967bccadf2d`
- `octomochi-combo-bow-01.png` — `0eca0635bf1c906b`
- `octomochi-combo-bow-10.png` — `7a50deff3c38d757`
- `octomochi-combo-bow-11.png` — `a08eab1dae455a60`
- `octomochi-mobile-320.png` — `457ad27444c8a20b`
- `cuttlemochi-combo-none-00.png` — `44348452bcc18aa7`
- `cuttlemochi-combo-none-01.png` — `175f9d5bc8eb6fe2`
- `cuttlemochi-combo-none-10.png` — `b461f7b16640fa17`
- `cuttlemochi-combo-none-11.png` — `6eae3baa80983fa5`
- `cuttlemochi-combo-hat-00.png` — `2b79b836d069e304`
- `cuttlemochi-combo-hat-01.png` — `dca4df3d3276a603`
- `cuttlemochi-combo-hat-10.png` — `0c176dcef49c5df1`
- `cuttlemochi-combo-hat-11.png` — `daec9912d16abe67`
- `cuttlemochi-combo-bow-00.png` — `5066946ef5a21b3e`
- `cuttlemochi-combo-bow-01.png` — `dda6bafced33d760`
- `cuttlemochi-combo-bow-10.png` — `9e9569f564e9ced7`
- `cuttlemochi-combo-bow-11.png` — `3a64d4cb7d7250ea`
- `cuttlemochi-mobile-320.png` — `3868473fcf568715`
- `squidmochi-combo-none-00.png` — `e2460830e53e6a8a`
- `squidmochi-combo-none-01.png` — `28a8af7e3337f60b`
- `squidmochi-combo-none-10.png` — `69373920a0f26d11`
- `squidmochi-combo-none-11.png` — `e079a757e6a3b998`
- `squidmochi-combo-hat-00.png` — `26a3303ba21229bb`
- `squidmochi-combo-hat-01.png` — `b02827001aecf7d3`
- `squidmochi-combo-hat-10.png` — `f477fd3891d5a203`
- `squidmochi-combo-hat-11.png` — `615d98794a3e7706`
- `squidmochi-combo-bow-00.png` — `8715fdaf5e714171`
- `squidmochi-combo-bow-01.png` — `e4732f7891eb1bbc`
- `squidmochi-combo-bow-10.png` — `711fa301ae44476c`
- `squidmochi-combo-bow-11.png` — `a177b299bf12a2b0`
- `squidmochi-mobile-320.png` — `a209a1f0bc475bd1`
- `goldmochi-combo-none-00.png` — `93f64613a6fc4482`
- `goldmochi-combo-none-01.png` — `30914288cbea9df9`
- `goldmochi-combo-none-10.png` — `e635d4b447882daa`
- `goldmochi-combo-none-11.png` — `122ada194dbd8dba`
- `goldmochi-combo-hat-00.png` — `dabd15f8941acf8b`
- `goldmochi-combo-hat-01.png` — `046fe7e0343cf75d`
- `goldmochi-combo-hat-10.png` — `b2ec9202001bdaac`
- `goldmochi-combo-hat-11.png` — `af66e8ea36db0272`
- `goldmochi-combo-bow-00.png` — `60f9d05fc09ce752`
- `goldmochi-combo-bow-01.png` — `2c1741bda0d6e170`
- `goldmochi-combo-bow-10.png` — `f0fe9566954c3654`
- `goldmochi-combo-bow-11.png` — `6480e65db0224c3f`
- `goldmochi-mobile-320.png` — `1021b5e4faf5e19e`
- `whalemochi-combo-none-00.png` — `72a56b5d38e43a6d`
- `whalemochi-combo-none-01.png` — `dbaff602bb41a17d`
- `whalemochi-combo-none-10.png` — `8641e5328a935955`
- `whalemochi-combo-none-11.png` — `c8842e01064b13a8`
- `whalemochi-combo-hat-00.png` — `1e9b53512f39f8ce`
- `whalemochi-combo-hat-01.png` — `564e280db16c68de`
- `whalemochi-combo-hat-10.png` — `fecd39624121b9e9`
- `whalemochi-combo-hat-11.png` — `327bae7bc07b799c`
- `whalemochi-combo-bow-00.png` — `eda752a6fb69b471`
- `whalemochi-combo-bow-01.png` — `05a8cce93fb5c87f`
- `whalemochi-combo-bow-10.png` — `23d1e52d0633e67b`
- `whalemochi-combo-bow-11.png` — `576a03f4c538a706`
- `whalemochi-mobile-320.png` — `293c7e557cd5671d`
- `sharkmochi-combo-none-00.png` — `64e957aacef1fdbb`
- `sharkmochi-combo-none-01.png` — `de267c5fe4ad0317`
- `sharkmochi-combo-none-10.png` — `90adeeb55b56eea4`
- `sharkmochi-combo-none-11.png` — `495e48751f0b04b1`
- `sharkmochi-combo-hat-00.png` — `a8ecfff15223a952`
- `sharkmochi-combo-hat-01.png` — `03bb556118f9d9be`
- `sharkmochi-combo-hat-10.png` — `a8874bdc38737e79`
- `sharkmochi-combo-hat-11.png` — `9d08df81f92dfb8f`
- `sharkmochi-combo-bow-00.png` — `7102d99302f18ee3`
- `sharkmochi-combo-bow-01.png` — `939221345082dd94`
- `sharkmochi-combo-bow-10.png` — `31292717ead1b9da`
- `sharkmochi-combo-bow-11.png` — `62fca7fc99f9ecdd`
- `sharkmochi-mobile-320.png` — `208e3186867ba173`
- `sealmochi-combo-none-00.png` — `0ddb267f82163f93`
- `sealmochi-combo-none-01.png` — `166567ae36bd4ca3`
- `sealmochi-combo-none-10.png` — `97e9ce23bfd250f1`
- `sealmochi-combo-none-11.png` — `a6d79f3641b4005a`
- `sealmochi-combo-hat-00.png` — `448a3db02197a5ec`
- `sealmochi-combo-hat-01.png` — `26cf89683d9039fd`
- `sealmochi-combo-hat-10.png` — `2e4b151eca72833a`
- `sealmochi-combo-hat-11.png` — `f0eb19917492db38`
- `sealmochi-combo-bow-00.png` — `a9ec454116292ce2`
- `sealmochi-combo-bow-01.png` — `6a33c68650877ed2`
- `sealmochi-combo-bow-10.png` — `de1be70cfe3298df`
- `sealmochi-combo-bow-11.png` — `b94265729f7bd609`
- `sealmochi-mobile-320.png` — `823534d3e9d4e096`
- `turtlemochi-combo-none-00.png` — `7f48bc3d6cde577b`
- `turtlemochi-combo-none-01.png` — `375f29309023702b`
- `turtlemochi-combo-none-10.png` — `0e4133e3ba5a070e`
- `turtlemochi-combo-none-11.png` — `0d81fbc3343ae49b`
- `turtlemochi-combo-hat-00.png` — `d9bcad038aac71cc`
- `turtlemochi-combo-hat-01.png` — `51ef7de3c1ec1362`
- `turtlemochi-combo-hat-10.png` — `40b1f29e8f9884d1`
- `turtlemochi-combo-hat-11.png` — `186afcf53d1af24a`
- `turtlemochi-combo-bow-00.png` — `480d2a1ccce0cd35`
- `turtlemochi-combo-bow-01.png` — `3ea6cc295dd35ce2`
- `turtlemochi-combo-bow-10.png` — `e848af6277d8a7b9`
- `turtlemochi-combo-bow-11.png` — `5141f5a07e421e1b`
- `turtlemochi-mobile-320.png` — `b7a3c95f28fc70c3`
- `crabmochi-combo-none-00.png` — `5266630ca9464117`
- `crabmochi-combo-none-01.png` — `59eab2ea60aacc1c`
- `crabmochi-combo-none-10.png` — `445ed657db08bc3d`
- `crabmochi-combo-none-11.png` — `7ca62e6a55617bc7`
- `crabmochi-combo-hat-00.png` — `f34df30b0670b0c0`
- `crabmochi-combo-hat-01.png` — `a53fbb7dd81fd7c8`
- `crabmochi-combo-hat-10.png` — `9862446fb854defd`
- `crabmochi-combo-hat-11.png` — `7b245c6ba6c4203e`
- `crabmochi-combo-bow-00.png` — `aaa2db9cc9f3c568`
- `crabmochi-combo-bow-01.png` — `528dc532ec8164b9`
- `crabmochi-combo-bow-10.png` — `6dc21da1a957ac33`
- `crabmochi-combo-bow-11.png` — `71ee7f00cff15f85`
- `crabmochi-mobile-320.png` — `d426bec11bb6946f`


## 主验收裁定补充

用户本轮明确指出螃蟹钳子太圆、没有钳子感。主验收将其从上述独立复核的形态疑点调整为明确失败：掌部与螯指过于球化，没有清楚的相向螯指及钳口。不能因双螯数量正确、网格完整就通过。鲸鱼帽冠/帽檐接缝露出蓝色头部，经主验收放大原图确认，列为饰品贴合失败。完整最终裁定以 REPORT.md 为准。
