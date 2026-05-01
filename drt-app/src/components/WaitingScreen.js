import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEPARTURE_COORDS, YEONGJU_STOPS } from '../data/yeongju';
import { makeMarkerHtml } from './Icon';

function getCoords(name) {
  if (DEPARTURE_COORDS[name]) return DEPARTURE_COORDS[name];
  const stop = YEONGJU_STOPS.find((s) => s.name === name);
  return stop ? { lat: stop.lat, lng: stop.lng } : { lat: 36.8003, lng: 128.6285 };
}
import './WaitingScreen.css';

const INITIAL_SECONDS = 8 * 60;

const DRIVER_INFO = {
  vehicle: '경북 12가 3456',
  driver:  '김영주 기사님',
  eta:     '10:38',
};

// 커스텀 마커 아이콘
const makeIcon = (bg, iconName, iconColor = '#fff') =>
  L.divIcon({
    className: '',
    html: makeMarkerHtml(bg, iconName, iconColor),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const depIcon     = makeIcon('#35C8B4', 'train');
const destIcon    = makeIcon('#A4CF4A', 'mapPin');
const vehicleIcon = makeIcon('#fff', 'bus', '#35C8B4');

// 지도 초기 Bounds 설정 컴포넌트
function MapFitBounds({ bounds }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current) return;
    fitted.current = true;
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

export default function WaitingScreen({ bookingInfo, onBack }) {
  const { departure, destination } = bookingInfo;

  const depCoords  = getCoords(departure);
  // destination이 YEONGJU_STOPS 항목이면 lat/lng 있음, 아니면 영주역 좌표 fallback
  const destCoords = destination.lat
    ? { lat: destination.lat, lng: destination.lng }
    : depCoords;

  const [seconds, setSeconds] = useState(INITIAL_SECONDS);
  const [arrived, setArrived] = useState(false);
  const [vehiclePos, setVehiclePos] = useState([depCoords.lat, depCoords.lng]);
  const tickRef = useRef(INITIAL_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current -= 1;
      const elapsed   = INITIAL_SECONDS - tickRef.current;
      const progress  = Math.min(elapsed / INITIAL_SECONDS, 1);

      setSeconds(tickRef.current);
      setVehiclePos([
        depCoords.lat + (destCoords.lat - depCoords.lat) * progress,
        depCoords.lng + (destCoords.lng - depCoords.lng) * progress,
      ]);

      if (tickRef.current <= 0) {
        clearInterval(id);
        setArrived(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []); // mount 시 1회만 실행, dep 의도적 생략

  const mins = Math.ceil(seconds / 60);

  const routeBounds = [
    [depCoords.lat,  depCoords.lng],
    [destCoords.lat, destCoords.lng],
  ];

  return (
    <div className="waiting-screen">
      {/* 헤더 */}
      <div className="waiting-header">
        <button className="back-btn-w" onClick={onBack}>‹</button>
        <h2 className="waiting-title">탑승 대기중</h2>
        <div style={{ width: 40 }} />
      </div>

      {/* 도착 예정 카드 */}
      <div className={`arrival-card ${arrived ? 'arrived' : ''}`}>
        <p className="arrival-time">
          {arrived ? '도착!' : `${mins}분 후 도착`}
        </p>
        <p className="arrival-sub">
          {arrived
            ? '차량이 도착했습니다. 탑승해 주세요!'
            : `차량이 ${departure}으로 이동 중입니다`}
        </p>
        <div className="dots-anim">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>

      {/* 실시간 지도 */}
      <div className="waiting-map-wrap">
        <MapContainer
          center={[depCoords.lat, depCoords.lng]}
          zoom={12}
          className="waiting-map"
          zoomControl={false}
          scrollWheelZoom={true}
          touchZoom={true}
          dragging={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFitBounds bounds={routeBounds} />

          {/* 노선 점선 */}
          <Polyline
            positions={routeBounds}
            color="#35C8B4"
            weight={3}
            dashArray="8 5"
            opacity={0.7}
          />

          {/* 출발지 마커 */}
          <Marker position={[depCoords.lat, depCoords.lng]} icon={depIcon} />

          {/* 목적지 마커 */}
          <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon} />

          {/* 차량 실시간 위치 */}
          <Marker position={vehiclePos} icon={vehicleIcon} />
        </MapContainer>
        <div className="map-legend">
          <span className="legend-item dep">🚉 {departure}</span>
          <span className="legend-item dest">📍 {destination.name}</span>
        </div>
      </div>

      {/* 차량 정보 */}
      <div className="vehicle-info-card">
        <div className="vi-row">
          <span className="vi-label">차량번호</span>
          <span className="vi-value">{DRIVER_INFO.vehicle}</span>
        </div>
        <div className="vi-row">
          <span className="vi-label">기사님</span>
          <span className="vi-value">{DRIVER_INFO.driver}</span>
        </div>
        <div className="vi-row">
          <span className="vi-label">예상 도착</span>
          <span className="vi-value vi-eta">{DRIVER_INFO.eta}</span>
        </div>
      </div>

      {/* 취소 버튼 */}
      <div className="cancel-wrap">
        <button className="cancel-btn" onClick={onBack}>예약 취소</button>
      </div>
    </div>
  );
}
