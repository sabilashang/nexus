const MESSAGES = [
  { message: "Temperature rising", severity: "medium" },
  { message: "Temperature falling", severity: "low" },
  { message: "Door opened", severity: "medium" },
  { message: "Door closed", severity: "low" },
  { message: "Cooling stabilizing system", severity: "low" },
  { message: "Compressor cycle started", severity: "low" },
  { message: "Defrost window scheduled", severity: "medium" },
  { message: "Humidity spike detected", severity: "medium" },
  { message: "Air curtain nominal", severity: "low" },
  { message: "Load zone A active", severity: "low" },
  { message: "Load zone B idle", severity: "low" },
  { message: "Power draw within band", severity: "low" },
  { message: "Transient load peak", severity: "high" },
  { message: "Setpoint tracking OK", severity: "low" },
  { message: "Setpoint drift warning", severity: "medium" },
  { message: "Sensor self-check passed", severity: "low" },
  { message: "Telemetry batch uploaded", severity: "low" },
  { message: "Edge gateway heartbeat", severity: "low" },
  { message: "Cold chain integrity OK", severity: "low" },
  { message: "Inventory scan reminder", severity: "medium" },
  { message: "Condensate line OK", severity: "low" },
  { message: "Evaporator fan ramp", severity: "low" },
  { message: "Thermal curtain engaged", severity: "low" },
  { message: "Dock activity detected", severity: "medium" },
  { message: "Night setback mode preview", severity: "medium" },
];

/** Per slot: chance to emit one event (up to maxPerTick slots per simulation step). */
const INJECT_PROBABILITY = 0.42;

function pickMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

/**
 * Returns 0..maxPerTick independent event payloads (caller adds id/timestamp).
 */
function maybeNextEvents(maxPerTick = 2) {
  const out = [];
  for (let i = 0; i < maxPerTick; i++) {
    if (Math.random() < INJECT_PROBABILITY) {
      const m = pickMessage();
      out.push({ message: m.message, severity: m.severity });
    }
  }
  return out;
}

function pushEvent(buffer, entry, maxLen = 40) {
  if (!entry) return buffer;
  const next = [...buffer, entry];
  if (next.length > maxLen) return next.slice(-maxLen);
  return next;
}

module.exports = {
  maybeNextEvents,
  pushEvent,
  MESSAGES,
};
