import { sepolia } from '@/config/evm-chains';

export const CONTRACTS_ADDRESS = {
  [sepolia.id]: {
    ammExchange: '0x483b819A38f2Aa75C1e42e88Cbc5e32A09dEd48C',
    marketMakerProxy: '0xb7fa6f0F519c94D9FE40e8dB8C8B8609487d2825',
    florinForwarder: '0xa9f24c03A309bF72086CF7496771eFa02C3b99D9',
    erc20BitSnark: '0x087aaAc1E05DbB76b9A9E7a837F9e6C7ebDBfA23',
    contractRegistry: '0x204652c13363cc43a7bC87B23b13870A0DB20a03',
  },
  31337: {
    ammExchange: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
    marketMakerProxy: '0x9A676e781A523b5d0C0e43731313A708CB607508',
    florinForwarder: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
    erc20BitSnark: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    contractRegistry: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  },
};
