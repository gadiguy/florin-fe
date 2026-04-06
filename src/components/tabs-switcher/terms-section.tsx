import { Card } from '@/components/ui/card';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';

interface TermsSectionProps {
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
  toNetwork: 'bitcoin' | 'ethereum' | 'liteforge';
  isAnimating: boolean;
}

export function TermsSection({
  termsAccepted,
  setTermsAccepted,
  toNetwork,
  isAnimating,
}: TermsSectionProps) {
  return (
    <>
      <div
        className={cn(
          'flex justify-center items-center w-full mt-5 transition-all duration-300 ease-in-out',
          isAnimating ? 'opacity-0' : 'opacity-100'
        )}
      >
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className={cn(
                'h-5 w-5 rounded border appearance-none cursor-pointer',
                termsAccepted
                  ? 'bg-orange border-orange'
                  : 'border-gray-300 bg-transparent'
              )}
            />
            {termsAccepted && (
              <svg
                className="absolute inset-0 h-5 w-5 text-white pointer-events-none"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <div className="flex items-center">
            <span className="text-[13px] font-medium leading-none flex items-center">
              <label htmlFor="terms" className="cursor-pointer">
                I agree to
              </label>{' '}
              <Link
                to="/terms"
                className="text-[#FFAA2E] hover:underline mx-1"
                onClick={(e) => e.stopPropagation()}
              >
                Terms & Conditions
              </Link>{' '}
              <label htmlFor="terms" className="cursor-pointer">
                and understand the risks
              </label>
            </span>
          </div>
        </div>
      </div>

      {toNetwork === 'ethereum' && (
        <Card
          className={cn(
            'bg-transparent border-grey w-full sm:w-[400px] md:w-[440px] h-[56px] flex flex-row justify-center items-center py-3 px-8 mt-5 transition-all duration-300 ease-in-out',
            isAnimating ? 'opacity-0' : 'opacity-100'
          )}
        >
          <ExclamationTriangleIcon className="text-orange w-[30px] h-[30px]" />
          <span className="text-xs text-white">
            Please note, in the next step you will be asked to send your LTC to
            a specified address
          </span>
        </Card>
      )}
    </>
  );
}
