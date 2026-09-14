import type { Coordinate } from "@movo/shared";
export function gpsDistance(a: Coordinate, b: Coordinate) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function durationSeconds(
  s: {
    startedAt: string;
    pauses: { startedAt: number; endedAt: number }[];
    pauseStartedAt: number | null;
  },
  now = Date.now(),
) {
  const paused =
    s.pauses.reduce((n, p) => n + p.endedAt - p.startedAt, 0) +
    (s.pauseStartedAt ? now - s.pauseStartedAt : 0);
  return Math.max(
    0,
    Math.floor((now - Date.parse(s.startedAt) - paused) / 1000),
  );
}
export const formatTime = (n: number) =>
  `${Math.floor(n / 3600) ? `${Math.floor(n / 3600)}:` : ""}${String(Math.floor(n / 60) % 60).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
export function formatPace(seconds: number, meters: number) {
  return meters >= 10 ? `${formatTime(seconds / (meters / 1000))} /km` : "—";
}
