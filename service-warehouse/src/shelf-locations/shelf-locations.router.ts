import { Router } from "express";
import * as shelfLocationController from "./controllers/shelf-locations.controller";

const shelfLocationsRouter: Router = Router();

shelfLocationsRouter.get("/", shelfLocationController.listShelfLocations);
shelfLocationsRouter.post("/", shelfLocationController.createShelfLocation);

export default shelfLocationsRouter;
