# 🌌 宇宙轨道图鉴 · 太阳系

一个用**真实 NASA/JPL 开普勒轨道数据**驱动的 3D 太阳系网站，展示各天体的实时轨道位置与"明显特征"。纯前端、零构建、可免费部署。

![tech](https://img.shields.io/badge/Three.js-r160-blue) ![build](https://img.shields.io/badge/build-none-green)

---

## ✨ 功能

- **真实轨道**：8 大行星位置由 JPL 开普勒轨道根数（半长轴/离心率/倾角/平黄经…）实时解算，解开普勒方程得到真实几何位置，非假动画。
- **时间旅行**：可加速、倒放、暂停，一键回到今天，观察行星几十年的运行。
- **天体特征**：点击任意天体，查看它的明显特征与关键数据（地球特别标注了"唯一已知生命星球"、液态水、大气、磁场等）。
- **交互镜头**：拖动旋转、滚轮缩放、镜头一键对准某个天体。

---

## 🏗 架构

```
astro-orbits/
├── index.html          入口。用 importmap 从 CDN 加载 Three.js（无需 npm）
├── styles.css          界面样式
├── src/
│   ├── kepler.js       【天文引擎】JPL 轨道根数表 + 位置/轨道解算
│   ├── bodies.js       【数据层】各天体物理数据与特征描述
│   └── main.js         【渲染层】Three.js 场景、时间控制、交互
└── README.md
```

**分层设计（便于扩展）：**

| 层 | 职责 | 扩展方式 |
|----|------|---------|
| 天文引擎 `kepler.js` | 纯数学，输入时间输出坐标 | 加更精确星历 / 彗星轨道 |
| 数据层 `bodies.js` | 天体属性与特征文本 | 加恒星、星系只改这里 |
| 渲染层 `main.js` | 可视化与交互 | 换材质、加贴图、加轨迹 |

三层解耦：以后要加"恒星 / 星系"模块，只需在数据层新增条目、在渲染层加一种画法，天文引擎无需改动。

---

## 🚀 本地运行

ES 模块必须通过 HTTP 访问（不能直接双击打开 `index.html`）。任选一种：

```bash
# 方式一：Python（macOS 自带）
cd astro-orbits
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080

# 方式二：Node
npx serve .
```

---

## 🌐 免费部署（三选一，都属于主流免费方案）

### GitHub Pages（推荐，最简单）
```bash
cd astro-orbits
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/<你的用户名>/astro-orbits.git
git push -u origin main
```
然后在仓库 **Settings → Pages → Source** 选 `main` 分支根目录，几分钟后即可用
`https://<用户名>.github.io/astro-orbits/` 访问。

### Firebase Hosting（Google 官方）
```bash
npm i -g firebase-tools
firebase login
firebase init hosting     # public 目录填 "."
firebase deploy
```

### Vercel
把仓库导入 vercel.com，框架选 "Other"，直接部署即可。

---

## 🔭 数据来源与精度

- 轨道根数：[JPL — Keplerian Elements for Approximate Positions of the Major Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html)
- 适用区间 1800–2050 年，行星位置精度足够可视化用途。
- 显示尺寸与月地距离做了**视觉放大**（真实比例下行星会小到不可见），轨道**距离与形状保持真实几何**。信息面板里的数字均为真实值。

---

## 🧭 后续可扩展方向

- [ ] 加入行星贴图（NASA 公开纹理）提升真实感
- [ ] 加入矮行星（冥王星、谷神星）与著名彗星轨道
- [ ] 「恒星」模块：邻星、天狼星、参宿四等（用赤道坐标 + 距离）
- [ ] 「星系」模块：本星系群示意图
- [ ] 行星合、冲、凌日等天象的日期预测
- [ ] 移动端触控优化与性能分级
