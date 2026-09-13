/**
 * The layer that has actually broken.
 *
 * Audit §2. Thirteen modules were never imported by a test and they included
 * every hook — while 633 assertions covered pure logic. Both faults reported
 * from the browser during the remediation were in that layer, and both traced
 * through `useClock`: a hydration mismatch from reading the wall clock during
 * render, and a `RangeError: Invalid time value` from `undefined` slipping
 * past a `=== null` guard.
 *
 * These run the hooks' own machinery — the external-store snapshots, the
 * storage round trips, the parsing — without React. That is deliberate: the
 * defects were in the snapshot and guard semantics, not in rendering, and a
 * renderer would only hide them behind more moving parts.
 */
import assert from "node:assert/strict";
import test from "node:test";

/** A localStorage/sessionStorage stand-in, including the ways they fail. */
function fakeStorage({ throwOnRead = false, throwOnWrite = false } = {}) {
  const map = new Map();
  return {
    getItem(key) {
      if (throwOnRead) throw new DOMException("blocked", "SecurityError");
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      if (throwOnWrite) throw new DOMException("quota", "QuotaExceededError");
      map.set(key, String(value));
    },
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

/**
 * `async` and awaited, which the first version of this helper was not: it
 * called `run()`, got a promise back, and restored `window` in its `finally`
 * before the body had run. Three tests failed against a window that was
 * already gone.
 */
async function withWindow(storage, run) {
  const previous = globalThis.window;
  globalThis.window = {
    localStorage: storage,
    sessionStorage: storage,
    addEventListener() {},
    removeEventListener() {},
    setInterval: () => 0,
    clearInterval() {},
  };
  try {
    return await run();
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
}

// ------------------------------------------------------------- stored key

const { FIFTHS } = await import("../lib/fretlab/theory.ts");

test("the stored key survives a round trip and rejects nonsense", async () => {
  const storage = fakeStorage();
  await withWindow(storage, async () => {
    const { readStoredKey, writeStoredKey } = await import(
      "../lib/fretlab/useStoredKey.ts"
    );
    assert.equal(readStoredKey(), "G", "the default key");
    writeStoredKey("Eb");
    assert.equal(readStoredKey(), "Eb");

    // A key that is not a key — hand-edited storage, or an older build.
    storage.setItem("fretlab-key", "H");
    assert.equal(readStoredKey(), "G", "an unknown key must fall back");
    storage.setItem("fretlab-key", "");
    assert.equal(readStoredKey(), "G");
  });
});

test("blocked storage does not take the app down", async () => {
  // Private windows and "block site data" both throw on access rather than
  // returning null, which is the case a try/catch exists for.
  await withWindow(fakeStorage({ throwOnRead: true }), async () => {
    const { readStoredKey } = await import("../lib/fretlab/useStoredKey.ts");
    assert.equal(readStoredKey(), "G");
  });
  await withWindow(fakeStorage({ throwOnWrite: true }), async () => {
    const { writeStoredKey } = await import("../lib/fretlab/useStoredKey.ts");
    assert.doesNotThrow(() => writeStoredKey("C"));
  });
});

test("every key the picker offers is one the store accepts", async () => {
  await withWindow(fakeStorage(), async () => {
    const { readStoredKey, writeStoredKey } = await import(
      "../lib/fretlab/useStoredKey.ts"
    );
    for (const key of FIFTHS) {
      writeStoredKey(key);
      assert.equal(readStoredKey(), key, `${key} did not survive storage`);
    }
  });
});

// ----------------------------------------------------------------- clock

test("the clock's server snapshot is stable and carries no time", async () => {
  const { clockFromStamp, serverStamp } = await import("../lib/fretlab/useClock.ts");
  // The hydration fault: the server rendered a week of day labels and the
  // browser rendered a different one. The server must carry no clock at all.
  assert.equal(serverStamp(), "");
  const clock = clockFromStamp("");
  assert.equal(clock.now, null, "the server must not supply a clock");
  assert.equal(clock.date, null);
  assert.equal(clock.greeting, "");
});

test("the clock's snapshot is equal by value within the hour", async () => {
  const { stampFrom } = await import("../lib/fretlab/useClock.ts");
  // useSyncExternalStore re-reads on every render and compares by identity, so
  // a snapshot that is a fresh object each time loops forever.
  const at = new Date(2026, 8, 20, 14, 5).getTime();
  const later = new Date(2026, 8, 20, 14, 59).getTime();
  const nextHour = new Date(2026, 8, 20, 15, 1).getTime();
  assert.equal(stampFrom(at), stampFrom(later), "the stamp changed within an hour");
  assert.notEqual(stampFrom(at), stampFrom(nextHour));
  assert.equal(typeof stampFrom(at), "string");
});

test("a clock built from a stamp reports the hour it was given", async () => {
  const { clockFromStamp, stampFrom } = await import("../lib/fretlab/useClock.ts");
  for (const [hour, greeting] of [[8, "Good morning"], [14, "Good afternoon"], [21, "Good evening"]]) {
    const clock = clockFromStamp(stampFrom(new Date(2026, 8, 20, hour).getTime()));
    assert.equal(clock.greeting, greeting);
    assert.equal(typeof clock.now, "number");
    assert.ok(Number.isFinite(clock.now), "the clock handed out a NaN");
  }
});

test("the clock never hands out a value that fails the date helpers", async () => {
  // The second crash: `now` arrived as undefined and reached
  // new Date(undefined).toISOString(). A clock is a finite number or null,
  // and never anything in between.
  const { clockFromStamp, stampFrom } = await import("../lib/fretlab/useClock.ts");
  const { summarise } = await import("../lib/api/progress.ts");
  for (const stamp of ["", "nonsense", "2026-8", stampFrom(Date.now())]) {
    const clock = clockFromStamp(stamp);
    assert.ok(
      clock.now === null || Number.isFinite(clock.now),
      `stamp "${stamp}" produced now=${clock.now}`,
    );
    if (typeof clock.now === "number") {
      assert.doesNotThrow(() => summarise([], clock.now));
    }
  }
});

// --------------------------------------------------------------- last run

test("a finished run survives storage and a broken one does not", async () => {
  await withWindow(fakeStorage(), async () => {
    const { saveLastRun, readLastRun } = await import("../lib/fretlab/lastRun.ts");
    assert.equal(readLastRun(), null, "nothing stored yet");

    const run = {
      routineId: "one-key-deep",
      routineName: "One key, deep",
      musicKey: "G",
      finishedAt: new Date().toISOString(),
      steps: [{ drillId: "thirds", name: "Thirds", seconds: 240, bpm: 76 }],
      saveError: null,
    };
    saveLastRun(run);
    assert.deepEqual(readLastRun(), run);

    // Storage is user-writable and outlives a deploy.
    window.sessionStorage.setItem("fretlab-last-run", "{not json");
    assert.equal(readLastRun(), null, "malformed storage should read as nothing");
    window.sessionStorage.setItem("fretlab-last-run", JSON.stringify({ steps: [] }));
    assert.equal(readLastRun(), null, "a run with no steps is not a run");
  });
});

// --------------------------------------------------------------- elapsed

test("the practice clock reads as minutes and seconds", async () => {
  const { clockLabel } = await import("../lib/fretlab/useElapsed.ts");
  assert.equal(clockLabel(0), "0:00");
  assert.equal(clockLabel(9), "0:09");
  assert.equal(clockLabel(60), "1:00");
  assert.equal(clockLabel(245), "4:05", "seconds must be zero-padded");
  assert.equal(clockLabel(3600), "60:00", "an hour keeps counting in minutes");
  // A timer that has not started, and a float from a drifting interval.
  assert.equal(clockLabel(-5), "0:00", "a negative clock is not a countdown");
  assert.equal(clockLabel(12.7), "0:12");
});

// ------------------------------------------------- degrees, used by 3 screens

test("every degree of the key is described, in every key", async () => {
  const { degreesInKey, relativeMinor } = await import("../lib/fretlab/degrees.ts");
  for (const key of FIFTHS) {
    const degrees = degreesInKey(key);
    assert.equal(degrees.length, 7, `${key} has ${degrees.length} degrees`);
    assert.deepEqual(
      degrees.map((d) => d.number),
      [1, 2, 3, 4, 5, 6, 7],
    );
    for (const degree of degrees) {
      assert.ok(degree.note, `${key} degree ${degree.number} has no note name`);
    }
    // Seven letters, each used once — the spelling rule the whole app rests on.
    const letters = degrees.map((d) => d.note[0]);
    assert.equal(new Set(letters).size, 7, `${key} repeats a letter: ${letters.join("")}`);
    // Every degree carries the chord built on it, which the key map renders.
    for (const degree of degrees) assert.ok(degree.chord, `${key} degree ${degree.number} has no chord`);
    // The relative minor is the sixth degree, always.
    assert.equal(relativeMinor(key), degrees[5].note, `${key}'s relative minor`);
  }
});
