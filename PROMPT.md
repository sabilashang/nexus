Build a responsive IoT Dashboard web application designed for monitoring and controlling a simulated smart facility system.

## Objective

Create a clean, modern dashboard UI that consumes external APIs (already available) for sensor data and control actions. Do NOT simulate or generate backend logic — only integrate with APIs.

---

## Core Features

### 1. Live Telemetry Dashboard

- Display real-time sensor data from GET /telemetry endpoint

- Sensors to display:

  - temperature (°C)

  - humidity (%)

  - door_open (boolean)

  - cooling_on (boolean)

  - power_usage (kW)

  - load_percentage (%)

- UI Components:

  - Metric cards (for each sensor)

  - Status badges (ON/OFF, OPEN/CLOSED)

  - Trend indicators (↑ ↓ based on previous value stored locally)

  - Auto-refresh every 2 seconds

---

### 2. System State Panel

- Show derived system state:

  - risk_level

  - efficiency_score

- Display as:

  - colored badges (green/yellow/red)

  - progress bar for efficiency

---

### 3. Alerts Feed

- Display array from telemetry.events

- Each alert:

  - message

  - severity (low, medium, high)

- UI:

  - stacked list

  - color-coded by severity

  - most recent first

---

### 4. Control Panel

- Allow user actions via POST /control

- Actions:

  - TOGGLE_COOLING

  - TOGGLE_DOOR

- UI:

  - Toggle buttons

  - Immediate UI feedback (optimistic update)

  - Show response status (success/failure)

---

## API Integration

- Base URL configurable via environment variable

- Endpoints:

  - GET /telemetry

  - POST /control

- Handle:

  - loading states

  - API errors (show toast or inline error)

  - retry mechanism (basic)

---

## State Management

- Store latest telemetry in global state

- Keep previous state to calculate trends

- Avoid unnecessary re-renders

---

## UI / UX Design

### Layout

- Grid-based dashboard

- Sections:

  - Header (title + system status)

  - Telemetry grid

  - Alerts panel (side or bottom)

  - Control panel

### Design Style

- Modern SaaS dashboard aesthetic

- Clean, minimal, high readability

### Color Palette

- Background: dark (#0f172a or similar)

- Cards: slightly lighter dark

- Primary: blue

- Success: green

- Warning: yellow

- Danger: red

### Typography

- Sans-serif

- Clear hierarchy:

  - Large numbers for metrics

  - Small labels

### Responsiveness

- Desktop-first

- Tablet compatible

- Stack components vertically on small screens

---

## Component Structure

- App

  - Header

  - Dashboard

    - TelemetryGrid

      - SensorCard

    - SystemState

    - AlertsFeed

    - ControlPanel

- Reusable components:

  - Card

  - Badge

  - Button

  - Toggle

  - Loader

---

## Behavior

- Poll telemetry every 2 seconds

- Smooth UI updates (no flicker)

- Maintain last known values if API fails

---

## Constraints

- Do NOT implement backend logic

- Do NOT simulate sensor data

- Focus only on frontend + API integration

- Keep code modular and readable

---

## Output Expectation

- Fully functional frontend dashboard

- Ready to connect to any IoT API

- Clean architecture and maintainable code