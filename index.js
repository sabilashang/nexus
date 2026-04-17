require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { createStateEngine, stateIdFromBooleans } = require("./simulation/stateEngine");
const {
  createSensorState,
  updateSensors,
  tempDerivativePerSec,
} = require("./simulation/sensors");
const { computeRiskLevel, computeEfficiencyScore } = require("./simulation/derived");
const { maybeNextEvents, pushEvent } = require("./simulation/events");

const PORT = Number(process.env.PORT) || 5000;
const TICK_MS = 1000;

const engine = createStateEngine();
const sensors = createSensorState({
  temperature: 4.0,
  humidity: 55,
  power_usage: 1.2,
  load_percentage: 42,
});

let eventBuffer = [];
let nextEventId = 1;
let lastDoorOpen = false;
let doorOpenedAt = null;

function doorOpenDurationSec(now, door_open) {
  if (!door_open) return 0;
  if (doorOpenedAt == null) return 0;
  return (now - doorOpenedAt) / 1000;
}

let latestSnapshot = null;

function pushSystemEvent(message, severity = "low") {
  const now = Date.now();
  eventBuffer = pushEvent(eventBuffer, {
    id: nextEventId++,
    message,
    severity,
    timestamp: now,
  });
}

function runTick() {
  const now = Date.now();

  const { door_open, cooling_on } = engine.getEffectiveBooleans();
  const state_id = stateIdFromBooleans(door_open, cooling_on);

  if (door_open && !lastDoorOpen) doorOpenedAt = now;
  if (!door_open) doorOpenedAt = null;
  lastDoorOpen = door_open;

  const doorSec = doorOpenDurationSec(now, door_open);

  const prevTemp = sensors.temperature;
  updateSensors(sensors, { door_open, cooling_on }, state_id, TICK_MS);
  const deriv = tempDerivativePerSec(prevTemp, sensors.temperature, TICK_MS);

  const risk_level = computeRiskLevel({
    temperature: sensors.temperature,
    humidity: sensors.humidity,
    door_open,
    doorOpenDurationSec: doorSec,
  });

  const efficiency_score = computeEfficiencyScore({
    cooling_on,
    door_open,
    temperature: sensors.temperature,
    tempDerivativePerSec: deriv,
  });

  for (const ev of maybeNextEvents(2)) {
    eventBuffer = pushEvent(eventBuffer, {
      id: nextEventId++,
      message: ev.message,
      severity: ev.severity,
      timestamp: now,
    });
  }

  latestSnapshot = {
    timestamp: new Date(now).toISOString(),
    state: {
      door_open,
      cooling_on,
      state_id,
    },
    sensors: {
      temperature: round3(sensors.temperature),
      humidity: round2(sensors.humidity),
      power_usage: round3(sensors.power_usage),
      load_percentage: round2(sensors.load_percentage),
    },
    derived: {
      risk_level,
      efficiency_score,
    },
    events: eventBuffer.map((e) => ({ ...e })),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

const app = express();

/** Helps browsers skip the ngrok free-tier interstitial when tunneling this API. */
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "ngrok-skip-browser-warning"],
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json());

function telemetryDashboardPayload() {
  if (!latestSnapshot) return null;
  const { state, sensors, derived, events } = latestSnapshot;
  return {
    temperature: sensors.temperature,
    humidity: sensors.humidity,
    door_open: state.door_open,
    cooling_on: state.cooling_on,
    power_usage: sensors.power_usage,
    load_percentage: sensors.load_percentage,
    risk_level: derived.risk_level,
    efficiency_score: derived.efficiency_score,
    events: events.map((e) => ({
      id: e.id,
      message: e.message,
      severity: e.severity,
      timestamp: e.timestamp,
    })),
  };
}

app.get("/telemetry", (req, res) => {
  const body = telemetryDashboardPayload();
  if (!body) {
    return res.status(503).json({ error: "warming_up" });
  }
  res.json(body);
});

app.get("/state", (req, res) => {
  if (!latestSnapshot) {
    return res.status(503).json({ error: "warming_up" });
  }
  const s = latestSnapshot.state;
  res.json({
    door_open: s.door_open,
    cooling_on: s.cooling_on,
    state_id: s.state_id,
  });
});

app.post("/control", (req, res) => {
  const body = req.body ?? {};
  const { action } = body;

  if (action === "TOGGLE_COOLING" || action === "TOGGLE_DOOR") {
    const { door_open, cooling_on } = engine.getEffectiveBooleans();
    if (action === "TOGGLE_COOLING") {
      engine.applyControl(door_open, !cooling_on);
      pushSystemEvent("Cooling toggled", "medium");
    } else {
      engine.applyControl(!door_open, cooling_on);
      pushSystemEvent("Door toggled", "medium");
    }
    runTick();
    return res.json({ success: true });
  }

  if (typeof body.door_open === "boolean" && typeof body.cooling_on === "boolean") {
    engine.applyControl(body.door_open, body.cooling_on);
    pushSystemEvent("State synced from dashboard", "low");
    runTick();
    return res.json({ success: true });
  }

  return res.status(400).json({
    error:
      'expected { action: "TOGGLE_COOLING" | "TOGGLE_DOOR" } or { door_open: boolean, cooling_on: boolean }',
  });
});

app.listen(PORT, () => {
  runTick();
  setInterval(runTick, TICK_MS);
  console.log(`Nexus cold-storage sim listening on http://localhost:${PORT}`);
  console.log(`  GET  /telemetry  /state`);
  console.log(`  POST /control`);
});
