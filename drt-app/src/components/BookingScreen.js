import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { YEONGJU_STOPS, DEPARTURE_COORDS } from '../data/yeongju';
import { makeMarkerHtml } from './Icon';
import './BookingScreen.css';

const ADULT_FARE = 2500;

function getCoordsForName(name) {
  if (DEPARTURE_COORDS[name]) return DEPARTURE_COORDS[name];
  const stop = YEONGJU_STOPS.find((s) => s.name === name);
  return stop ? { lat: stop.lat, lng: stop.lng } : null;
}

const makeIcon = (bg, iconName, iconColor = '#fff') =>
  L.divIcon({
    className: '',
    html: makeMarkerHtml(bg, iconName, iconColor),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });

const depIcon  = makeIcon('#35C8B4', 'train');
const destIcon = makeIcon('#A4CF4A', 'mapPin');

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(null);
  useEffect(() => {
    if (!center) return;
    const key = center.join(',');
    if (prevCenter.current === key) return;
    prevCenter.current = key;
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

function getRelativeSlots() {
  const now = new Date();
  return [5, 10, 15].map((mins) => {
    const t = new Date(now.getTime() + mins * 60000);
    const h = t.getHours().toString().padStart(2, '0');
    const m = t.getMinutes().toString().padStart(2, '0');
    return { id: `${mins}`, label: `${mins}분 후`, time: `${h}:${m}`, isCustom: false };
  }).concat([{ id: 'custom', label: '20분 이후', time: null, isCustom: true }]);
}

function getDefaultCustomTime() {
  const t = new Date(Date.now() + 30 * 60000);
  return `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`;
}

export default function BookingScreen({ departure, destination: initialDest, onBack, onConfirm }) {
  const initialStop = initialDest
    ? YEONGJU_STOPS.find((s) => s.id === initialDest.id) ?? null
    : null;

  const [depName, setDepName]        = useState(departure);
  const [query, setQuery]            = useState(initialDest?.name ?? '');
  const [selectedStop, setStop]      = useState(initialStop);
  const [showDropdown, setDropdown]  = useState(false);
  const [selectedTime, setTime]      = useState(null);
  const [customTime, setCustomTime]  = useState(getDefaultCustomTime);
  const [adults, setAdults]          = useState(1);
  const [children, setChildren]      = useState(0);

  const TIME_SLOTS = useMemo(() => getRelativeSlots(), []);
  const depCoords  = getCoordsForName(depName) ?? DEPARTURE_COORDS[departure];

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return YEONGJU_STOPS;
    return YEONGJU_STOPS.filter(
      (s) => s.name.includes(q) || s.address.includes(q)
    );
  }, [query]);

  const mapCenter = selectedStop
    ? [selectedStop.lat, selectedStop.lng]
    : [depCoords.lat, depCoords.lng];

  const mapZoom = selectedStop ? 14 : 12;

  const total        = ADULT_FARE * (adults + children);
  const resolvedTime = selectedTime?.isCustom ? customTime : selectedTime?.time;
  const canConfirm   = selectedStop && selectedTime && (!selectedTime.isCustom || customTime);

  const handleStopSelect = (stop) => {
    setStop(stop);
    setQuery(stop.name);
    setDropdown(false);
  };

  const handleSwap = () => {
    if (!selectedStop) return;
    const oldDepStop = YEONGJU_STOPS.find((s) => s.name === depName) ?? null;
    setDepName(selectedStop.name);
    setStop(oldDepStop);
    setQuery(oldDepStop?.name ?? '');
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      departure:  depName,
      destination: selectedStop,
      time:       resolvedTime,
      timeLabel:  selectedTime.isCustom ? resolvedTime : selectedTime.label,
      passengers: adults + children,
      adults,
      children,
      total,
    });
  };

  return (
    <div className="booking-screen" onClick={() => setDropdown(false)}>
      {/* 헤더 */}
      <div className="booking-header">
        <button className="back-btn" onClick={onBack}>‹</button>
        <h2 className="booking-title">DRT 예약</h2>
        <div style={{ width: 40 }} />
      </div>

      {/* 출발 / 목적지 폼 */}
      <div className="route-form-card">
        <div className="route-field-group">
          <p className="route-label">출발</p>
          <div className="route-input">
            <span className="route-input-text">{depName}</span>
          </div>
        </div>

        <div className="swap-row">
          <button
            className={`swap-btn ${!selectedStop ? 'swap-inactive' : ''}`}
            onClick={handleSwap}
            disabled={!selectedStop}
          >
            ↕
          </button>
        </div>

        <div className="route-field-group" onClick={(e) => e.stopPropagation()}>
          <p className="route-label">목적지</p>
          <input
            className={`route-search-input ${selectedStop ? 'has-value' : ''}`}
            type="text"
            placeholder="목적지 검색 (예: 소수서원)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdown(true);
              if (!e.target.value) setStop(null);
            }}
            onFocus={() => setDropdown(true)}
          />
          {showDropdown && (
            <div className="search-dropdown">
              {filtered.length === 0 ? (
                <p className="dropdown-empty">검색 결과가 없습니다</p>
              ) : (
                filtered.map((stop) => (
                  <button
                    key={stop.id}
                    className={`dropdown-item ${selectedStop?.id === stop.id ? 'active' : ''}`}
                    onClick={() => handleStopSelect(stop)}
                  >
                    <span className="di-name">{stop.name}</span>
                    <span className="di-addr">{stop.address}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 지도 */}
      <div className="booking-map-wrap">
        <MapContainer
          center={[depCoords.lat, depCoords.lng]}
          zoom={12}
          className="booking-map"
          zoomControl={false}
          scrollWheelZoom={true}
          touchZoom={true}
          dragging={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFlyTo center={mapCenter} zoom={mapZoom} />
          <Marker position={[depCoords.lat, depCoords.lng]} icon={depIcon} />
          {selectedStop && (
            <>
              <Marker
                position={[selectedStop.lat, selectedStop.lng]}
                icon={destIcon}
              />
              <Polyline
                positions={[
                  [depCoords.lat, depCoords.lng],
                  [selectedStop.lat, selectedStop.lng],
                ]}
                color="#35C8B4"
                weight={3}
                dashArray="8 5"
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* 탑승 시간 */}
      <div className="booking-card">
        <p className="booking-label">탑승 시간</p>
        <div className="time-row">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.id}
              className={`time-chip ${selectedTime?.id === slot.id ? 'active' : ''}`}
              onClick={() => setTime(slot)}
            >
              <span className="chip-mins">{slot.label}</span>
              {!slot.isCustom && <span className="chip-clock">{slot.time}</span>}
            </button>
          ))}
        </div>

        {selectedTime?.isCustom && (
          <div className="custom-time-row">
            <span className="custom-time-label">시간 직접 설정</span>
            <input
              type="time"
              className="custom-time-input"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
          </div>
        )}

        <p className="time-note">KTX 도착 후 약 10분 내 배차</p>
      </div>

      {/* 인원 선택 */}
      <div className="booking-card">
        <p className="booking-label">인원 선택</p>

        <div className="pax-row">
          <span className="pax-type">어른</span>
          <div className="pax-ctrl">
            <button className="pax-minus" onClick={() => setAdults((a) => Math.max(1, a - 1))} disabled={adults <= 1}>−</button>
            <span className="pax-count">{adults}</span>
            <button className="pax-plus" onClick={() => setAdults((a) => Math.min(8, a + 1))}>+</button>
          </div>
        </div>

        <div className="pax-row">
          <span className="pax-type">어린이</span>
          <div className="pax-ctrl">
            <button className="pax-minus" onClick={() => setChildren((c) => Math.max(0, c - 1))} disabled={children <= 0}>−</button>
            <span className="pax-count">{children}</span>
            <button className="pax-plus" onClick={() => setChildren((c) => Math.min(8, c + 1))}>+</button>
          </div>
        </div>
      </div>

      {/* 요금 안내 */}
      <div className="fare-info">
        <span className="fare-unit">1인 {ADULT_FARE.toLocaleString()}원</span>
        <span className="fare-divider">·</span>
        <span className="fare-total">총 <strong>{total.toLocaleString()}원</strong></span>
      </div>

      {/* 예약 확정 버튼 */}
      <div className="confirm-wrap">
        <button
          className={`confirm-btn ${!canConfirm ? 'disabled' : ''}`}
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          예약 확정하기
        </button>
      </div>
    </div>
  );
}
