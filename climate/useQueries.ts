import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ClimateData, UserQuery } from '../backend';
import { useInternetIdentity } from './useInternetIdentity';
import { toast } from 'sonner';

// Fetch all climate data
export function useClimateData() {
  const { actor, isFetching } = useActor();

  return useQuery<ClimateData[]>({
    queryKey: ['climateData'],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.getSortedClimateData();
      
      // If no data exists, generate some sample data
      if (data.length === 0) {
        const now = Date.now() * 1000000; // Convert to nanoseconds
        const sampleData: ClimateData[] = [];
        
        for (let i = 14; i >= 0; i--) {
          const timestamp = BigInt(now - (i * 24 * 60 * 60 * 1000 * 1000000));
          const co2 = BigInt(400 + Math.floor(Math.random() * 50));
          const temperature = 15 + Math.random() * 5;
          const aqi = BigInt(50 + Math.floor(Math.random() * 100));
          const renewable = 30 + Math.random() * 40;
          
          await actor.addClimateData(timestamp, co2, temperature, aqi, renewable);
          
          sampleData.push({
            timestamp,
            co2,
            temperature,
            airQualityIndex: aqi,
            renewableEnergyUsage: renewable
          });
        }
        
        return sampleData;
      }
      
      return data;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000, // 30 seconds
  });
}

// Fetch user queries
export function useUserQueries() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserQuery[]>({
    queryKey: ['userQueries', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal();
      return actor.getUserQueries(principal);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Save user query mutation
export function useSaveUserQuery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ userQueryText, response }: { userQueryText: string; response: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      if (!identity) throw new Error('User not authenticated');
      
      await actor.saveUserQuery(userQueryText, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userQueries'] });
    },
    onError: (error) => {
      console.error('Failed to save query:', error);
      toast.error('Failed to save conversation');
    },
  });
}

// Add climate data mutation
export function useAddClimateData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      timestamp: bigint;
      co2: bigint;
      temperature: number;
      aqi: bigint;
      renewable: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addClimateData(
        data.timestamp,
        data.co2,
        data.temperature,
        data.aqi,
        data.renewable
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climateData'] });
      toast.success('Climate data added successfully');
    },
    onError: (error) => {
      console.error('Failed to add climate data:', error);
      toast.error('Failed to add climate data');
    },
  });
}

