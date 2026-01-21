import React from 'react';
import styles from './Stepper.module.css';

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => (
        <div key={index} className={styles.stepperWrapper}>
          <div
            className={`${styles.step} ${
              index < currentStep
                ? styles.completed
                : index === currentStep
                ? styles.active
                : styles.inactive
            }`}
            onClick={() => onStepClick && index < currentStep && onStepClick(index)}
            role="button"
            tabIndex={0}
          >
            {index < currentStep ? (
              <span className={styles.stepIcon}>✓</span>
            ) : (
              <span className={styles.stepIcon}>{index + 1}</span>
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`${styles.stepLine} ${
                index < currentStep ? styles.completedLine : ''
              }`}
            />
          )}
          <div className={styles.stepLabel}>{step}</div>
        </div>
      ))}
    </div>
  );
};
