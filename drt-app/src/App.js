import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import HomeScreen    from './components/HomeScreen';
import BookingScreen from './components/BookingScreen';
import WaitingScreen from './components/WaitingScreen';
import ReviewScreen  from './components/ReviewScreen';
import SplashScreen  from './components/SplashScreen';
import PopupAd       from './components/PopupAd';

export default function App() {
  const [screen, setScreen]             = useState('home');
  const [departure, setDeparture]       = useState('영주역');
  const [selectedDest, setSelectedDest] = useState(null);
  const [bookingInfo, setBookingInfo]   = useState(null);
  const [navKey, setNavKey]             = useState(0);
  const [showAd, setShowAd]             = useState(true);
  const [showSplash, setShowSplash]     = useState(true);

  // 0.7s 표시 + 0.3s 페이드 = 1s 후 언마운트
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const navigate = (newScreen) => {
    setNavKey((k) => k + 1);
    setScreen(newScreen);
  };

  const goToBooking = (dest) => { setSelectedDest(dest); navigate('booking'); };
  const goToWaiting = (info) => { setBookingInfo(info);  navigate('waiting'); };
  const goToReview  = ()     => { navigate('review'); };
  const goHome      = ()     => {
    setSelectedDest(null);
    setBookingInfo(null);
    navigate('home');
  };

  return (
    <LanguageProvider>
      <div key={navKey} className="screen-enter">
        {screen === 'home' && (
          <HomeScreen
            departure={departure}
            setDeparture={setDeparture}
            onSelectDest={goToBooking}
          />
        )}
        {screen === 'booking' && (
          <BookingScreen
            departure={departure}
            destination={selectedDest}
            onBack={goHome}
            onConfirm={goToWaiting}
          />
        )}
        {screen === 'waiting' && (
          <WaitingScreen
            bookingInfo={bookingInfo}
            onBack={goHome}
            onArrived={goToReview}
          />
        )}
        {screen === 'review' && (
          <ReviewScreen
            bookingInfo={bookingInfo}
            onDone={goHome}
          />
        )}
      </div>

      {showAd && screen === 'home' && (
        <PopupAd onClose={() => setShowAd(false)} />
      )}

      {/* 스플래시 화면 — 최상단 오버레이 */}
      {showSplash && <SplashScreen />}
    </LanguageProvider>
  );
}
