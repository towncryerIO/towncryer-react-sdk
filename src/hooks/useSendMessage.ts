import { useTowncryer } from '../context/TowncryerContext';

/**
 * Hook for sending messages (email, SMS, push) in the Towncryer React SDK
 */
export const useSendMessage = () => {
  const { sendMessages, lastSentMessagesInfo, sendMessagesStatus, error, clearError } = useTowncryer();

  return {
    sendMessages,
    lastSentMessagesInfo,

    // Status
    sendMessagesStatus,

    // Error handling
    error,
    clearError,
  };
};
