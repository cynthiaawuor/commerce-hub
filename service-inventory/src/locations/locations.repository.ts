import { db } from "../prisma/db";
import type { CreateLocationDto } from "./dtos/create-location.dto";
import type { UpdateLocationDto } from "./dtos/update-location.dto";

const Location = db.orm.public.Location;

// There are only ever a handful of locations, so they are returned unpaged
const findAll = async () =>
  Location.orderBy((location) => location.code.asc()).all();

// Returns null when no location has this id
const findById = async (id: string) => Location.where({ id }).first();

const findByCode = async (code: string) => Location.where({ code }).first();

const existsById = async (id: string) =>
  (await Location.where({ id }).select("id").first()) !== null;

const insert = async (location: CreateLocationDto) => Location.create(location);

const update = async (id: string, location: Partial<UpdateLocationDto>) =>
  Location.where({ id }).update(location);

export { existsById, findAll, findById, findByCode, insert, update };
