import litecoinLogo from '@/assets/litecoin-logo.png';
import ethLogo from '@/assets/eth-logo.png';
import xbtcLogo from '@/assets/xbtc-logo.svg';
import zkLtcLogo from '/zkLTC-logo.svg';

export const ASSETS = {
  BITCOIN_LOGO: litecoinLogo,
  ETH_LOGO: ethLogo,
  XBTC_LOGO: xbtcLogo,
  NETWORK_LOGOS: {
    bitcoin: litecoinLogo,
    ethereum: ethLogo,
    liteforge: zkLtcLogo,
  },
  CURRENCY_LOGOS: {
    btc: litecoinLogo,
    eth: ethLogo,
    xbtc: zkLtcLogo,
  },
};

export const CURRENCY_SYMBOLS = {
  btc: 'LTC',
  eth: 'ETH',
  xbtc: 'zkLTC',
};

export const NETWORK_NAMES = {
  bitcoin: 'Litecoin',
  ethereum: 'Ethereum',
  liteforge: 'LiteForge',
};
