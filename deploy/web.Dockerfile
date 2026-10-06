# Caddy with every frontend built into it. Built from the repository root:
#   docker build -f deploy/web.Dockerfile -t commerce/web .
# Phase flags are baked in at build time; turn one off with
#   --build-arg VITE_FEATURE_POS=false

FROM node:22-alpine AS build
ARG VITE_FEATURE_VENDOR_MANAGEMENT=true \
    VITE_FEATURE_PROCUREMENT=true \
    VITE_FEATURE_INVENTORY=true \
    VITE_FEATURE_RECEIVING=true \
    VITE_FEATURE_WAREHOUSE=true \
    VITE_FEATURE_POS=true \
    VITE_FEATURE_SALES_AUDIT=true \
    VITE_FEATURE_FINANCIALS=true
# Vite reads VITE_* from the environment, so the apps need no .env file here
ENV VITE_FEATURE_VENDOR_MANAGEMENT=$VITE_FEATURE_VENDOR_MANAGEMENT \
    VITE_FEATURE_PROCUREMENT=$VITE_FEATURE_PROCUREMENT \
    VITE_FEATURE_INVENTORY=$VITE_FEATURE_INVENTORY \
    VITE_FEATURE_RECEIVING=$VITE_FEATURE_RECEIVING \
    VITE_FEATURE_WAREHOUSE=$VITE_FEATURE_WAREHOUSE \
    VITE_FEATURE_POS=$VITE_FEATURE_POS \
    VITE_FEATURE_SALES_AUDIT=$VITE_FEATURE_SALES_AUDIT \
    VITE_FEATURE_FINANCIALS=$VITE_FEATURE_FINANCIALS

WORKDIR /build
COPY vendor-portal/ vendor-portal/
COPY procurement-dashboard/ procurement-dashboard/
COPY inventory-control-center/ inventory-control-center/
COPY receiving-app/ receiving-app/
COPY warehouse-floor-app/ warehouse-floor-app/
COPY pos-till-app/ pos-till-app/
COPY sales-audit-app/ sales-audit-app/
COPY financials-app/ financials-app/

RUN set -e; for app in vendor-portal procurement-dashboard inventory-control-center \
    receiving-app warehouse-floor-app pos-till-app sales-audit-app financials-app; do \
    echo "Building $app"; \
    (cd "$app" && npm ci --no-audit --no-fund && npm run build); \
    done

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY deploy/landing/ /srv/landing/
COPY --from=build /build/vendor-portal/dist /srv/vendor-portal
COPY --from=build /build/procurement-dashboard/dist /srv/procurement-dashboard
COPY --from=build /build/inventory-control-center/dist /srv/inventory-control-center
COPY --from=build /build/receiving-app/dist /srv/receiving-app
COPY --from=build /build/warehouse-floor-app/dist /srv/warehouse-floor-app
COPY --from=build /build/pos-till-app/dist /srv/pos-till-app
COPY --from=build /build/sales-audit-app/dist /srv/sales-audit-app
COPY --from=build /build/financials-app/dist /srv/financials-app
