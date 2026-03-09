const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export interface BitcoinPrice {
  bitcoin: {
    usd: number;
    usd_24h_change: number;
  };
}

export interface LitecoinPrice {
  litecoin: {
    usd: number;
    usd_24h_change: number;
  };
}

export class BitcoinOracle {
  static async getBitcoinPrice(): Promise<BitcoinPrice> {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Bitcoin price');
    }

    return response.json();
  }

  static async getLitecoinPrice(): Promise<LitecoinPrice> {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Litecoin price');
    }

    return response.json();
  }
}
