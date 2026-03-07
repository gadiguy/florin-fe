import { ReactNode } from 'react';
import { StatusIcon } from './status-icon';

interface TransactionStepProps {
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'current';
  isLastStep?: boolean;
  children?: ReactNode;
  completed: boolean;
  isStepOne?: boolean;
}

export function TransactionStep({
  title,
  description,
  status,
  isLastStep = false,
  completed,
  children,
  isStepOne = false,
}: TransactionStepProps) {
  return (
    <div className="flex mb-6 md:mb-8 relative w-full">
      {!isLastStep && (
        <div
          className={`absolute left-[14px] top-[30px] w-[3px] h-[calc(100%)] ${
            completed && isStepOne
              ? 'bg-gradient-to-b from-[#4CAF50] to-[#388E3C]'
              : completed
                ? 'bg-[#4CAF50]'
                : 'bg-[#3A3740]'
          }`}
        ></div>
      )}

      <div className="flex-shrink-0 z-10">
        <StatusIcon status={status} />
      </div>
      <div className="ml-3 md:ml-4 w-full">
        <h3 className="font-semibold text-sm md:text-base">{title}</h3>
        <p className="text-[#888888] text-xs md:text-sm">{description}</p>

        {children && <div className="mt-3 w-full md:mt-4">{children}</div>}
      </div>
    </div>
  );
}
