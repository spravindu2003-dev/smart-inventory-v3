import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'onboarding_state';

const defaultState = {
  status: 'not_started',
  currentStep: 1,
  businessName: '',
  businessCategory: '',
  firstProductCreated: false,
  firstSaleCompleted: false,
  tourCompleted: false,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(defaultState);

  useEffect(() => {
    if (user && user.role === 'owner') {
      const saved = loadState();
      if (saved) {
        setState(saved);
      }
    } else {
      setState({ ...defaultState, status: 'completed' });
    }
  }, [user]);

  const update = useCallback((patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (user?.role === 'owner') saveState(next);
      return next;
    });
  }, [user]);

  const startOnboarding = useCallback(() => {
    update({ status: 'in_progress', currentStep: 1, skipped: false });
  }, [update]);

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep >= 5) {
        const next = { ...prev, status: 'completed', currentStep: 5, tourCompleted: true };
        saveState(next);
        return next;
      }
      const next = { ...prev, currentStep: prev.currentStep + 1 };
      saveState(next);
      return next;
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep <= 1) return prev;
      const next = { ...prev, currentStep: prev.currentStep - 1 };
      saveState(next);
      return next;
    });
  }, []);

  const skipOnboarding = useCallback(() => {
    const next = { ...defaultState, status: 'skipped' };
    setState(next);
    saveState(next);
  }, []);

  const resumeOnboarding = useCallback(() => {
    if (state.status === 'skipped' || state.status === 'not_started') {
      update({ status: 'in_progress', currentStep: state.status === 'skipped' ? 1 : state.currentStep });
    }
  }, [state, update]);

  const completeOnboarding = useCallback(() => {
    const next = { ...defaultState, status: 'completed' };
    setState(next);
    saveState(next);
  }, []);

  const setBusinessInfo = useCallback((name, category) => {
    update({ businessName: name, businessCategory: category });
  }, [update]);

  const markProductCreated = useCallback(() => {
    update({ firstProductCreated: true });
  }, [update]);

  const markSaleCompleted = useCallback(() => {
    update({ firstSaleCompleted: true });
  }, [update]);

  const completeTour = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, tourCompleted: true, status: 'completed', currentStep: 5 };
      saveState(next);
      return next;
    });
  }, []);

  const value = {
    ...state,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    resumeOnboarding,
    completeOnboarding,
    setBusinessInfo,
    markProductCreated,
    markSaleCompleted,
    completeTour,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
};
