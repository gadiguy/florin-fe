// src/core/ContractManager.ts

import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
  PublicClient,
  WalletClient,
  custom,
} from 'viem';
import { getConnectorClient } from '@wagmi/core';
import { AMMEXCHANGE_ABI, ERC20_BITSNARK_ABI, LITEFORGE_DEPOSITOR_ABI, LITEFORGE_SWAP_ABI } from '@/constants/abis';
import { CMError, ContractError, parseContractError } from '@/lib/errors';
import { TransactionResponse } from '@/types';
import { Address } from 'viem';
import { wagmiConfig } from '@/config/wagmi';
import { supportedChains } from '@/config/evm-chains';
import { env } from '@/config/env';

export class ContractManager {
  private static instance: ContractManager | null = null;
  private static initializing = false;

  public publicClient!: PublicClient;
  public walletClient?: WalletClient;
  // TODO: Fix this type once we have the correct type for the contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private contracts: Map<string, { abi: any[] }> = new Map();

  private constructor() {}

  private async waitForConnectorInitialization(maxAttempts = 10): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        console.log(`Attempt ${i + 1}/${maxAttempts} to initialize connector...`);
        const connectorClient = await getConnectorClient(wagmiConfig);
        if (connectorClient?.chain?.id && connectorClient?.account) {
          console.log('Connector initialized successfully:', {
            chainId: connectorClient.chain.id,
            account: connectorClient.account
          });
          return true;
        }
        console.log('Connector client obtained but missing chain or account:', connectorClient);
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.error('Failed to initialize connector after', maxAttempts, 'attempts');
    return false;
  }

  public static async getInstance(): Promise<ContractManager> {
    if (this.instance) return this.instance;

    if (this.initializing) {
      console.log('ContractManager is already initializing, waiting...');
      while (!this.instance) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.instance;
    }

    this.initializing = true;
    const instance = new ContractManager();

    try {
      console.log('Starting ContractManager initialization...');
      let connectorClient = await getConnectorClient(wagmiConfig);
      
      if (!connectorClient?.chain?.id || !connectorClient?.account) {
        console.log('Initial connector client missing chain or account, waiting for initialization...');
        const isInitialized = await instance.waitForConnectorInitialization();
        if (!isInitialized) {
          throw new Error('Failed to initialize connector after multiple attempts. Please check your wallet connection and try again.');
        }
        connectorClient = await getConnectorClient(wagmiConfig);
      }

      if (!connectorClient?.chain?.id) {
        throw new Error('No chain ID available in connector');
      }

      const knownChain = supportedChains.find((c) => c.id === connectorClient.chain.id);
      const rpcUrl = knownChain?.rpcUrls.default.http[0] || env.VITE_RPC_URL;
      instance.publicClient = createPublicClient({
        chain: connectorClient.chain,
        transport: http(rpcUrl),
      });

      if (connectorClient?.account) {
        try {
          instance.walletClient = createWalletClient({
            account: connectorClient.account,
            chain: connectorClient.chain,
            transport: custom(connectorClient.transport),
          });
        } catch (error) {
          console.error('Error creating wallet client:', error);
          // No lanzamos el error aquí para permitir operaciones de solo lectura
        }
      }

      instance.registerContract('AMMExchange', AMMEXCHANGE_ABI);
      instance.registerContract('ERC20BitSnark', ERC20_BITSNARK_ABI);
      instance.registerContract('LiteforgeDepositor', LITEFORGE_DEPOSITOR_ABI as unknown as []);
      instance.registerContract('LiteforgeSwap', LITEFORGE_SWAP_ABI as unknown as []);
      this.instance = instance;
    } catch (error) {
      console.error('Error initializing ContractManager:', error);
      throw error;
    } finally {
      this.initializing = false;
    }

    return instance;
  }

  // TODO: Fix this type once we have the correct type for the contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public registerContract(contractName: string, abi: any[]) {
    this.contracts.set(contractName, { abi });
  }

  public async readContract(
    contractName: string,
    method: string,
    // TODO: Fix this type once we have the correct type for the contract
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any[] = [],
    address: Address
  ) {
    try {
      const abi = this.getABI(contractName);
      const result = await this.publicClient.readContract({
        address,
        abi,
        functionName: method,
        args,
      });
      return result;
    } catch (error) {
      const parsed = parseContractError(error);
      throw new ContractError(
        `Failed to write to contract ${contractName}: ${parsed}`
      );
    }
  }

  public async refreshWalletClient(): Promise<void> {
    try {
      const connectorClient = await getConnectorClient(wagmiConfig);
      if (connectorClient?.account && connectorClient?.chain) {
        this.walletClient = createWalletClient({
          account: connectorClient.account,
          chain: connectorClient.chain,
          transport: custom(connectorClient.transport),
        });
      }
    } catch (error) {
      console.error('Error refreshing wallet client:', error);
      // No lanzamos el error para permitir operaciones de solo lectura
    }
  }

  public async writeContract(
    contractName: string,
    method: string,
    // TODO: Fix this type once we have the correct type for the contract
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any[] = [],
    address: Address,
    options?: { value?: bigint }
  ): Promise<TransactionResponse> {
    if (!this.walletClient) {
      throw new CMError('Signer is required to perform write operations');
    }

    try {
      const abi = this.getABI(contractName);
      console.log('Simulating contract call with params:', {
        address,
        method,
        args,
        options,
        account: this.walletClient.account,
      });

      const { request } = await this.publicClient.simulateContract({
        address,
        abi,
        functionName: method,
        args,
        account: this.walletClient.account,
        value: options?.value || 0n,
      });

      console.log('Simulation successful, sending transaction...');
      const txRequest = {
        ...request,
        ...options,
      };
      const hash = await this.walletClient.writeContract(txRequest);
      console.log('Transaction sent with hash:', hash);

      return {
        hash,
        wait: async () => {
          console.log('Waiting for transaction receipt...');
          const receipt = await this.publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
          });
          console.log('Transaction receipt received:', receipt);

          // Parse logs from the receipt
          const logs = receipt.logs
            .map((log) => {
              try {
                return decodeEventLog({ abi, ...log });
              } catch(error) {
                console.log('Error decoding event log:', log);
                console.log('Error:', error);
                return null;
              }
            })
            .filter(Boolean);
          return { receipt, logs };
        },
      };
    } catch (error) {
      console.error('Contract write error:', error);
      const parsed = parseContractError(error);
      throw new ContractError(
        `Failed to write to contract ${contractName}: ${parsed}`
      );
    }
  }

  // TODO: Fix this type once we have the correct type for the contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getABI(contractName: string): any[] {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`ABI for contract ${contractName} is not registered`);
    }
    return contract.abi;
  }

  // TODO: Fix this type once we have the correct type for the contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async signTypedData<T extends Record<string, any>>(params: {
    // TODO: Fix this type once we have the correct type for the contract
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    domain: Record<string, any>;
    // TODO: Fix this type once we have the correct type for the contract
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    types: Record<string, any>;
    primaryType: string;
    message: T;
  }): Promise<`0x${string}`> {
    if (!this.walletClient?.account) {
      throw new CMError('Wallet client not initialized');
    }
    return await this.walletClient.signTypedData({
      account: this.walletClient.account,
      domain: {
        ...params.domain,
        chainId: this.walletClient.chain?.id,
      },
      types: params.types,
      primaryType: params.primaryType,
      message: params.message,
    });
  }

  public getRSV(signature: `0x${string}`) {
    const r = signature.slice(0, 66) as `0x${string}`;
    const s = ('0x' + signature.slice(66, 130)) as `0x${string}`;
    const v = parseInt(signature.slice(130, 132), 16);
    return { r, s, v };
  }
}
