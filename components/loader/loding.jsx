import React from 'react';

const StokiqLoader = () => {
  return (
    <div className="flex my-1">
      {/* Definitions for Gradients */}
      <svg height="0" width="0" viewBox="0 0 64 64" className="absolute">
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="b">
            <stop stopColor="#973BED"></stop>
            <stop stopColor="#007CFF" offset="1"></stop>
          </linearGradient>
          
          <linearGradient gradientUnits="userSpaceOnUse" y2="0" x2="0" y1="64" x1="0" id="c">
            <stop stopColor="#FFC800"></stop>
            <stop stopColor="#F0F" offset="1"></stop>
            <animateTransform 
              repeatCount="indefinite" 
              keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1" 
              keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" 
              dur="8s" 
              values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32" 
              type="rotate" 
              attributeName="gradientTransform">
            </animateTransform>
          </linearGradient>
          
          <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="d">
            <stop stopColor="#00E0ED"></stop>
            <stop stopColor="#00DA72" offset="1"></stop>
          </linearGradient>
        </defs>
      </svg>

      {/* LETTER S */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" className="inline-block">
        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#b)" d="M 52 12 H 14 V 32 H 52 V 54 H 14" className="animate-dash" pathLength="360"></path>
      </svg>

      {/* LETTER T */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" className="inline-block">
        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#d)" d="M 10 12 H 54 M 32 12 V 54" className="animate-dash" pathLength="360"></path>
      </svg>

      {/* LETTER O (Spinning) */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" className="inline-block" style={{ transformOrigin: 'center' }}>
        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#c)" d="M 32 11 A 21 21 0 1 1 32 53 A 21 21 0 1 1 32 11" className="animate-spin-complex origin-center" pathLength="360"></path>
      </svg>

      {/* LETTER K */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" className="inline-block">
        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#b)" d="M 16 10 V 54 M 50 10 L 16 32 L 50 54" className="animate-dash" pathLength="360"></path>
      </svg>

      {/* LETTER I */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" className="inline-block">
        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#d)" d="M 32 10 V 54" className="animate-dash" pathLength="360"></path>
      </svg>

      {/* LETTER Q (Spinning) */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" className="inline-block" style={{ transformOrigin: 'center' }}>
         <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#c)" d="M 32 11 A 21 21 0 1 1 32 53 A 21 21 0 1 1 32 11 M 42 42 L 56 56" className="animate-spin-complex origin-center" pathLength="360"></path>
      </svg>
    </div>
  );
};

export default StokiqLoader;