import { describe, it, expect } from "vitest";
import {
  gpsDistance,
  durationSeconds,
  formatPace,
  formatTime,
} from "../src/services/tracking/math";
describe("recording calculations", () => {
  it("measures known latitude distance", () => {
    const a = { latitude: 0, longitude: 0, timestamp: 1, accuracy: 5 };
    expect(gpsDistance(a, { ...a, latitude: 1 })).toBeCloseTo(111194.927, 1);
  });
  it("excludes completed and current pauses", () => {
    expect(
      durationSeconds(
        {
          startedAt: "2026-09-14T10:00:00Z",
          pauses: [
            {
              startedAt: Date.parse("2026-09-14T10:02:00Z"),
              endedAt: Date.parse("2026-09-14T10:04:00Z"),
            },
          ],
          pauseStartedAt: Date.parse("2026-09-14T10:08:00Z"),
        },
        Date.parse("2026-09-14T10:10:00Z"),
      ),
    ).toBe(360);
  });
  it("does not invent pace before enough GPS is recorded", () => {
    expect(formatPace(60, 0)).toBe("—");
    expect(formatPace(600, 1000)).toBe("10:00 /km");
  });
  it("formats hour-long sessions", () => {
    expect(formatTime(3661)).toBe("1:01:01");
  });
});
