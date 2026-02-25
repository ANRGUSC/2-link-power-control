# 2-Link Power Control Simulator

An interactive, educational web application for exploring 2-link power control feasibility under SINR constraints. Built for students studying wireless networks.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-brightgreen.svg)](https://2-link-power-control.vercel.app)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](LICENSE.md)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**[Try the Live Demo →](https://2-link-power-control.vercel.app)**

## Overview

In a wireless network with two transmitter-receiver pairs sharing the same frequency band, each link's signal acts as interference to the other. The fundamental question is: can both links simultaneously achieve their target SINR, and if so, what are the minimum power levels required?

This simulator makes the 2-link power control problem intuitive through real-time visualization. Students can adjust channel gains, noise levels, and SINR targets, then watch how the feasible power region changes and run the Foschini-Miljanic distributed power control algorithm.

### Key Features

- **Feasibility Plane**: Canvas visualization of the (P1, P2) power plane showing SINR boundary lines, the feasible region, and the minimum-power intersection point
- **Click-to-Place Starting Point**: Click anywhere on the plot to set initial power levels for both transmitters
- **Foschini-Miljanic Iteration**: Run the distributed power control algorithm and watch it converge (or diverge) with a staircase trajectory showing alternating transmitter updates
- **Network Diagram**: SVG showing Tx1, Tx2, Rx1, Rx2 with direct gains (green) and cross-interference gains (red), line thickness proportional to gain values
- **5 Preset Configurations**: Low Interference, High Interference, Near Infeasible, Asymmetric, and Infeasible
- **Statistics Panel**: Feasibility status, spectral radius, derived parameters, SINR values at the current point
- **KaTeX Equations**: Collapsible panel with SINR constraints, feasibility condition, and iteration formulas
- **Dark/Light Mode**: Toggle with localStorage persistence

## How It Works

### The Math

Two transmitter-receiver pairs share the same channel. The SINR constraints are:

```
SINR1 = P1 * g11 / (P2 * g21 + N1) >= theta
SINR2 = P2 * g22 / (P1 * g12 + N2) >= theta
```

where g11, g22 are direct gains, g12, g21 are cross-interference gains, N1, N2 are noise powers, and theta is the SINR target.

### Linear Constraints

Rearranging, the SINR constraints become linear in P1 and P2:

```
P1 >= a * P2 + b     (Line L1)
P2 >= c * P1 + d     (Line L2)
```

where a = theta * g21 / g11, b = theta * N1 / g11, c = theta * g12 / g22, d = theta * N2 / g22.

### Feasibility Condition

The system is feasible (both SINRs can be met simultaneously) if and only if:

```
rho(F) = sqrt(a * c) < 1
```

When feasible, the minimum power point is the intersection of L1 and L2:

```
P1* = (a*d + b) / (1 - a*c)
P2* = (c*b + d) / (1 - a*c)
```

### Foschini-Miljanic Algorithm

The distributed power control iteration alternates updates:

```
P1(t+1) = a * P2(t) + b     (Tx1 updates — horizontal move)
P2(t+1) = c * P1(t+1) + d   (Tx2 updates — vertical move)
```

When feasible (a*c < 1), this converges to (P1*, P2*) from any starting point. When infeasible, it diverges.

### Key Insights Students Can Discover

| Observation | How to See It |
|-------------|---------------|
| **Feasibility depends on cross-gain products** | Increase g12 or g21 and watch a*c cross 1 |
| **The feasible region is a cone** | The shaded region opens up from the intersection point |
| **Iteration converges from any starting point** | Click different locations, run iteration — all paths lead to P* |
| **Infeasible systems diverge** | Select the "Infeasible" preset and run iteration |
| **Higher SINR targets shrink feasibility** | Increase theta and watch the feasible region narrow |
| **Alternating updates create a staircase** | Each step is either horizontal (Tx1) or vertical (Tx2) |

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/ANRGUSC/2-link-power-control.git
cd 2-link-power-control

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
2-link-power-control/
├── src/
│   ├── components/
│   │   ├── FeasibilityPlane.tsx    # Canvas: P1-P2 plane with boundary lines and trajectory
│   │   ├── NetworkDiagram.tsx      # SVG: Tx/Rx nodes with gain links
│   │   ├── Controls.tsx            # Sliders, presets, iteration controls
│   │   ├── StatsPanel.tsx          # Feasibility, SINR, derived params
│   │   └── EquationsPanel.tsx      # Collapsible KaTeX equations
│   ├── hooks/
│   │   ├── usePowerControl.ts      # State management + iteration logic
│   │   └── useTheme.ts             # Dark/light mode toggle
│   ├── utils/
│   │   └── powercontrol.ts         # Pure math functions
│   ├── types/
│   │   ├── index.ts                # TypeScript interfaces
│   │   └── react-katex.d.ts        # Module declaration
│   ├── App.tsx                     # Main layout
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Tailwind + theme styles
├── LICENSE.md                      # PolyForm Noncommercial 1.0.0
└── README.md
```

## Technologies Used

- **React 19** with hooks for UI
- **TypeScript 5.9** for type safety
- **Vite 7** for fast development and building
- **Tailwind CSS 4** for styling
- **HTML Canvas** for the feasibility plane visualization
- **SVG** for the network diagram
- **KaTeX** for LaTeX equation rendering

## Related Demos

- [Water-Filling Power Allocation Simulator](https://github.com/ANRGUSC/waterfilling-demo) — interactive demo of the water-filling algorithm for parallel channel power allocation

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

- **Non-commercial use**: Free for educational, research, and personal use
- **Commercial use**: Requires a separate commercial license

For commercial licensing inquiries, please contact the author.

## Author

**Bhaskar Krishnamachari**
University of Southern California
EE 597 - Wireless Networks

Developed with Claude Code, February 2026
