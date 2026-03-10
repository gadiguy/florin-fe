export class CMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CMError';
  }
}

export class ContractError extends CMError {
  constructor(
    message: string,
    public contractName?: string
  ) {
    super(`ContractError: ${message}`);
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends CMError {
  constructor(
    message: string,
    // TODO: Fix this type once we have the correct type for the error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public details?: any
  ) {
    super(`ValidationError: ${message}`);
  }
}

export enum ErrorCode {
  AccessControlUnauthorizedAccount = 'AccessControlUnauthorizedAccount',
  ERC20InsufficientBalance = 'ERC20InsufficientBalance',
  ERC20InvalidSender = 'ERC20InvalidSender',
  ERC20InvalidReceiver = 'ERC20InvalidReceiver',
  ERC20InsufficientAllowance = 'ERC20InsufficientAllowance',
  ERC20InvalidApprover = 'ERC20InvalidApprover',
  ERC20InvalidSpender = 'ERC20InvalidSpender',
  PositionDoesNotExist = 'PositionDoesNotExist',
  PositionNotActive = 'PositionNotActive',
  InvalidAmount = 'InvalidAmount',
  ReservationNotPending = 'ReservationNotPending',
  ReservationExpired = 'ReservationExpired',
  NotReservationOwner = 'NotReservationOwner',
  ReservationIdMismatch = 'ReservationIdMismatch',
  InvalidBitcoinAddress = 'InvalidBitcoinAddress',
  TokenTransferFailed = 'TokenTransferFailed',
}

// TODO: Fix this type once we have the correct type for the error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseContractError = (error: any): string => {
  const message = error?.message || '';
  const knownErrors: Record<string, string> = {
    [ErrorCode.ERC20InsufficientBalance]: 'Insufficient zkLTC balance.',
    [ErrorCode.ERC20InsufficientAllowance]: 'Insufficient zkLTC allowance.',
    [ErrorCode.PositionDoesNotExist]: 'Position does not exist.',
    [ErrorCode.PositionNotActive]: 'Position is not active.',
    [ErrorCode.InvalidAmount]: 'Invalid amount.',
    [ErrorCode.ReservationNotPending]: 'Reservation is not in pending state.',
    [ErrorCode.ReservationExpired]: 'Reservation has expired.',
    [ErrorCode.NotReservationOwner]: 'You are not the reservation owner.',
    [ErrorCode.ReservationIdMismatch]: 'Reservation ID mismatch.',
    [ErrorCode.InvalidBitcoinAddress]: 'Invalid Bitcoin address.',
    [ErrorCode.TokenTransferFailed]: 'Token transfer failed.',
  };

  for (const [key, userMessage] of Object.entries(knownErrors)) {
    if (message.includes(key)) return userMessage;
  }

  return (
    error?.shortMessage ||
    message ||
    'Unexpected error interacting with the contract'
  );
};
