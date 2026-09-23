import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Express, Request, Response } from "express";

// The spec is the one in contracts/, shared with every other service, rather than a copy.
const SPEC_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../contracts/openapi/procurement.yaml",
);

// Swagger UI comes from a CDN, so documenting the API costs no runtime dependency.
const page = `<!doctype html>
<html>
  <head>
    <title>Procurement API</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css" />
  </head>
  <body>
    <div id="swagger"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js"></script>
    <script>
      SwaggerUIBundle({ url: "/procurement-api/docs/openapi.yaml", dom_id: "#swagger" });
    </script>
  </body>
</html>`;

const mountDocs = (app: Express) => {
  app.get("/procurement-api/docs", (_req: Request, res: Response) => {
    res.type("html").send(page);
  });

  app.get("/procurement-api/docs/openapi.yaml", (_req: Request, res: Response) => {
    try {
      res.type("yaml").send(readFileSync(SPEC_PATH, "utf8"));
    } catch {
      res
        .status(404)
        .json({ error: { message: "OpenAPI specification not found" } });
    }
  });
};

export { mountDocs };
