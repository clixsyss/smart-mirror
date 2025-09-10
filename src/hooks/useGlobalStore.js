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
      reset: globalStore.reset.bind(globalStore),
      refreshAll: globalStore.refreshAll.bind(globalStore),
      fetchWeather: globalStore.fetchWeather.bind(globalStore),
      fetchNews: globalStore.fetchNews.bind(globalStore),
      fetchQuote: globalStore.fetchQuote.bind(globalStore),
      fetchSmartHomeData: globalStore.fetchSmartHomeData.bind(globalStore),
      addMessage: globalStore.addMessage.bind(globalStore),
      setTyping: globalStore.setTyping.bind(globalStore),
      setRecording: globalStore.setRecording.bind(globalStore),
      clearMessages: globalStore.clearMessages.bind(globalStore),
      // Settings actions
      updateSettings: globalStore.updateSettings.bind(globalStore),
      updateWeatherLocation: globalStore.updateWeatherLocation.bind(globalStore),
      updateClockFormat: globalStore.updateClockFormat.bind(globalStore),
      getTimezoneFromLocation: globalStore.getTimezoneFromLocation.bind(globalStore),
      testWeatherAPI: globalStore.testWeatherAPI.bind(globalStore),
      updateDisplaySetting: globalStore.updateDisplaySetting.bind(globalStore),
      updateDeviceSelection: globalStore.updateDeviceSelection.bind(globalStore),
      // Smart home actions
      toggleLight: globalStore.toggleLight.bind(globalStore),
      setLightBrightness: globalStore.setLightBrightness.bind(globalStore),
      setClimateState: globalStore.setClimateState.bind(globalStore),
      setClimateTemperature: globalStore.setClimateTemperature.bind(globalStore),
      setClimateMode: globalStore.setClimateMode.bind(globalStore),
      // Assistant actions
      sendAssistantMessage: globalStore.sendAssistantMessage.bind(globalStore)
    }
  };
};

export default useGlobalStore;
