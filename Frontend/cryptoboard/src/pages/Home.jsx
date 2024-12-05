import React, { useEffect, useState } from 'react';
import CryptoCard from '../components/CryptoCard';
import { getAllCryptos } from '../services/dbService';

const Home = () => {
  const [cryptoData, setCryptoData] = useState([]);

  useEffect(() => {
    const fetchCryptos = async () => {
      const data = await getAllCryptos();
      setCryptoData(data);
    };

    fetchCryptos();
  }, []);

  console.log('Crypto Data for Rendering:', cryptoData);


  return (
    <div className="home">
      <h1>CryptoBoard</h1>
      <br>
      </br>
      
      <div className="crypto-grid">
        {cryptoData.map((crypto) => (
          <CryptoCard
            key={crypto.id}
            ticker={crypto.ticker}
            name={crypto.name}
            logo={crypto.logo}
            popularity={crypto.popularity} // Pass popularity to CryptoCard
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
