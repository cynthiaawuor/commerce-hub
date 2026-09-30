import * as locationRepository from "../locations/locations.repository";
import * as productRepository from "../products/products.repository";
import { PermanentEventError } from "./outbox-errors";

// Other services quote whatever identifier they were given: sometimes our id, sometimes
// the SKU ("MAIZE-2KG") or the location code ("WH-MAIN"). Both are looked up here, so the
// rest of the service only ever works with our ids.
//
// An identifier matching nothing is a contract violation, not a passing fault: retrying
// will not make the product exist. It is dead-lettered so someone fixes the reference,
// rather than stock quietly going unrecorded.
const findProductId = async (idOrSku: string) => {
  const byId = await productRepository.findById(idOrSku);

  if (byId) {
    return byId.id;
  }

  const bySku = await productRepository.findBySku(idOrSku.toUpperCase());

  if (!bySku) {
    throw new PermanentEventError(`No product matches "${idOrSku}" by id or SKU`);
  }

  return bySku.id;
};

const findLocationId = async (idOrCode: string) => {
  const byId = await locationRepository.findById(idOrCode);

  if (byId) {
    return byId.id;
  }

  const byCode = await locationRepository.findByCode(idOrCode.toUpperCase());

  if (!byCode) {
    throw new PermanentEventError(`No location matches "${idOrCode}" by id or code`);
  }

  return byCode.id;
};

export { findLocationId, findProductId };
