/**
 * risk_level: high if temp > 8 OR door open long (≥20s continuous).
 * efficiency_score: 0–100, higher when cooling on and temperature stable in band.
 */

const TEMP_HIGH = 8;
const TEMP_WARN_HIGH = 6;
const DOOR_LONG_SEC = 20;
const DOOR_MEDIUM_SEC = 10;
const HUMIDITY_WARN = 78;

const TARGET_LOW = 2;
const TARGET_HIGH = 5;
const STABILITY_MAX_RATE = 0.02; // °C/s considered "stable"

function computeRiskLevel({
  temperature,
  humidity,
  door_open,
  doorOpenDurationSec,
}) {
  if (temperature > TEMP_HIGH || doorOpenDurationSec >= DOOR_LONG_SEC) {
    return "high";
  }
  if (
    temperature >= TEMP_WARN_HIGH ||
    (door_open && doorOpenDurationSec >= DOOR_MEDIUM_SEC) ||
    humidity >= HUMIDITY_WARN
  ) {
    return "medium";
  }
  return "low";
}

function computeEfficiencyScore({
  cooling_on,
  door_open,
  temperature,
  tempDerivativePerSec,
}) {
  let score = 55;

  if (cooling_on) score += 18;
  else score -= 8;

  if (door_open) score -= 14;

  if (temperature >= TARGET_LOW && temperature <= TARGET_HIGH) score += 16;
  else if (temperature > TARGET_HIGH && temperature <= 7) score += 4;
  else if (temperature > TEMP_HIGH) score -= 25;

  const stability = Math.min(1, Math.abs(tempDerivativePerSec) / STABILITY_MAX_RATE);
  score += (1 - stability) * 12;

  return Math.round(Math.min(100, Math.max(0, score)));
}

module.exports = {
  computeRiskLevel,
  computeEfficiencyScore,
  TEMP_HIGH,
  DOOR_LONG_SEC,
  DOOR_MEDIUM_SEC,
};
