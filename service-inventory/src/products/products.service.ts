import { isUniqueViolation } from "../core/db-errors";
import { BadRequestError, ConflictError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import { CreateProductDto } from "./dtos/create-product.dto";
import { ListProductsQueryDto } from "./dtos/list-products-query.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";
import * as productRepository from "./products.repository";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

// sku is the only unique column on Product, so a unique violation means a duplicate SKU.
const rethrowDuplicateSku = (err: unknown, sku: string): never => {
  if (isUniqueViolation(err)) {
    throw new ConflictError(`A product with SKU ${sku} already exists`);
  }

  throw err;
};

const listProducts = async (query: unknown = {}) => {
  const { obj, errors } = await parseAndValidate(ListProductsQueryDto, query);

  if (errors) {
    throw new BadRequestError("Unprocessable list query", errors);
  }

  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, search, isActive } = obj!;
  const filters = {
    search,
    ...(isActive === undefined ? {} : { isActive: isActive === "true" }),
  };

  const [data, total] = await Promise.all([
    productRepository.findPage(filters, (page - 1) * limit, limit),
    productRepository.count(filters),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getProduct = async (id: string) => {
  const product = await productRepository.findById(id);

  if (!product) {
    throw new NotFoundError(`Product with ID ${id} not found`);
  }

  return product;
};

const getProductBySku = async (sku: string) => {
  const product = await productRepository.findBySku(sku.toUpperCase());

  if (!product) {
    throw new NotFoundError(`Product with SKU ${sku} not found`);
  }

  return product;
};

// A new product has no stock anywhere: stock level rows appear when stock first
// arrives at a location, and a missing row reads as zero.
const createProduct = async (body: unknown) => {
  const { obj, errors } = await parseAndValidate(CreateProductDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable product details", errors);
  }

  return productRepository
    .insert(obj!)
    .catch((err) => rethrowDuplicateSku(err, obj!.sku));
};

const updateProduct = async (id: string, body: unknown) => {
  const { obj, errors } = await parseAndValidate(UpdateProductDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable product details", errors);
  }

  // Only the fields actually sent; undefined would otherwise be written as NULL
  const changes = Object.fromEntries(
    Object.entries(obj!).filter(([, value]) => value !== undefined),
  ) as Partial<UpdateProductDto>;

  if (Object.keys(changes).length === 0) {
    throw new BadRequestError("Provide at least one field to update");
  }

  await getProduct(id);

  return productRepository.update(id, changes);
};

export {
  createProduct,
  getProduct,
  getProductBySku,
  listProducts,
  updateProduct,
};
