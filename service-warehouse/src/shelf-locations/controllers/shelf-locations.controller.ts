import type { Request, Response } from "express";
import { getCurrentUser } from "../../core/current-user";
import * as shelfLocationService from "../shelf-locations.service";

// Every shelf with what is on it and how much room is left
const listShelfLocations = async (_req: Request, res: Response) => {
  res.status(200).json({ data: await shelfLocationService.listShelfLocations() });
};

const createShelfLocation = async (req: Request, res: Response) => {
  const shelf = await shelfLocationService.createShelfLocation(
    req.body,
    getCurrentUser(req),
  );

  res.status(201).json({ message: "Shelf location added", data: shelf });
};

export { createShelfLocation, listShelfLocations };
