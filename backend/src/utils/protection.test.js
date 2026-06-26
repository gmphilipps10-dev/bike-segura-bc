const assert = require('assert');
const {
  haversineDistanceMeters,
  evaluateProtectionCheck,
} = require('./protection');

const distance = haversineDistanceMeters(-26.9925, -48.6356, -26.9926, -48.6356);
assert(distance > 10 && distance < 13, 'Haversine deve calcular cerca de 11m para 0.0001 grau de latitude');

const now = new Date('2026-06-26T10:00:00.000Z');
const outsideStarted = evaluateProtectionCheck({
  distanceMeters: 12,
  radiusMeters: 10,
  outsideDetectedAt: null,
  alertTriggered: false,
  timestamp: now,
});
assert.strictEqual(outsideStarted.status, 'outside_started');
assert.strictEqual(outsideStarted.shouldSetOutsideAt, true);
assert.strictEqual(outsideStarted.shouldTriggerAlert, false);

const outsidePending = evaluateProtectionCheck({
  distanceMeters: 12,
  radiusMeters: 10,
  outsideDetectedAt: new Date('2026-06-26T09:59:55.000Z'),
  alertTriggered: false,
  timestamp: now,
});
assert.strictEqual(outsidePending.status, 'outside_pending');
assert.strictEqual(outsidePending.shouldTriggerAlert, false);

const outsideConfirmed = evaluateProtectionCheck({
  distanceMeters: 12,
  radiusMeters: 10,
  outsideDetectedAt: new Date('2026-06-26T09:59:49.000Z'),
  alertTriggered: false,
  timestamp: now,
});
assert.strictEqual(outsideConfirmed.status, 'alert_triggered');
assert.strictEqual(outsideConfirmed.shouldTriggerAlert, true);

const returnedInside = evaluateProtectionCheck({
  distanceMeters: 4,
  radiusMeters: 10,
  outsideDetectedAt: new Date('2026-06-26T09:59:55.000Z'),
  alertTriggered: false,
  timestamp: now,
});
assert.strictEqual(returnedInside.status, 'outside_cancelled');
assert.strictEqual(returnedInside.shouldClearOutsideAt, true);

const repeatedAlert = evaluateProtectionCheck({
  distanceMeters: 20,
  radiusMeters: 10,
  outsideDetectedAt: new Date('2026-06-26T09:59:00.000Z'),
  alertTriggered: true,
  timestamp: now,
});
assert.strictEqual(repeatedAlert.status, 'already_alerted');
assert.strictEqual(repeatedAlert.shouldTriggerAlert, false);

console.log('Protection logic tests passed.');
