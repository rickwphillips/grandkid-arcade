# 🕹️ Grandkid Arcade

A modern, responsive, and lightweight web-based arcade interface built with **React**, **TypeScript**, and **Tailwind CSS**. Designed to provide a clean launcher experience for web-based games and emulated content.

## 🚀 Features

* **Dynamic Game Grid**: Automatic layout of game cards with smooth hover transitions and metadata displays.
* **Category Filtering**: Quick-access filters for Action, Adventure, Puzzle, and more.
* **Real-time Search**: Instant, optimized filtering of the game library via the search bar.
* **Type-Safe Architecture**: Built with TypeScript for reliable data handling and predictable component props.
* **Responsive Design**: Fully optimized for desktops, tablets, and arcade cabinet displays using Tailwind CSS.
* **Icon Integration**: High-quality visual cues powered by `lucide-react`.

## 🛠️ Tech Stack

* **Framework:** [React 18](https://reactjs.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)

## 📂 Project Structure

```text
src/
├── components/       # UI Components (GameCard, CategoryFilter, SearchBar)
├── data/             # Game metadata and library definitions (games.ts)
├── types/            # TypeScript interfaces and types
├── App.tsx           # Main application logic and state management
└── main.tsx          # Entry point
