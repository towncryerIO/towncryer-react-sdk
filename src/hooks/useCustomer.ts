import { useTowncryer } from '../context/TowncryerContext';

/**
 * Hook for creating customers in the Towncryer React SDK
 */
export const useCustomer = () => {
  const { createCustomer, lastCreatedCustomer, createCustomerStatus, error, clearError } = useTowncryer();

  return {
    createCustomer,
    lastCreatedCustomer,

    // Status
    createCustomerStatus,

    // Error handling
    error,
    clearError,
  };
};
