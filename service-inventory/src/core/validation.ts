import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";

type ErrorEntries = Record<string, string[]>;

export default async function parseAndValidate<T extends object>(
  cls: ClassConstructor<T>,
  obj: any,
): Promise<{ obj: T | null; errors: ErrorEntries | null }> {
  const dto = plainToInstance(cls, obj ?? {});

  // whitelist strips anything the DTO does not declare, so the DTO is an allow-list:
  // a client cannot smuggle in fields the service owns (averageCostCents, isActive).
  const errors = await validate(dto, { whitelist: true });

  if (errors.length == 0) {
    return { obj: dto, errors: null };
  }

  return {
    obj: null,
    errors: errors.reduce((acc, curr) => {
      acc[curr.property] = Object.values(curr.constraints ?? {});

      return acc;
    }, {} as ErrorEntries),
  };
}
