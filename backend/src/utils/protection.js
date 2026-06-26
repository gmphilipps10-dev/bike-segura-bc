const ALLOWED_RADIUS_METERS = [5, 10, 15, 20, 30, 50, 100];
const DEFAULT_RADIUS_METERS = 10;
const ALERT_CONFIRMATION_SECONDS = 10;

function normalizeRadiusMeters(value) {
  const radius = Number(value);
  if (ALLOWED_RADIUS_METERS.includes(radius)) return radius;
  return DEFAULT_RADIUS_METERS;
}

function isValidCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180;
}

function toRadians(value) {
  return Number(value) * Math.PI / 180;
}

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function equipmentHasActiveGps(equipment) {
  const tracking = `${equipment?.rastreamento || ''} ${equipment?.plataformaTag || ''}`.toLowerCase();
  return tracking.includes('gps') || tracking.includes('rastreador');
}

function evaluateProtectionCheck({
  distanceMeters,
  radiusMeters,
  outsideDetectedAt,
  alertTriggered,
  timestamp = new Date(),
}) {
  const now = new Date(timestamp);
  const outside = Number(distanceMeters) > Number(radiusMeters);

  if (!outside) {
    return {
      outside: false,
      status: outsideDetectedAt && !alertTriggered ? 'outside_cancelled' : 'inside',
      shouldClearOutsideAt: Boolean(outsideDetectedAt && !alertTriggered),
      shouldSetOutsideAt: false,
      shouldTriggerAlert: false,
      elapsedSeconds: 0,
    };
  }

  if (alertTriggered) {
    return {
      outside: true,
      status: 'already_alerted',
      shouldClearOutsideAt: false,
      shouldSetOutsideAt: false,
      shouldTriggerAlert: false,
      elapsedSeconds: outsideDetectedAt
        ? Math.max(0, (Number(now) - Number(new Date(outsideDetectedAt))) / 1000)
        : ALERT_CONFIRMATION_SECONDS,
    };
  }

  if (!outsideDetectedAt) {
    return {
      outside: true,
      status: 'outside_started',
      shouldClearOutsideAt: false,
      shouldSetOutsideAt: true,
      shouldTriggerAlert: false,
      elapsedSeconds: 0,
    };
  }

  const elapsedSeconds = Math.max(0, (Number(now) - Number(new Date(outsideDetectedAt))) / 1000);
  const shouldTriggerAlert = elapsedSeconds >= ALERT_CONFIRMATION_SECONDS;

  return {
    outside: true,
    status: shouldTriggerAlert ? 'alert_triggered' : 'outside_pending',
    shouldClearOutsideAt: false,
    shouldSetOutsideAt: false,
    shouldTriggerAlert,
    elapsedSeconds,
  };
}

module.exports = {
  ALLOWED_RADIUS_METERS,
  ALERT_CONFIRMATION_SECONDS,
  DEFAULT_RADIUS_METERS,
  normalizeRadiusMeters,
  isValidCoordinate,
  haversineDistanceMeters,
  equipmentHasActiveGps,
  evaluateProtectionCheck,
};
