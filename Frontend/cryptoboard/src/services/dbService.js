const cryptoList = [
  { id: '1', ticker: 'BTC', name: 'Bitcoin', logo: '/logos/bitcoin-btc-logo.png' },
  { id: '2', ticker: 'ETH', name: 'Ethereum', logo: '/logos/ethereum-eth-logo.png' },
  { id: '3', ticker: 'SOL', name: 'Solana', logo: '/logos/sol.png' },
  { id: '4', ticker: 'XRP', name: 'XRP', logo: '/logos/xrp.png' },
  { id: '5', ticker: 'DOGE', name: 'Dogecoin', logo: '/logos/dogecoin-doge-logo.png' },
  { id: '6', ticker: 'ADA', name: 'Cardano', logo: '/logos/cardano.png' },
  { id: '7', ticker: 'TRX', name: 'Tron', logo: '/logos/tron.png' },
  { id: '8', ticker: 'SHIB', name: 'Shiba Inu', logo: '/logos/shiba.png' },
  { id: '9', ticker: 'AVAX', name: 'Avalanche', logo: '/logos/avalanche.png' },
  { id: '10', ticker: 'TON', name: 'Toncoin', logo: '/logos/toncoin.png' },
];

export const getAllCryptos = async () => {
  try {
    const response1 = await fetch('http://localhost:3001/processData');

    const response = await fetch('http://localhost:3001/getDataFromDb');
    if (!response.ok) throw new Error('Failed to fetch example.json');

    const jsonData = await response.json();
    if (process.env.NODE_ENV === 'development') {
      console.log('Loaded data from example.json:', jsonData); // Debugging line
    }

  const enrichedList = cryptoList.map((crypto) => {
  const tickerKey = `X:${crypto.ticker}USD`;
  
  // Safely access chartData
  const historicalData = jsonData.chartData?.[tickerKey];
  const timePrice = historicalData?.timePrice || [];
  const timeVolume = historicalData?.timeVolume || [];

  const validatedPriceData = timePrice
    .filter(([timestamp, price]) => timestamp && price)
    .map(([timestamp, price]) => [timestamp, price]);

  const validatedVolumeData = timeVolume
    .filter(([timestamp, volume]) => timestamp && volume)
    .map(([timestamp, volume]) => [timestamp, volume]);

  const newsData = jsonData.popularityPercentages?.news.find(
    (item) => item.key === tickerKey
  );
  const socialMediaData = jsonData.popularityPercentages?.socialMedia.find(
    (item) => item.key === tickerKey
  );

  return {
    ...crypto,
    chartData: validatedPriceData,
    volumeData: validatedVolumeData,
    marketStats: {
      price: jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.price || 0,
      market_cap: jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.market_cap || 0,
      market_cap_dominance:
        jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.market_cap_dominance || 0,
      volume_24h:
        jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.volume_24h || 0,
      volume_change_24h:
        jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.volume_change_24h || 0,
    },
    marketPerformance: {
      percent_change_1h:
        jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.percent_change_1h || 0,
      percent_change_24h:
        jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.percent_change_24h || 0,
      percent_change_7d:
        jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.percent_change_7d || 0,
      percent_change_30d:
        jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.percent_change_30d || 0,
      percent_change_60d:
        jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.percent_change_60d || 0,
      percent_change_90d:
        jsonData.latestPercentChanges?.[crypto.ticker]?.quote?.USD?.percent_change_90d || 0,
    },
    popularity: {
      news: newsData?.popularity || 'N/A',
      socialMedia: socialMediaData?.popularity || 'N/A',
    },
  };
});


    return enrichedList;
  } catch (error) {
    console.error('Error in getAllCryptos:', error);
    return [];
  }
};

// Fetch the crypto data based on the selected ticker
export const getCryptoById = async (ticker) => {
  try {
    const cryptos = await getAllCryptos();
    if (process.env.NODE_ENV === 'development') {
      console.log('All Cryptos:', cryptos);
    }
    return cryptos.find((crypto) => crypto.ticker === ticker); // Use ticker to find the matching crypto
  } catch (error) {
    console.error('Error in getCryptoById:', error);
    return null;
  }
};
