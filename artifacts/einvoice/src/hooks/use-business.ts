import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetBusinessProfile, 
  useCreateOrUpdateBusinessProfile, 
  useConnectFirs, 
  useSelectSubscription,
  getGetBusinessProfileQueryKey,
  getGetMeQueryKey
} from "@workspace/api-client-react";

export function useBusiness() {
  const queryClient = useQueryClient();
  
  const profileQuery = useGetBusinessProfile({ query: { retry: 1 } });

  const updateProfile = useCreateOrUpdateBusinessProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBusinessProfileQueryKey() });
      }
    }
  });

  const connectFirs = useConnectFirs({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBusinessProfileQueryKey() });
      }
    }
  });

  const selectSubscription = useSelectSubscription({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBusinessProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    }
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateProfile: updateProfile.mutateAsync,
    isUpdating: updateProfile.isPending,
    connectFirs: connectFirs.mutateAsync,
    isConnecting: connectFirs.isPending,
    selectSubscription: selectSubscription.mutateAsync,
    isSelectingSub: selectSubscription.isPending,
  };
}
