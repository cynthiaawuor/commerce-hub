// The services identify callers with x-user-id and x-user-role headers (there is no auth
// service yet). Keeping the choice here lets the dashboard act as a buyer or a manager,
// which matters because a buyer may not approve their own order.
const STORAGE_KEY = "procurement.current-user";

export type CurrentUser = {
  id: string;
  role: "BUYER" | "MANAGER";
};

const DEFAULT_USER: CurrentUser = { id: "buyer@commerce.test", role: "BUYER" };

export const loadCurrentUser = (): CurrentUser => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CurrentUser) : DEFAULT_USER;
  } catch {
    // A private window or blocked storage should not break the app
    return DEFAULT_USER;
  }
};

export const saveCurrentUser = (user: CurrentUser) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Not being able to remember the choice is survivable
  }
};

export { DEFAULT_USER };
