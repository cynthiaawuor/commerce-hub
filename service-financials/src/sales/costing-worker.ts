import { config } from "../core/config";
import { costWaitingSales } from "./sales.service";

// Sales whose cost could not be booked when they arrived (Inventory was down) are
// tried again here, so the books catch up by themselves once Inventory is back.

let timer: NodeJS.Timeout | null = null;
let running = false;

const tick = async () => {
  // A slow pass must not overlap the next one
  if (running) {
    return;
  }

  running = true;

  try {
    const costed = await costWaitingSales();

    if (costed > 0) {
      console.log(`Booked the cost of ${costed} sale(s)`);
    }
  } catch (err) {
    console.error("Costing pass failed:", err);
  } finally {
    running = false;
  }
};

const startCostingWorker = () => {
  if (timer) {
    return;
  }

  timer = setInterval(tick, config.costingPollMs);
  console.log(`Costing worker checking every ${config.costingPollMs}ms`);
};

const stopCostingWorker = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

export { startCostingWorker, stopCostingWorker };
