import { isUniqueViolation } from "../core/db-errors";
import { BadRequestError, ConflictError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import { CreateLocationDto } from "./dtos/create-location.dto";
import { UpdateLocationDto } from "./dtos/update-location.dto";
import * as locationRepository from "./locations.repository";

// code is the only unique column on Location
const rethrowDuplicateCode = (err: unknown, code: string): never => {
  if (isUniqueViolation(err)) {
    throw new ConflictError(`A location with code ${code} already exists`);
  }

  throw err;
};

const listLocations = async () => locationRepository.findAll();

const getLocation = async (id: string) => {
  const location = await locationRepository.findById(id);

  if (!location) {
    throw new NotFoundError(`Location with ID ${id} not found`);
  }

  return location;
};

const createLocation = async (body: unknown) => {
  const { obj, errors } = await parseAndValidate(CreateLocationDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable location details", errors);
  }

  return locationRepository
    .insert(obj!)
    .catch((err) => rethrowDuplicateCode(err, obj!.code));
};

const updateLocation = async (id: string, body: unknown) => {
  const { obj, errors } = await parseAndValidate(UpdateLocationDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable location details", errors);
  }

  // Only the fields actually sent; undefined would otherwise be written as NULL
  const changes = Object.fromEntries(
    Object.entries(obj!).filter(([, value]) => value !== undefined),
  ) as Partial<UpdateLocationDto>;

  if (Object.keys(changes).length === 0) {
    throw new BadRequestError("Provide at least one field to update");
  }

  await getLocation(id);

  return locationRepository.update(id, changes);
};

export { createLocation, getLocation, listLocations, updateLocation };
