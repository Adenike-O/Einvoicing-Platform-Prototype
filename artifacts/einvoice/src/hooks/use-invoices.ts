import { useQueryClient } from "@tanstack/react-query";
import { 
  useListInvoices, 
  useCreateInvoice, 
  useGetInvoice,
  useUpdateInvoice,
  useSubmitInvoice,
  useValidateInvoice,
  getListInvoicesQueryKey,
  getGetInvoiceQueryKey
} from "@workspace/api-client-react";

export function useInvoices() {
  const queryClient = useQueryClient();
  const invoicesQuery = useListInvoices();

  const createInvoice = useCreateInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      }
    }
  });

  return {
    invoices: invoicesQuery.data || [],
    isLoading: invoicesQuery.isLoading,
    createInvoice: createInvoice.mutateAsync,
    isCreating: createInvoice.isPending
  };
}

export function useInvoice(id: number) {
  const queryClient = useQueryClient();
  const invoiceQuery = useGetInvoice(id, { query: { enabled: !!id } });

  const updateInvoice = useUpdateInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      }
    }
  });

  const submitInvoice = useSubmitInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      }
    }
  });

  const validateInvoice = useValidateInvoice();

  return {
    invoice: invoiceQuery.data,
    isLoading: invoiceQuery.isLoading,
    updateInvoice: updateInvoice.mutateAsync,
    isUpdating: updateInvoice.isPending,
    submitInvoice: submitInvoice.mutateAsync,
    isSubmitting: submitInvoice.isPending,
    validateInvoice: validateInvoice.mutateAsync,
    isValidating: validateInvoice.isPending
  };
}
