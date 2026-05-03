import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import './HomeScreen.css';

// 받침 유무에 따라 '으로' / '로' 반환
function ro(word) {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return '으로';
  const jong = (code - 0xAC00) % 28;
  return jong === 0 || jong === 8 ? '로' : '으로';
}

const DESTINATIONS = {
  영주역: [
    { id: 'sosu',   name: '소수서원', desc: '조선시대 선비 문화의 보고',          distance: '12.5km', duration: '약 25분', thumbColor: '#c9a06a', thumbColor2: '#a07840' },
    { id: 'buseok', name: '부석사',   desc: '천년 역사의 문화재와 뛰어난 경관',   distance: '18.3km', duration: '약 35분', thumbColor: '#7a9e6a', thumbColor2: '#5a7e50' },
    { id: 'museom', name: '무섬마을', desc: '내성천이 굽이쳐 감싸안은 물 위의 섬', distance: '8.7km',  duration: '약 18분', thumbColor: '#b08060', thumbColor2: '#906040' },
  ],
  풍기역: [
    { id: 'sosu',   name: '소수서원', desc: '조선시대 선비 문화의 보고',          distance: '4.1km',  duration: '약 10분', thumbColor: '#c9a06a', thumbColor2: '#a07840' },
    { id: 'buseok', name: '부석사',   desc: '천년 역사의 문화재와 뛰어난 경관',   distance: '16.8km', duration: '약 32분', thumbColor: '#7a9e6a', thumbColor2: '#5a7e50' },
    { id: 'museom', name: '무섬마을', desc: '내성천이 굽이쳐 감싸안은 물 위의 섬', distance: '19.4km', duration: '약 38분', thumbColor: '#b08060', thumbColor2: '#906040' },
  ],
};

export default function HomeScreen({ departure, setDeparture, onSelectDest }) {
  const [selected, setSelected] = useState(null);
  const destinations = DESTINATIONS[departure];

  // 출발역 바뀌면 선택 초기화
  useEffect(() => { setSelected(null); }, [departure]);

  const handleCardClick = (dest) => {
    setSelected((prev) => (prev?.id === dest.id ? null : dest));
  };

  const handleCallDRT = () => {
    if (selected) onSelectDest(selected);
  };

  return (
    <div className="home-screen">
      {/* 헤더 */}
      <div className="home-header">
        <div className="header-top">
          <span className="header-bus"><Icon name="bus" size={22} color="#fff" /></span>
          <h1 className="header-title">영주 관광버스</h1>
        </div>
        <p className="header-sub">역에서 관광지까지, 편하게</p>

        <div className="station-badges">
          {['영주역', '풍기역'].map((station) => (
            <button
              key={station}
              className={`station-badge ${departure === station ? 'active' : ''}`}
              onClick={() => setDeparture(station)}
            >
              <span className="badge-pin"><Icon name="mapPin" size={13} color="currentColor" /></span>
              {station} 출발
            </button>
          ))}
        </div>
      </div>

      {/* 목적지 목록 */}
      <div className="dest-card-wrap">
        <div className="dest-list">
          {destinations.map((dest) => (
            <button
              key={dest.id}
              className={`dest-item ${selected?.id === dest.id ? 'selected' : ''}`}
              onClick={() => handleCardClick(dest)}
            >
              <div className="dest-info">
                <p className="dest-name">{dest.name}</p>
                <p className="dest-desc">{dest.desc}</p>
                <p className="dest-meta">{dest.distance} · {dest.duration}</p>
              </div>
              <div
                className="dest-thumb"
                style={{ background: `linear-gradient(135deg, ${dest.thumbColor} 0%, ${dest.thumbColor2} 100%)` }}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/images/${dest.id}.jpg`}
                  alt={dest.name}
                  className="dest-thumb-img"
                  onError={(e) => { e.target.style.opacity = '0'; }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DRT 호출 버튼 */}
      <div className="drt-btn-wrap">
        <button
          className={`drt-btn ${!selected ? 'disabled' : ''}`}
          onClick={handleCallDRT}
          disabled={!selected}
        >
          {selected ? `${selected.name}${ro(selected.name)} DRT 호출하기` : 'DRT 호출하기'}
        </button>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bottom-nav">
        <button className="nav-item active">
          <span className="nav-icon"><Icon name="home" size={20} color="currentColor" /></span>
          <span className="nav-label">홈</span>
        </button>
        <button className="nav-item">
          <span className="nav-icon"><Icon name="trips" size={20} color="currentColor" /></span>
          <span className="nav-label">예약</span>
        </button>
        <button className="nav-item">
          <span className="nav-icon"><Icon name="bus" size={20} color="currentColor" /></span>
          <span className="nav-label">내 탑승</span>
        </button>
        <button className="nav-item">
          <span className="nav-icon"><Icon name="person" size={20} color="currentColor" /></span>
          <span className="nav-label">마이페이지</span>
        </button>
      </nav>
    </div>
  );
}
