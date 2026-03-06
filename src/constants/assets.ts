import litecoinLogo from '@/assets/litecoin-logo.png';
import ethLogo from '@/assets/eth-logo.png';
import xbtcLogo from '@/assets/xbtc-logo.svg';

export const ASSETS = {
  BITCOIN_LOGO: litecoinLogo,
  ETH_LOGO: ethLogo,
  XBTC_LOGO: xbtcLogo,
  NETWORK_LOGOS: {
    bitcoin: litecoinLogo,
    ethereum: ethLogo,
  },
  CURRENCY_LOGOS: {
    btc: litecoinLogo,
    eth: ethLogo,
    xbtc: xbtcLogo,
  },
};

export const CURRENCY_SYMBOLS = {
  btc: 'LTC',
  eth: 'ETH',
  xbtc: 'xLTC',
};

export const NETWORK_NAMES = {
  bitcoin: 'Litecoin',
  ethereum: 'Ethereum',
};
