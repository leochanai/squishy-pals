# 修复后独立视觉复核

当前结论：海豹、金鱼、螃蟹和鲸鱼帽子的指定静态修复项通过；鲨鱼静态通过已依据用户最新形态反馈撤销，等待v2三视图复验。60张动态截图中鲸鱼正面poke帧右眼整块离体，该动态项失败，不能整体退出验收。没有用源码数量、测试断言或文件存在代替视觉判断。

方法：独立查看主代理从内置WebGPU浏览器保存的实际截图，按正面、side-a、side-b逐格比较；对海豹嘴/胡须、蟹钳开口、鲸鱼帽子和新增鳍进行原图裁切放大。未修改产品代码或原截图；本记录不是子代理执行真实黑盒操作，也不代替主代理继续进行的拖动、动作与释放恢复复验。

## 逐伙伴、逐视角结论

|对象|正面|side-a|side-b|结论|
|---|---|---|---|---|
|海豹（无版本后缀，为胡须v2）|双眼、吻垫、笑嘴与三条成组胡须清楚；胡须根贴近吻垫，前鳍/头部轮廓保持|放大未见旧版独立悬空黑弧；嘴线与白吻/脸缘连接，胡须没有旧版下垂游离线|反侧同样不再有旧版笑嘴与脸缘背景间隙；鼻、眼、吻垫仍连接|通过：原笑嘴悬空与胡须连接问题在这3帧中关闭|
|金鱼|圆身、双眼、嘴、胸鳍保持；新增下部鳍没有破坏脸与正面轮廓|下部新增小鳍可清楚看到，连接在腹侧/尾前；扇尾、背鳍和胸鳍仍完整|反侧可看到下部鳍，根部未见背景贯穿裂口；双眼曝光与既有偏转一致|通过：新增下部鳍可辨，3视图未见新破裂/脱离|
|鲨鱼|尖吻、背鳍与成对胸鳍保持；嘴线贴肤|明确看到5条鳃裂及胸鳍后方新增下部鳍；鳍根连续、垂直尾轮廓完整|反侧5鳃裂/新增鳍也可辨；未见裂口或嘴线脱离|撤销通过：用户指出后腹鳍像一排脚，原复核只重视数量/连接，位置与比例判断不足；等待v2复验|
|螃蟹（v1）|双钳各有两个收尖的弯曲指端，中间有明确背景开口，已不再是球掌上两枚圆凸块|近侧/远侧钳均能读出开口和指端；连接到掌/腕，未见断裂|反侧同样能读出钳口；眼柄、甲壳和步足保持|通过：钳结构辨识问题在3视图中关闭|
|鲸鱼戴帽（v1）|帽冠下缘、帽带/帽檐间不再露出旧版蓝色头部弧段；帽檐中央贴近头顶，无明显整体悬空|帽冠/帽檐连续，中央与头顶接合；外侧帽檐的正常悬挑不判为整帽漂浮|反侧同样没有蓝弧穿出帽身或整帽背景间隙|通过：旧帽身露头问题在3视图中关闭|

鲸鱼side-b在初始文件清单时短暂缺失；在生成复核接触表前已存在，最终实际查看了三个视角，没有将缺图当通过。

## 最终正面头像

实际逐项查看`public/pals/<id>-front.png`，9张均为512×512。以下是图像本身的裁切/辨识复核，不推断用户界面任意CSS尺寸下都会完整显示。

|头像|观察与结论|
|---|---|
|octomochi-front.png|头和外伸腕轮廓完整，眼口清楚，没有边缘切断；通过|
|cuttlemochi-front.png|裙鳍、短腕及两条较长触腕末端完整；通过|
|squidmochi-front.png|尖端、双鳍、长腕末端完整，能与墨鱼区分；通过|
|goldmochi-front.png|高鳍尖端、侧鳍、下部小鳍及身体完整，底部/侧边未切断；通过|
|whalemochi-front.png|宽头、侧眼、胸鳍和白腹完整，与当前正面模型一致；通过|
|sharkmochi-front.png|高背鳍、尖吻、双胸鳍完整，能与鲸鱼区分；通过|
|sealmochi-front.png|吻垫、胡须、笑嘴和双前鳍完整，使用修复后面部；通过|
|turtlemochi-front.png|壳纹、独立头部、鳍轮廓完整；通过|
|crabmochi-front.png|新开口双钳、眼柄、步足完整，钳尖未被图边裁切；通过|

## 实际查看文件与版本

SHA-256前16位，仅用于区分后续可能覆盖的截图版本：

- `docs/acceptance-2026-09-09/fixes/sealmochi-front.png` — `7119e04e8fd59970`
- `docs/acceptance-2026-09-09/fixes/sealmochi-side-a.png` — `e4d5e2b822fde825`
- `docs/acceptance-2026-09-09/fixes/sealmochi-side-b.png` — `d534c63dd6c81ab9`
- `docs/acceptance-2026-09-09/fixes/goldmochi-front.png` — `31bf432c38410dc6`
- `docs/acceptance-2026-09-09/fixes/goldmochi-side-a.png` — `e530c6028cd12a3e`
- `docs/acceptance-2026-09-09/fixes/goldmochi-side-b.png` — `788bc0a044f7b5cd`
- `docs/acceptance-2026-09-09/fixes/sharkmochi-front.png` — `f17939e0996f9694`
- `docs/acceptance-2026-09-09/fixes/sharkmochi-side-a.png` — `fa2ac568018c811b`
- `docs/acceptance-2026-09-09/fixes/sharkmochi-side-b.png` — `3a4a134d4bbadd5b`
- `docs/acceptance-2026-09-09/fixes/crabmochi-front-v1.png` — `40eca93334b73f14`
- `docs/acceptance-2026-09-09/fixes/crabmochi-side-a-v1.png` — `a442e088da34e652`
- `docs/acceptance-2026-09-09/fixes/crabmochi-side-b-v1.png` — `b3ed3ada62b30c8d`
- `docs/acceptance-2026-09-09/fixes/whalemochi-hat-front-v1.png` — `f932081404accf19`
- `docs/acceptance-2026-09-09/fixes/whalemochi-hat-side-a-v1.png` — `c0e8347c047b5615`
- `docs/acceptance-2026-09-09/fixes/whalemochi-hat-side-b-v1.png` — `0216e9056189851b`
- `public/pals/octomochi-front.png` — `5b52a227bedcca70`
- `public/pals/cuttlemochi-front.png` — `a8ba138b423e5a0b`
- `public/pals/squidmochi-front.png` — `433b766f16872e01`
- `public/pals/goldmochi-front.png` — `fa05ee1b207e5d40`
- `public/pals/whalemochi-front.png` — `95cfe1bd61345bd5`
- `public/pals/sharkmochi-front.png` — `735d2343de0e69a0`
- `public/pals/sealmochi-front.png` — `d9dc5cc1570cbced`
- `public/pals/turtlemochi-front.png` — `64ed375f1bb1f3a2`
- `public/pals/crabmochi-front.png` — `eb5d6e854db11481`

## 追加：60张修复后动态截图独立复核

实际逐格查看5伙伴×3视角×4动作的全部60张：`<id>-<front|side-a|side-b>-<body|limb|poke|recovery>.png`，伙伴为sealmochi、goldmochi、sharkmochi、crabmochi、whalemochi。每只3行×4列接触表；对鲸鱼front-poke、海豹front-body/side-a-poke、蟹front-limb、金鱼side-a-limb另做原图局部2倍放大。

**明确失败：`whalemochi-front-poke.png`画面右侧黑眼整块离开头部，二者之间有完整背景色间隙。** 这不是眨眼，也不是镜框或饰品；截图中鲸鱼没有眼镜。眼睛脱离这一帧已经足以使对应动态项不通过。不能由随后recovery帧看似贴回而豁免过程中的五官脱离。已将原图和放大证据告知主代理定位。

|伙伴/视角|body|limb|poke|recovery|
|---|---|---|---|---|
|sealmochi/front|侧转和拉伸中眼口/胡须仍接近脸，未见旧悬空嘴弧|鳍上扬，鳍根连续|脸/嘴/胡须完整|帧中脸变扁、后鳍投影露到头后，未见破裂；不是完全静止证据|
|sealmochi/side-a|嘴与吻垫连接，未见脱离|前鳍形变后仍接躯干|放大嘴线/胡须未复现旧悬空弧|升高姿态下连接完整；不能据此证明最终落稳|
|sealmochi/side-b|反侧脸和鳍完整|前鳍与体连接|反侧嘴线未脱离|身体升高但轮廓连续|
|goldmochi/front|转向后眼口贴身，新增下部鳍仍可见|胸鳍偏移但未断根|五官/鳍完整|表情张口、身体偏长，但未见眼口整块离体|
|goldmochi/side-a|下部鳍连接保持|放大胸鳍变窄/转向，仍与身体连着；下部鳍未断|下部鳍/尾/背鳍完整|新增鳍保持，未见裂口|
|goldmochi/side-b|反侧五官和新增鳍可辨|侧鳍偏摆未离体|新增下部鳍保持|尾柄/鳍根无明显断开|
|sharkmochi/front|转向后五鳃裂、附肢/笑线完整|胸鳍上扬但与身体相接|眼/口/背鳍完整|身体升高，未见裂网|
|sharkmochi/side-a|新增下部鳍和尾鳍完整|胸鳍横举，根部没有背景贯穿|五鳃裂/新鳍完整|新鳍与身连接保持|
|sharkmochi/side-b|反侧新鳍/鳃裂完整|横举胸鳍相接|眼睛呈闭眼细线，未误判为眼睛缺失|眼恢复可见，鳍完整|
|crabmochi/front|侧转后的双钳开口和尖端保留|重定位后的claw-1帧放大：右钳升高，开口/双尖端保留，未变球|双钳开口保留，仍接身体|双钳举起，尖端/开口仍清楚|
|crabmochi/side-a|近远钳及步足完整|钳部位移后开口仍可读|双钳结构保留|没有钳子重新变成圆球或钳根断裂|
|crabmochi/side-b|反侧钳口保留|反侧钳偏移但保持开口|钳口/指端保持|螯/步足完整|
|whalemochi/front|侧转后眼口完整|胸鳍变化，眼睛在轮廓边缘|**失败：画面右侧黑眼整块漂浮，完整背景间隙**|这一帧双眼贴近头部，不能替代失败的poke帧|
|whalemochi/side-a|头/眼/尾连续|胸鳍偏摆仍连接|单眼贴身，未见脱离|身体升高而结构连续|
|whalemochi/side-b|反侧头/眼/尾连续|鳍偏摆仍相接|反侧单眼贴身|鳍根和头身连续|

限制：这些是保存下来的动作时刻，不是连续视频；`recovery`文件名本身不能证明已完全静止，也不能证明经历所有释放路径。没有按压保持截图/输入时序证据，因此本独立复核**没有宣称按压保持已实测**。真实输入命中、时序和持续过程由主代理的操作记录另证。

动态原图版本摘要（SHA-256前16位）：

- `sealmochi-front-body.png` — `63ff200b81a3bf69`
- `sealmochi-front-limb.png` — `bc1f6653455f97ee`
- `sealmochi-front-poke.png` — `c29c378ee91dac5a`
- `sealmochi-front-recovery.png` — `5e92d3a78972423b`
- `sealmochi-side-a-body.png` — `da4bafcfeb3353fb`
- `sealmochi-side-a-limb.png` — `6b577a3a1a49707a`
- `sealmochi-side-a-poke.png` — `020fb852b3bdd397`
- `sealmochi-side-a-recovery.png` — `77463401e07d7a47`
- `sealmochi-side-b-body.png` — `e46987d570a92790`
- `sealmochi-side-b-limb.png` — `992d080cc3dfb0b2`
- `sealmochi-side-b-poke.png` — `51ed9439cb777f3d`
- `sealmochi-side-b-recovery.png` — `3db1031d3581cd87`
- `goldmochi-front-body.png` — `9764a757cf3a3dbe`
- `goldmochi-front-limb.png` — `d17808b6aa2e1d36`
- `goldmochi-front-poke.png` — `7448df2649d44e31`
- `goldmochi-front-recovery.png` — `14be7ac5f58616f1`
- `goldmochi-side-a-body.png` — `01f48833f3151525`
- `goldmochi-side-a-limb.png` — `618862f740cc6500`
- `goldmochi-side-a-poke.png` — `307dbd78a2b130d6`
- `goldmochi-side-a-recovery.png` — `4055e7d99c868977`
- `goldmochi-side-b-body.png` — `1d7b6779a1af9adc`
- `goldmochi-side-b-limb.png` — `f1dfe7b4c5a49306`
- `goldmochi-side-b-poke.png` — `f33e171fa7576ad1`
- `goldmochi-side-b-recovery.png` — `9fb9c3a6f80a1dd6`
- `sharkmochi-front-body.png` — `c07fb76be3c35b7b`
- `sharkmochi-front-limb.png` — `7019b96295dc880f`
- `sharkmochi-front-poke.png` — `6d1806f920757296`
- `sharkmochi-front-recovery.png` — `cf1582a9c0a1b9ff`
- `sharkmochi-side-a-body.png` — `1048d5d1b4b91cb1`
- `sharkmochi-side-a-limb.png` — `7d5917b73d6def7b`
- `sharkmochi-side-a-poke.png` — `8434ce0722770f77`
- `sharkmochi-side-a-recovery.png` — `6683c147eb0fbf88`
- `sharkmochi-side-b-body.png` — `cf62d4475191ef4b`
- `sharkmochi-side-b-limb.png` — `b03d1de04ad84dc1`
- `sharkmochi-side-b-poke.png` — `ad2ee62bbd76be32`
- `sharkmochi-side-b-recovery.png` — `75b581b366ba224e`
- `crabmochi-front-body.png` — `079dce0bfb3474cc`
- `crabmochi-front-limb.png` — `8350fe5e3263e332`
- `crabmochi-front-poke.png` — `6645c43b4c1d09c3`
- `crabmochi-front-recovery.png` — `2f179f82dd469503`
- `crabmochi-side-a-body.png` — `fa8c6dbfac38485e`
- `crabmochi-side-a-limb.png` — `95c7e6b1a647e24e`
- `crabmochi-side-a-poke.png` — `a084cbfef1abed01`
- `crabmochi-side-a-recovery.png` — `7e22ae45dca91678`
- `crabmochi-side-b-body.png` — `d54e4d340b6a2c74`
- `crabmochi-side-b-limb.png` — `c93a6449caaa3153`
- `crabmochi-side-b-poke.png` — `c7ed67f7f5fdff74`
- `crabmochi-side-b-recovery.png` — `5fe7a376652c4f31`
- `whalemochi-front-body.png` — `c90166383e134a66`
- `whalemochi-front-limb.png` — `05d957df1a6b6216`
- `whalemochi-front-poke.png` — `ae37edc3a51625cb`
- `whalemochi-front-recovery.png` — `cd37e1a8faa1468d`
- `whalemochi-side-a-body.png` — `5f49bfddc714df22`
- `whalemochi-side-a-limb.png` — `6ce926068a069ddd`
- `whalemochi-side-a-poke.png` — `3f27822676c1ee75`
- `whalemochi-side-a-recovery.png` — `98a518d710961adc`
- `whalemochi-side-b-body.png` — `109c6db51b69f221`
- `whalemochi-side-b-limb.png` — `093419acf37b8fda`
- `whalemochi-side-b-poke.png` — `91bee2892881f53e`
- `whalemochi-side-b-recovery.png` — `51dae9f73e21e2b7`

## 最新用户纠偏：撤销鲨鱼静态通过，等待v2

主代理转达用户明确反馈：鲨鱼侧面后腹几片鳍像“一排脚”。原独立复核虽然实际看了图，但对位置、比例和后掠轮廓判断不够严格；“新增鳍可见、没有裂开”不能代替鳍形态识别通过。因此撤销本记录中鲨鱼静态通过结论。原动态表中的“无裂网/无断开”仅保留为那些单帧的观察事实，不是鲨鱼整体通过。

主代理已安排v2：更薄且后掠的鳍形、较小的成对横向腹鳍、小型中线臀鳍，并与尾鳍留间隔。此处尚未查看v2图，**待正面和双侧实际新截图复验**，不因已安排修复而通过。鲸鱼浮眼由主代理继续修复。
