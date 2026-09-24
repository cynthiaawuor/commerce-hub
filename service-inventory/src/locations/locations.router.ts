import { Router } from "express";
import * as locationController from "./controllers/locations.controller";

const locationsRouter: Router = Router();

locationsRouter.get("/", locationController.listLocations);
locationsRouter.post("/", locationController.createLocation);
locationsRouter.get("/:id", locationController.getLocation);
locationsRouter.patch("/:id", locationController.updateLocation);

export default locationsRouter;
