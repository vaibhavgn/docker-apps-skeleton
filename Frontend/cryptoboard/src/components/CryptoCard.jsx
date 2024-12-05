import React from 'react';
import { useNavigate } from 'react-router-dom';

const CryptoCard = ({ logo, name, ticker, popularity }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    console.log(`Navigating to /crypto/${ticker}`);
    navigate(`/crypto/${ticker}`);
  };

  return (
    <div className="crypto-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <img src={logo} alt={`${name} logo`} className="crypto-logo" />
      <h3 className="crypto-name">{name}</h3>
      <hr />
      <div className="crypto-popularity">
        <p><strong>Popularity:</strong></p>
        <p>News: {popularity?.news || 'N/A'}</p>
        <p>Social Media: {popularity?.socialMedia || 'N/A'}</p>
      </div>
    </div>
  );
};

export default CryptoCard;
