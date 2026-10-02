import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReceivingPage } from "./pages/ReceivingPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
});

// A single screen, so no router: the dock needs one thing and it should be the first thing
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReceivingPage />
    </QueryClientProvider>
  );
}
