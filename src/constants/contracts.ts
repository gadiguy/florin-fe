import { sepolia } from '@/config/evm-chains';

export const CONTRACTS_ADDRESS = {
  [sepolia.id]: {
    ammExchange: '0x15EF38c3e42150e8B0156C22f27f93B26804e3bd',
    marketMakerProxy: '0xD7b953b8930C103589E10d4Ff30F4Ed4D64A4d85',
    florinForwarder: '0xa9f24c03A309bF72086CF7496771eFa02C3b99D9',
    erc20BitSnark: '0xaE9190aEca45F50dCDa0483c0223E191E6811ad2',
    contractRegistry: '0x204652c13363cc43a7bC87B23b13870A0DB20a03',
    defaultPositionId: '0xf0e94d3b55389b66f693bf6a4ae0eec46a1e61342c9efeaa96ba6ada1d555ca2',
  },
  31337: {
    ammExchange: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
    marketMakerProxy: '0x9A676e781A523b5d0C0e43731313A708CB607508',
    florinForwarder: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
    erc20BitSnark: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    contractRegistry: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    defaultPositionId: '0xf0e94d3b55389b66f693bf6a4ae0eec46a1e61342c9efeaa96ba6ada1d555ca2',
  },
};
