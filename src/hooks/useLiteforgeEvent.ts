import { useEffect, useRef, useState } from 'react';
import { Address } from 'viem';
import { ContractManager } from '@/services/ContractManager';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';
import { LITEFORGE_DEPOSITOR_ABI } from '@/constants/abis';

interface BridgedEvent {
  args: {
    l2Recipient: Address;
    amount: bigint;
    messageNum: bigint;
  };
  transactionHash: string;
}

interface UseLiteforgeEventProps {
  isActive: boolean;
  chainId: number;
  pollingInterval?: number;
}

export function useLiteforgeEvent({
  isActive,
  chainId,
  pollingInterval = 5000,
}: UseLiteforgeEventProps): { bridgedEvent: BridgedEvent | null; error: Error | null } {
  const [bridgedEvent, setBridgedEvent] = useState<BridgedEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fromBlockRef = useRef<bigint>(0n);

  useEffect(() => {
    if (!isActive || bridgedEvent) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const contracts = CONTRACTS_ADDRESS[chainId as keyof typeof CONTRACTS_ADDRESS];
    const depositorAddress = (contracts as { liteforgeDepositor?: string })?.liteforgeDepositor as Address | undefined;
    if (!depositorAddress || depositorAddress === '0x0000000000000000000000000000000000000000') return;

    const poll = async () => {
      try {
        const cm = await ContractManager.getInstance();
        const currentBlock = await cm.publicClient.getBlockNumber();
        const fromBlock = fromBlockRef.current > 0n ? fromBlockRef.current : currentBlock - 100n;

        const logs = await cm.publicClient.getLogs({
          address: depositorAddress,
          event: {
            type: 'event',
            name: 'Bridged',
            inputs: LITEFORGE_DEPOSITOR_ABI[0].inputs,
          },
          fromBlock,
          toBlock: currentBlock,
        });

        fromBlockRef.current = currentBlock + 1n;

        if (logs.length > 0) {
          const log = logs[0];
          setBridgedEvent({
            args: log.args as BridgedEvent['args'],
            transactionHash: log.transactionHash ?? '',
          });
        }
      } catch (e) {
        setError(e as Error);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, pollingInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, chainId, bridgedEvent, pollingInterval]);

  return { bridgedEvent, error };
}
