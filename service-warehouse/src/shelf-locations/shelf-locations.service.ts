import type { CurrentUser } from "../core/current-user";
import { isUniqueViolation } from "../core/db-errors";
import { BadRequestError, ConflictError, ForbiddenError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import { CreateShelfLocationDto } from "./dtos/create-shelf-location.dto";
import * as shelfLocationRepository from "./shelf-locations.repository";

// Each shelf carries how much room it has left, which is what a worker needs to know
const withFreeUnits = <T extends { capacityUnits: number; occupiedUnits: number }>(
  shelf: T,
) => ({ ...shelf, freeUnits: shelf.capacityUnits - shelf.occupiedUnits });

const listShelfLocations = async () =>
  (await shelfLocationRepository.findAll()).map(withFreeUnits);

const createShelfLocation = async (body: unknown, user: CurrentUser) => {
  if (user.role !== "SUPERVISOR") {
    throw new ForbiddenError("Only a supervisor can add shelf locations");
  }

  const { obj, errors } = await parseAndValidate(CreateShelfLocationDto, body);

  if (errors) {
    throw new BadRequestError("Invalid shelf location", errors);
  }

  try {
    return withFreeUnits(await shelfLocationRepository.insert(obj!));
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError(`Shelf ${obj!.code} already exists`);
    }
    throw err;
  }
};

export { createShelfLocation, listShelfLocations };
