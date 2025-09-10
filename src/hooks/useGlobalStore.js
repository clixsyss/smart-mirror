import { useState, useEffect } from 'react';
import { globalStore } from '../stores/globalStore';

export const useGlobalStore = () => {
  const [state, setState] = useState(globalStore.getState());

  useEffect(() => {
    const unsubscribe = globalStore.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    state,
    actions: {
      initialize: globalStore.initialize.bind(globalStore),
      refreshAll: globalStore.refreshAll.bind(globalStore),
      fetchWeather: globalStore.fetchWeather.bind(globalStore),
      fetchNews: globalStore.fetchNews.bind(globalStore),
      fetchQuote: globalStore.fetchQuote.bind(globalStore),
      fetchSmartHomeData: globalStore.fetchSmartHomeData.bind(globalStore),
      addMessage: globalStore.addMessage.bind(globalStore),
      setTyping: globalStore.setTyping.bind(globalStore),
      setRecording: globalStore.setRecording.bind(globalStore),
      clearMessages: globalStore.clearMessages.bind(globalStore)
    }
  };
};

export default useGlobalStore;
