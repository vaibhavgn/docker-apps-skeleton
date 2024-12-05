import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HighchartsReact from 'highcharts-react-official';
import Highcharts, { color } from 'highcharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getCryptoById } from '../services/dbService';
const formatNumber = (num) => {
  if (num >= 1e12) {
      return (num / 1e12).toFixed(1) + 'T'; // Trillions
  } else if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B'; // Billions
  } else if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M'; // Millions
  } else if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K'; // Thousands
  } else if (num > 0 && num < 0.01) {
      return num.toFixed(8); // Small numbers in scientific notation
  }
  return num.toFixed(2); // Default for small/regular numbers
};

// Function to calculate predicted prices
const calculatePredictedPrices = (livePrice, marketPerformance) => {
  if (!livePrice || !marketPerformance) return {};

  const { percent_change_24h, percent_change_7d, percent_change_30d, percent_change_60d, percent_change_90d } = marketPerformance;

  return {
    oneDay: livePrice * (1 + percent_change_24h / 100),
    oneWeek: livePrice * (1 + percent_change_7d / 100),
    oneMonth: livePrice * (1 + percent_change_30d / 100),
    twoMonths: livePrice * (1 + percent_change_60d / 100),
    threeMonths: livePrice * (1 + percent_change_90d / 100),
  };
};


const CryptoDetail = () => {
  const { ticker } = useParams(); // Get ticker from URL params
  const [crypto, setCrypto] = useState(null);
  const [livePrice, setLivePrice] = useState(null);
  const [timeRange, setTimeRange] = useState('6m'); // Default time range to 6 months
  const [predictedPrices, setPredictedPrices] = useState({});
  
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/'); // Navigate back to Home page
  };
  const tickerToIdMap = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    DOGE: 'dogecoin',
    SOL: 'solana',
    XRP: 'ripple',
    ADA: 'cardano',
    TRX: 'tron',
    SHIB: 'shiba-inu',
    AVAX: 'avalanche-2',
    TON: 'the-open-network',
  };
  
   // Fetch the live price of the cryptocurrency
   const fetchLivePrice = async (ticker) => {
    const coinId = tickerToIdMap[ticker]; // Get the CoinGecko ID based on the ticker symbol
    if (!coinId) {
      console.error("Ticker not supported.");
      return null; // Return null if ticker is not supported
    }

    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );
      
      const price = response.data[coinId]?.usd;
      return price;
    } catch (error) {
      console.error("Error fetching live price:", error);
      return null;
    }
  };

  

 
  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const data = await getCryptoById(ticker);
        setCrypto(data);
        const price = await fetchLivePrice(ticker);
        setLivePrice(price);
        
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      }
    };

    fetchCrypto();
  }, [ticker]);

  useEffect(() => {
    if (livePrice && crypto?.marketPerformance) {
      const predictions = calculatePredictedPrices(livePrice, crypto.marketPerformance);
      setPredictedPrices(predictions);
    }
  }, [livePrice, crypto]);


  // Function to filter data based on selected time range
  const calculateFilteredData = (data, timeRange) => {
    const now = new Date().getTime(); // Get current time in milliseconds
    const ranges = {
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '15d': now - 15 * 24 * 60 * 60 * 1000,
      '1m': now - 30 * 24 * 60 * 60 * 1000,
      '6m': now - 6 * 30 * 24 * 60 * 60 * 1000,
    };

    const startTime = ranges[timeRange];
    

    // Ensure data is in the correct format with timestamps in milliseconds
    const validatedData = data.map(([timestamp, value]) => {
      const adjustedTimestamp = timestamp < 1000000000000 ? timestamp * 1000 : timestamp; // Handle seconds to milliseconds conversion
      return [adjustedTimestamp, value];
    });

    

    // Filter data based on time range
    const filtered = validatedData.filter(([timestamp]) => timestamp >= startTime);
    console.log(`Filtered data for ${timeRange}:`, filtered);  // Debugging line
    return filtered;
  };

  if (!crypto) return <p>Loading...</p>;

  // Filter price and volume data based on selected time range
  const filteredPriceData = calculateFilteredData(crypto.chartData, timeRange);
  const filteredVolumeData = calculateFilteredData(crypto.volumeData, timeRange);
  

  const chartOptions = {
    chart: {
      zoomType: 'x',
      spacingTop: 30,
      marginTop: 80,
    },
    title: {
      text: `${crypto.name} Price and Volume`,
    },
    xAxis: {
      type: 'datetime',
      title: { text: 'Time' },
    },
    yAxis: [
      {
        title: {
          text: 'Price (USD)',
        },
        opposite: false, // Left axis
      },
      {
        title: {
          text: 'Volume',
        },
        opposite: true, // Right axis
      },
    ],
    series: [
      {
        type: 'area',
        name: 'Price',
        data: filteredPriceData.map(([timestamp, price]) => [timestamp, price]),
        yAxis: 0,
        color: 'lightblue',
        fillOpacity: 0.3,
      },
      {
        type: 'column',
        name: 'Volume',
        data: filteredVolumeData.map(([timestamp, volume]) => [timestamp, volume]),
        yAxis: 1,
        color: 'grey',
      },
    ],
    tooltip: {
      shared: true,
    },
    plotOptions: {
      column: {
        borderWidth: 0,
      },
    },
    rangeSelector: {
      buttons: [
        { count: 7, type: 'day', text: '7d' },
        { count: 15, type: 'day', text: '15d' },
        { count: 1, type: 'month', text: '1m' },
        { count: 6, type: 'month', text: '6m' },
      ],
      inputEnabled: false, // Hide date input boxes
    },
  };

  const chartOptions1 = {
    title: {
      text: `${crypto.name} Price Predictions (Current Market vs Predicted)`,
    },
    chart: {
      type: 'line',
    },
    xAxis: {
      categories: ['Current', '1 Day', '1 Week', '1 Month', '2 Months', '3 Months'],
    },
    yAxis: {
      title: {
        text: 'Price (USD)',
      },
    },
    series: [
      {
        name: 'Predicted Price',
        data: [
          livePrice, 
          predictedPrices.oneDay, 
          predictedPrices.oneWeek, 
          predictedPrices.oneMonth, 
          predictedPrices.twoMonths, 
          predictedPrices.threeMonths
        ],
        type: 'line',
        color: 'lightblue',
      },
      {
        name: 'Current Price',
        data: Array(6).fill(livePrice), // Displaying live price as a constant value
        type: 'line',
        color: 'grey',
        dashStyle: 'ShortDash',
      },
    ],
  };


  return (
    <div className="crypto-detail">
      <header>
        <img src={crypto.logo} alt={`${crypto.name} logo`} className="crypto-logo" />
        <h1>{crypto.name}</h1>
      </header>

      <div className="tabs">
        <button onClick={() => setTimeRange('7d')} className={timeRange === '7d' ? 'active' : ''}>
          7 Days
        </button>
        <button onClick={() => setTimeRange('15d')} className={timeRange === '15d' ? 'active' : ''}>
          15 Days
        </button>
        <button onClick={() => setTimeRange('1m')} className={timeRange === '1m' ? 'active' : ''}>
          1 Month
        </button>
        <button onClick={() => setTimeRange('6m')} className={timeRange === '6m' ? 'active' : ''}>
          6 Months
        </button>
      </div>
      
      <div className="chart-box">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>

      <div className="stats">
    <h3>Market Stats</h3>
    <div className="stats-grid">
        <div className="stat-card">
            <div className="stat-label">Price</div>
            <div className="stat-value">${formatNumber(crypto.marketStats.price)}</div>
        </div>
        <div className="stat-card">
            <div className="stat-label">Market Cap</div>
            <div className="stat-value">${formatNumber(crypto.marketStats.market_cap)}</div>
        </div>
        <div className="stat-card">
            <div className="stat-label">Market Cap Dominance</div>
            <div className="stat-value">{crypto.marketStats.market_cap_dominance.toFixed(2)}%</div>
        </div>
        <div className="stat-card">
            <div className="stat-label">Volume (24h)</div>
            <div className="stat-value">${formatNumber(crypto.marketStats.volume_24h)}</div>
        </div>
        <div className="stat-card">
            <div className="stat-label">Volume Change (24h)</div>
            <div className={`stat-value ${crypto.marketStats.volume_change_24h > 0 ? 'positive' : 'negative'}`}>
                {crypto.marketStats.volume_change_24h.toFixed(2)}%
            </div>
        </div>
    </div>
</div>
<div className="performance">
    <h3>Market Performance</h3>
    <div className="performance-grid">
        <div className="stat-card">
            <div className="stat-label">Price Change (1h)</div>
            <div className={`stat-value ${crypto.marketPerformance.percent_change_1h > 0 ? 'positive' : 'negative'}`}>
                {crypto.marketPerformance.percent_change_1h > 0 ? '+' : ''}
                {crypto.marketPerformance.percent_change_1h.toFixed(2)}%
            </div>
        </div>
        
        <div className="stat-card">
            <div className="stat-label">Price Change (24h)</div>
            <div className={`stat-value ${crypto.marketPerformance.percent_change_24h > 0 ? 'positive' : 'negative'}`}>
                {crypto.marketPerformance.percent_change_24h > 0 ? '+' : ''}
                {crypto.marketPerformance.percent_change_24h.toFixed(2)}%
            </div>
        </div>
        
        <div className="stat-card">
            <div className="stat-label">Price Change (7d)</div>
            <div className={`stat-value ${crypto.marketPerformance.percent_change_7d > 0 ? 'positive' : 'negative'}`}>
                {crypto.marketPerformance.percent_change_7d > 0 ? '+' : ''}
                {crypto.marketPerformance.percent_change_7d.toFixed(2)}%
            </div>
        </div>
        
        <div className="stat-card">
            <div className="stat-label">Price Change (30d)</div>
            <div className={`stat-value ${crypto.marketPerformance.percent_change_30d > 0 ? 'positive' : 'negative'}`}>
                {crypto.marketPerformance.percent_change_30d > 0 ? '+' : ''}
                {crypto.marketPerformance.percent_change_30d.toFixed(2)}%
            </div>
        </div>
        
        <div className="stat-card">
            <div className="stat-label">Price Change (60d)</div>
            <div className={`stat-value ${crypto.marketPerformance.percent_change_60d > 0 ? 'positive' : 'negative'}`}>
                {crypto.marketPerformance.percent_change_60d > 0 ? '+' : ''}
                {crypto.marketPerformance.percent_change_60d.toFixed(2)}%
            </div>
        </div>
        
        <div className="stat-card">
            <div className="stat-label">Price Change (90d)</div>
            <div className={`stat-value ${crypto.marketPerformance.percent_change_90d > 0 ? 'positive' : 'negative'}`}>
                {crypto.marketPerformance.percent_change_90d > 0 ? '+' : ''}
                {crypto.marketPerformance.percent_change_90d.toFixed(2)}%
            </div>
        </div>
    </div>
</div>

<div className="performance">
    <div className="stat-card1">
    <div className="stat-label">CURRENT PRICE</div>
    <b>{livePrice !== null ? `$${formatNumber(livePrice)}` : 'Loading...'}</b>
        </div>
      <br></br>
    
        <h3>Price Predictions</h3>
        <br></br>
        <br></br> 
        <div className="stats-grid">
    <div className="stat-card">
        <div className="stat-label">1 Day</div>
        <div className={`stat-value ${predictedPrices.oneDay > livePrice ? 'positive' : 'negative'}`}>
            ${predictedPrices.oneDay ? formatNumber(predictedPrices.oneDay) : "Loading..."}
        </div>
    </div>
    <div className="stat-card">
        <div className="stat-label">1 Week</div>
        <div className={`stat-value ${predictedPrices.oneWeek > livePrice ? 'positive' : 'negative'}`}>
            ${predictedPrices.oneWeek ? formatNumber(predictedPrices.oneWeek) : "Loading..."}
        </div>
    </div>
    <div className="stat-card">
        <div className="stat-label">1 Month</div>
        <div className={`stat-value ${predictedPrices.oneMonth > livePrice ? 'positive' : 'negative'}`}>
            ${predictedPrices.oneMonth ? formatNumber(predictedPrices.oneMonth) : "Loading..."}
        </div>
    </div>
    <div className="stat-card">
        <div className="stat-label">2 Months</div>
        <div className={`stat-value ${predictedPrices.twoMonths > livePrice ? 'positive' : 'negative'}`}>
            ${predictedPrices.twoMonths ? formatNumber(predictedPrices.twoMonths) : "Loading..."}
        </div>
    </div>
    <div className="stat-card">
        <div className="stat-label">3 Months</div>
        <div className={`stat-value ${predictedPrices.threeMonths > livePrice ? 'positive' : 'negative'}`}>
            ${predictedPrices.threeMonths ? formatNumber(predictedPrices.threeMonths) : "Loading..."}
        </div>
    </div>
</div>

<br></br>
<br></br>
<br></br>
<div className="chart-box" >
        <HighchartsReact highcharts={Highcharts} options={chartOptions1} />
      </div>      
</div>

<div className="crypto-detail-page">
      <button className="back-button" onClick={goBack}>
        <i className="fas fa-arrow-left"></i> 
      </button>
      </div>
    </div>
  );
};

export default CryptoDetail;

