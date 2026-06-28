import { useState, useEffect } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../context/AuthContext';

const tourSteps = [
  {
    target: 'welcome-card',
    title: 'Welcome Card',
    description: 'This is your personal welcome area. Your role and email are shown here so you always know which account is active.',
    position: 'bottom',
  },
  {
    target: 'stats-grid',
    title: 'Quick Stats',
    description: 'Key metrics at a glance: revenue, sales, units sold, and stock alerts. Keep an eye on low stock and out-of-stock items here.',
    position: 'top',
  },
  {
    target: 'recent-sales-section',
    title: 'Recent Sales',
    description: 'Your latest transactions appear here. Click Sales in the sidebar to manage all sales in detail.',
    position: 'top',
  },
  {
    target: 'top-products-section',
    title: 'Top Products',
    description: 'See which products are selling best. Use this data to make informed restocking decisions.',
    position: 'top',
  },
];

function TourTooltip({ step, index, total, onNext, onEnd }) {
  return (
    <div className="tour-tooltip">
      <div className="tour-tooltip__header">
        <span className="tour-tooltip__step">{index + 1} / {total}</span>
        <button className="tour-tooltip__skip" onClick={onEnd}>Skip Tour</button>
      </div>
      <h3 className="tour-tooltip__title">{step.title}</h3>
      <p className="tour-tooltip__desc">{step.description}</p>
      <div className="tour-tooltip__actions">
        <button className="btn btn--primary btn--sm" onClick={onNext}>
          {index < total - 1 ? 'Next' : 'Finish'}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingTour({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const { completeTour } = useOnboarding();
  const { user } = useAuth();

  const currentStep = tourSteps[stepIndex];

  useEffect(() => {
    const el = document.querySelector(`.${currentStep.target}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [stepIndex, currentStep.target]);

  const handleNext = () => {
    if (stepIndex < tourSteps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      completeTour();
      onComplete?.();
    }
  };

  const handleEnd = () => {
    completeTour();
    onComplete?.();
  };

  return (
    <div className="tour-overlay">
      {tourSteps.map((s, i) => {
        const isCurrent = i === stepIndex;
        return (
          <div
            key={s.target}
            className={`tour-highlight${isCurrent ? ' tour-highlight--active' : ''}`}
            data-target={s.target}
          />
        );
      })}

      <TourTooltip
        step={currentStep}
        index={stepIndex}
        total={tourSteps.length}
        onNext={handleNext}
        onEnd={handleEnd}
      />
    </div>
  );
}
