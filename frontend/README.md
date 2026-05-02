# LearnAdaptive Frontend

The LearnAdaptive frontend is a modern, responsive React application built with Vite, providing a seamless interface for AI-driven learning.

## Features

- **Dynamic Dashboard**: Real-time stats, progress tracking, and personalized recommendations.
- **Learning Hub**: Curated course library with search and filtering.
- **Ask AI**: Interactive chat interface with AI tutors, supporting session history and topic locking.
- **Rapid MCQ**: Fast-paced, timed quiz mode with instant AI-verified feedback.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop viewports.
- **Dark Mode**: Support for light and dark themes.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Routing**: React Router Dom
- **Styling**: Vanilla CSS (Modern, premium aesthetic)
- **Animations**: CSS Keyframes & Framer Motion (where applicable)

## Setup Instructions

1. **Installation**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configuration**:
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

3. **Development**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

4. **Production Build**:
   ```bash
   npm run build
   ```

## Design Principles

- **Bento Grid Layout**: Used in the dashboard for a structured, modern feel.
- **Glassmorphism**: Subtle blur effects on cards and navigation.
- **Premium Typography**: Uses 'Space Grotesk' for headings and 'Manrope' for body text.
- **Micro-interactions**: Smooth transitions and hover states to enhance UX.
