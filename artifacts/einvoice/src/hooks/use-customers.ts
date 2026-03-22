import { useQueryClient } from "@tanstack/react-query";
import { 
  useListCustomers, 
  useCreateCustomer, 
  useGetCustomer,
  useLookupCustomerByTin,
  getListCustomersQueryKey
} from "@workspace/api-client-react";

export function useCustomers() {
  const queryClient = useQueryClient();
  const customersQuery = useListCustomers();

  const createCustomer = useCreateCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      }
    }
  });

  return {
    customers: customersQuery.data || [],
    isLoading: customersQuery.isLoading,
    createCustomer: createCustomer.mutateAsync,
    isCreating: createCustomer.isPending
  };
}

export function useCustomer(id: number) {
  return useGetCustomer(id, { query: { enabled: !!id } });
}

export function useTinLookup(tin: string) {
  return useLookupCustomerByTin(tin, { 
    query: { 
      enabled: tin.length >= 10,
      retry: false
    } 
  });
}
