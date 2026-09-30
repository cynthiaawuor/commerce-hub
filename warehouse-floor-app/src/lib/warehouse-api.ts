import type { PutawayTask, ShelfLocation } from "../types/warehouse";
import { apiRequest } from "./api-client";

export const getPendingTasks = async () =>
  (await apiRequest<{ data: PutawayTask[] }>("/putaway-tasks")).data;

export const getShelfLocations = async () =>
  (await apiRequest<{ data: ShelfLocation[] }>("/shelf-locations")).data;

// Leaving shelfCode out puts the goods where the service suggested
export const completeTask = async ({ id, shelfCode }: { id: string; shelfCode?: string }) =>
  (
    await apiRequest<{ data: PutawayTask }>(`/putaway-tasks/${id}/complete`, {
      method: "POST",
      body: shelfCode ? { shelfCode } : {},
    })
  ).data;
