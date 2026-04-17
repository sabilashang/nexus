/**
 * Sensor simulation: smooth drift + layered noise so charts stay interesting.
 */

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function smoothNoise(maxDelta) {
  return (Math.random() * 2 - 1) * maxDelta;
}

/** °C per second drift by state_id */
const TEMP_DRIFT = {
  1: 0.0024,
  2: 0.005,
  3: -0.0028,
  4: -0.0062,
};

function createSensorState(initial) {
  return {
    temperature: initial.temperature,
    humidity: initial.humidity,
    power_usage: initial.power_usage,
    load_percentage: initial.load_percentage,
    _loadPhase: Math.random() * Math.PI * 2,
    _powerPhase: Math.random() * Math.PI * 2,
    _humidityJitter: (Math.random() - 0.5) * 4,
    _tempBurst: 0,
  };
}

/**
 * @param {object} s - mutable sensor state
 * @param {{ door_open: boolean, cooling_on: boolean }} controls
 * @param {number} stateId - 1..4
 * @param {number} dtMs - delta time ms
 */
function updateSensors(s, controls, stateId, dtMs) {
  const dt = dtMs / 1000;
  const { door_open, cooling_on } = controls;

  const drift = TEMP_DRIFT[stateId] ?? 0;
  const noise = smoothNoise(0.022);
  if (Math.random() < 0.04) {
    s._tempBurst = (Math.random() - 0.5) * 0.35;
  }
  s._tempBurst *= 0.88;
  s.temperature = clamp(
    s.temperature + drift * dt + noise * 0.18 + s._tempBurst * dt * 2,
    -5,
    20,
  );

  let humDelta = 0;
  if (door_open) humDelta += 0.038 * dt;
  if (cooling_on) humDelta -= 0.018 * dt;
  humDelta += smoothNoise(0.035);
  s._humidityJitter += smoothNoise(0.08) * dt;
  s._humidityJitter *= 0.985;
  s.humidity = clamp(s.humidity + humDelta + s._humidityJitter * 0.01 * dt * 60, 32, 92);

  const baseKw = 0.75;
  const coolingKw = cooling_on ? 2.55 + smoothNoise(0.12) : 0;
  const doorKw = door_open ? 0.18 + smoothNoise(0.04) : 0;
  s._powerPhase += dt * 0.35;
  const powerWobble = 1 + 0.06 * Math.sin(s._powerPhase) + 0.035 * Math.cos(s._powerPhase * 2.1);
  const targetPower = (baseKw + coolingKw + doorKw + smoothNoise(0.06)) * powerWobble;
  s.power_usage = clamp(
    s.power_usage + (targetPower - s.power_usage) * 0.28 + smoothNoise(0.04),
    0.15,
    8.5,
  );

  s._loadPhase += dt * 0.14;
  const wave =
    Math.sin(s._loadPhase) * 10 +
    Math.cos(s._loadPhase * 1.63) * 6 +
    Math.sin(s._loadPhase * 0.37) * 4;
  s.load_percentage = clamp(
    s.load_percentage + wave * 0.004 * dt * 60 + smoothNoise(0.35),
    0,
    100,
  );
}

function tempDerivativePerSec(prevTemp, newTemp, dtMs) {
  if (dtMs <= 0) return 0;
  return (newTemp - prevTemp) / (dtMs / 1000);
}

module.exports = {
  createSensorState,
  updateSensors,
  tempDerivativePerSec,
  clamp,
};
