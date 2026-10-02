import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TillPage } from "./pages/TillPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TillPage />
    </QueryClientProvider>
  );
}
