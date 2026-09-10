# 首页玩法演示增强

## 用户提供视频后的接入

用户手动在即梦生成并提供 `jimeng-2026-09-10-5115-固定镜头，一段完整的“捏住—拉开—松手回弹”软胶玩具演示。 严格保持参考图中的紫....mp4`。此前 CLI 上传阻塞已由用户提供实际视频解决；下方失败记录仅解释素材来源，不再表示当前仍等待生成。

原文件约 6.6 MB、960×960、约8.06秒，含音轨。页面版本 `public/art/palm-demo.mp4` 使用 FFmpeg H.264 CRF24、yuv420p、faststart，移除音轨，保留960×960和60fps，时长8.0167秒、419460字节。视频来自用户提供的即梦产物；建议生成参数为Seedance 2.5，但文件元数据本身不能证明模型版本。保留原黄绿色背景融入已有主视觉卡片，未做去背。

素材检查：`video/contact.png` 为每0.5秒采样，`video/release-frames.png` 为5—6秒每1/12秒采样，`video/release-detail.png` 为5.65秒局部过程的完整帧。捏合、拉伸、松手和恢复顺序成立，未发现明显五官脱离、附肢新增或突兀切镜。首尾姿态不同，采用播放一次并停止，不设置循环；无需伪造无缝循环。

页面动态验收：实际浏览器观察首次可见自动播放、阶段0/2/5.65秒同步、8.0167秒结束停住；点击拉伸后从2秒播放，暂停停在2.24秒附近，继续从原位置播放。键盘Enter可暂停。320×400短视口滚动至figure完全离屏后，视频停在0.255秒；回到正常尺寸没有自动重播。临时移走MP4后重新加载，播放控件消失，点击下方步骤仍显示已加载的静态拉伸图；素材已恢复并确认再次正常播放。

响应式复查覆盖1580×916、834×1112、390×844和320×740，检查视频取景与控件，未见页面横向溢出。按用户对冗余控件的反馈，最终移除常驻阶段编号、辅助提示与独立重播；结束后图注只保留角色名。正常播放/手动暂停时仅保留低调的暂停/继续按钮（手机实测65×44px），下方步骤仍可重播。屏幕阅读器保留阶段描述。`video/tablet-final.png`、`video/phone-final-paused.png`、`video/narrow-final.png`为收简后的状态；此前截图包含已删除的重播组，不作为最终界面。

类型检查、首页定向lint和构建通过；构建仍有大包与首页CSS同名输出警告。减少动态偏好/省流模式的禁止自动播放与preload none已实现并检查代码，但未在实际系统偏好下实测；真机触摸、后台切换、限速网络未实测。没有把浏览器视口的鼠标操作称为真机触控验证。源码之外的角色/舞台改动属于并行工作，未修改或回退。视频接入已交付，以上平台验证限制仍需如实保留。

## 范围与依据

最终内置浏览器复核：首页可自动播放；结束后不显示播放控件；点击“拉一拉”后可暂停并继续；390×844视口下点击“松开手”可播放至结束，结束后暂停按钮数量为0。实际截图确认角色名、画面和三步区域无遮挡，大号重播、阶段编号和常驻提示均未显示。测试结束已恢复默认视口。本次仅复核首页交互与布局，不扩大为真机触控或系统偏好验收。

沿用 `DESIGN.md` 的掌心游乐场方向及实际首页，保留标题、双栏主次比例、导航和直接试玩入口。将首屏主视觉与三步玩法连接起来。仅修改首页，不调整图鉴、角色、物理或 WebGPU 生命周期。

## 素材与生成状态

- 内置 Image Gen 生成初始、拉伸、恢复三张状态图；工具未返回可确认的模型版本，不猜测型号。
- 身份与材质参考：`public/art/palm-octopus-white-pinch.png`。后两张使用新初始帧为参考，保持同一主体、机位、光照和腕足位置。
- 页面素材：`public/art/palm-demo-{start,pull,release}.webp`。FFmpeg 以 WebP quality 85 转码，三张合计约 100 KB；背景保留在画面中，没有执行去背。
- Seedance 2.5 / 720p / 8 秒图生视频已实际尝试。相对路径 PNG、绝对路径 PNG、1024px JPEG 均在上传阶段终止：`upload phase, no file upload`。未产生视频，未进行视频逐帧、去背或循环验收。
- 失败任务 ID：`b86c5f6e-424b-469c-9630-72efb7f59d6b`、`6674f58a-48d8-457b-90e9-f034221a1fd4`、`9108e8d7-d5a1-4564-bd72-482f3b96b0be`。均为终态 fail，不能当作仍在运行的任务继续等待。
- 后续排障：查到 `.dreamina_cli/logs/` 当天日志为空。官方 2026-09-10 发布的 1.4.18 已下载至独立临时目录测试，没有覆盖原安装；同一 JPEG 在新版仍以相同上传错误失败，任务 `bd9b1b5b-a1c6-47f6-9984-2e08cbb92020`。旧版本不是目前已证实的解决方向，不应继续靠重复提交重试。

## 生成提示词

初始帧：Create a square production image asset for the existing Squishy Pals landing page, using the supplied image as IDENTITY and MATERIAL reference. Preserve the same lovable lavender-purple octopus soft squishy toy, shiny oval black eyes, little curved smile, pink cheek patches, rounded thick tentacles with pink suckers, and warm-white thick cartoon glove. This is a polished 3D toy render, not hand drawn. CHANGE pose and composition: octopus is relaxed and round, completely unstretched, head upright, body centered at x 56%, y 53%, occupying about 65% of canvas width and 66% height. All visible tentacles comfortably inside image. One single warm-white cartoon glove at upper left, thumb and index finger lightly touching/pinching a SMALL bit of upper-left head surface, ready to pull, no long stretch yet. Glove wrist may exit left edge but fingers entirely visible. Face follows curved body naturally. Keep open room at upper left for future pull motion and lower 15% of image empty for actual HTML caption. Seamless solid yellow-green studio background #e1fc82, no horizon, no texture, no typography, no UI, no additional objects. Soft warm studio lighting, tactile smooth silicone, restrained highlights. Preserve coherent octopus anatomy and original friendly face. Save resulting image asset to a local path for integration.

拉伸帧：Edit this exact production asset into the PULL phase of the same octopus interaction. Preserve exact octopus identity, lavender silicone material, eye and cheek design, tentacle arrangement, camera, background, framing, scale, light and empty bottom caption margin. Keep body center and tentacle positions nearly fixed. Move the single warm white glove upper left by a modest distance, keeping fingers visible, so its thumb and index finger pull the already-pinched upper-left head surface into a soft stretched taper. Stretch the cheek and near-side eye subtly toward the pinch consistently with the same surface; never detach face. This should look like a second frame of the SAME fixed-camera scene, not a new illustration. Maintain coherent thick soft toy anatomy. Do not add objects, motion lines, words, arrows, UI or borders. Square image.

恢复帧：Edit this exact image into the RELEASED REST state of the same octopus. Preserve pixel-aligned composition as much as possible: identical purple soft toy, same face, lighting, tentacle arrangement, camera distance, body center, scale, yellow-green background and blank bottom caption area. Remove the glove completely. Restore the small pinched upper-left head area to a smooth naturally rounded dome; head is relaxed and round. Eyes and cheeks return to natural symmetric surface positions; keep original warm curved smile. Keep all lower tentacles in their same locations. No residual pinch peak or stretched corner. This is the third static story frame after the hand has let go and toy recovered. No new objects or motion lines, no text/UI/borders. Same polished smooth lavender silicone toy render, black oval eyes, pink cheek patches and pink suckers. Square.

视频提示词：固定镜头，紫色软胶八爪鱼与奶白色厚手套保持参考身份。0-2秒轻捏头部左上局部，2-4.8秒手套向左上缓慢拉伸局部身体，近侧眼睛脸颊随表面偏移，腕足滞后轻晃。4.8秒松手，身体柔软回弹并衰减恢复圆润，手套退出左上。7-8秒恢复静止。保持眼睛数量、笑脸、腕足结构与材质一致，无新物体无镜头运动无文字。黄绿色背景保持一致，下方留白。

## 静态版验证记录

以下为静态版的验证；视频版复查记录见本文开头。

| 范围 | 结果与证据 |
| --- | --- |
| 桌面 1580×916 | 三步点击切换，图片、阶段文字、选中态一致；`desktop-start/pull/release.png`。|
| 平板 834×1112 | 完整主体与三列步骤正常；`tablet-start.png`。|
| 手机 390×844 | 滚动后可同时看到画面与步骤；点击拉伸与恢复正常，Tab/Enter 可选择；最终图注在图片下方，`phone-release.png`。|
| 窄屏 320×740 | 说明改为上下排，图注独立占位，无遮挡；最终 `narrow-release.png`。|
| 600/601/1100/1101×900 | 无横向页面溢出；对应 breakpoint 截图。601px 三个按钮最终等高 120.09px；`responsive.json` 保存最终测量。|
| 键盘 | 手机视口 Tab 从拉伸移动至恢复，Enter 切换，焦点与选中状态可辨。|
| 图片加载失败 | 临时移走拉伸图并重新加载，选择该步骤仍保留初始图、选中态不冒进、显示失败提示；`narrow-failed-asset.png` 为图注修正后复查。素材已恢复并重新加载确认。|
| 原有入口 | 点击开始捏捏进入 `/pals/octomochi`，真实 WebGPU 八爪鱼与设置可见；返回首页点击挑选伙伴进入九位伙伴图鉴。|
| 类型与定向 lint | `npm run typecheck`、`npx oxlint app/page.tsx app/HomeDemo.tsx`、`git diff --check` 通过。|
| 全仓 lint | 失败，报错位于未修改的通用控件及 `src/core/PlaygroundPage.tsx` 等文件；未扩大本轮改动。|
| 构建 | `npm run build` 通过；保留大包和同名首页 CSS 输出警告，未将其误报为无警告构建。|

未验证：真机触摸、其他浏览器、限速网络。手机/平板是浏览器视口测试，并非真实触屏。这一阶段未进行视频验证；当前视频状态以开头接入记录为准。没有上线、提交或推送。
