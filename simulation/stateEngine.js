/**
 * Door and cooling are driven only by POST /control (toggles). There is no
 * automatic scenario cycling; telemetry reflects this state plus the sensor sim.
 */

function stateIdFromBooleans(door_open, cooling_on) {
  if (!door_open && !cooling_on) return 1;
  if (door_open && !cooling_on) return 2;
  if (!door_open && cooling_on) return 3;
  return 4;
}

function createStateEngine() {
  let door_open = false;
  let cooling_on = true;

  function applyControl(nextDoor, nextCooling) {
    door_open = Boolean(nextDoor);
    cooling_on = Boolean(nextCooling);
  }

  function getEffectiveBooleans() {
    return { door_open, cooling_on };
  }

  function getEffectiveStateId() {
    return stateIdFromBooleans(door_open, cooling_on);
  }

  return {
    applyControl,
    getEffectiveBooleans,
    getEffectiveStateId,
  };
}

module.exports = {
  createStateEngine,
  stateIdFromBooleans,
};
