import React from 'react';
import './LoadingTruck.css';

interface LoadingTruckProps {
  imageUrl?: string;
  text?: string;
}

const LoadingTruck: React.FC<LoadingTruckProps> = ({ 
  imageUrl = "MASUKKAN_PATH_GAMBAR_DISINI", // Ganti dengan path atau import gambar Anda (misal: import truckImg from '../assets/truck.png')
  text = "Memuat data..." 
}) => {
  return (
    <div className="loading-truck-container">
      {/* Debu/asap truk untuk efek bergerak */}
      <div className="dust"></div>
      <div className="dust"></div>
      <div className="dust"></div>
      <div className="dust"></div>

      {/* Gambar Truk */}
      {imageUrl !== "MASUKKAN_PATH_GAMBAR_DISINI" ? (
        <img src={imageUrl} alt="Loading Truck" className="truck-image" />
      ) : (
        <div className="truck-image" style={{ backgroundColor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
          <span style={{ fontSize: '12px', textAlign: 'center', padding: '10px' }}>
            [Ganti prop imageUrl dengan gambar truk Anda]
          </span>
        </div>
      )}

      {/* Jalan yang bergerak */}
      <div className="road"></div>

      {/* Teks Loading */}
      <div className="loading-text">{text}</div>
    </div>
  );
};

export default LoadingTruck;
