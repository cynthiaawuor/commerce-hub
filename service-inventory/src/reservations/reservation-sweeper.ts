import { config } from "../core/config";
import { sweepExpiredReservations } from "./reservations.service";

let timer: NodeJS.Timeout | null = null;
let running = false;

// Overlapping sweeps would resolve the same reservation twice, so a pass is skipped
// while the previous one is still going.
const tick = async () => {
  if (running) {
    return;
  }

  running = true;

  try {
    await sweepExpiredReservations();
  } catch (err) {
    console.error("Reservation sweep failed:", err);
  } finally {
    running = false;
  }
};

const startReservationSweeper = () => {
  timer = setInterval(tick, config.reservationSweepMs);
  // Don't hold the process open just for the sweep timer
  timer.unref();
  console.log(`Reservation sweeper running every ${config.reservationSweepMs}ms`);
};

const stopReservationSweeper = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

export { startReservationSweeper, stopReservationSweeper };
