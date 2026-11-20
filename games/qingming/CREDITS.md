# 创作、参考与许可

## 画面与历史参考

- 灵感来自张择端《清明上河图》（北宋，故宫博物院藏），重点参考虹桥、舟运、市井、城门与郊野的构成意象。
- 作品参考：https://commons.wikimedia.org/wiki/File:Alongtheriver_QingMing.jpg
- 游戏没有将扫描画卷作为底图。场景、建筑、行人、船只、柳树和其他动画均由本项目 Canvas 代码重新绘制，合集封面亦为本项目原创 SVG。
- 早期原型曾使用公有领域原画扫描；该方向已被替换，扫描图不再随游戏分发。
- 建筑布局、人物、对话、任务和部分服饰为游戏创作，不是逐像素复刻、准确历史地图或考古复原。本作不隶属于故宫博物院。

## 字体

- Noto Serif SC，Google / Adobe，SIL Open Font License 1.1。
- 来源：https://fonts.google.com/noto/specimen/Noto+Serif+SC
- 上游：https://github.com/notofonts/noto-cjk
- 本地 `song.woff2` 为 UI 汉字子集，避免运行时第三方请求；未覆盖字符使用浏览器的衬线字体回退。
- 完整许可随素材附在 `public/FONT-LICENSE.txt`。

## 声音

环境音与奖励音由 Web Audio API 合成，无外部录音。默认关闭。
