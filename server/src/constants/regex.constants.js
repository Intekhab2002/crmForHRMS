export const REGEX = Object.freeze({
  EMAIL:
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  MOBILE:
    /^[6-9]\d{9}$/,

  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/,

  UUID:
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
});