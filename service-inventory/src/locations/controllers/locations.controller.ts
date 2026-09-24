import type { Request, Response } from "express";
import * as locationService from "../locations.service";

type IdParams = { id: string };

const listLocations = async (_req: Request, res: Response) => {
  res.status(200).json({ data: await locationService.listLocations() });
};

const getLocation = async (req: Request<IdParams>, res: Response) => {
  res.status(200).json({ data: await locationService.getLocation(req.params.id) });
};

const createLocation = async (req: Request, res: Response) => {
  const location = await locationService.createLocation(req.body);

  res
    .status(201)
    .json({ message: "Location created successfully", data: location });
};

const updateLocation = async (req: Request<IdParams>, res: Response) => {
  const location = await locationService.updateLocation(req.params.id, req.body);

  res
    .status(200)
    .json({ message: "Location updated successfully", data: location });
};

export { createLocation, getLocation, listLocations, updateLocation };
