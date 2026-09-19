import { useTowncryer } from '../context/TowncryerContext';

/**
 * Hook for publishing events in the Towncryer React SDK
 */
export const useEvents = () => {
  const { publishEvent, lastPublishedEvent, publishEventStatus, error, clearError } = useTowncryer();

  return {
    publishEvent,
    lastPublishedEvent,

    // Status
    publishEventStatus,

    // Error handling
    error,
    clearError,
  };
};
