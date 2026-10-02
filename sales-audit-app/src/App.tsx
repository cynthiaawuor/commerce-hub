import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SalesAuditPage } from "./pages/SalesAuditPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
});

// A single page with two tabs, so no router
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SalesAuditPage />
    </QueryClientProvider>
  );
}
