import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FinancialsPage } from "./pages/FinancialsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
});

// A single page with tabs, so no router
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FinancialsPage />
    </QueryClientProvider>
  );
}
