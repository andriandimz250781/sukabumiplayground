'use client';

import React from 'react';
import Barcode from 'react-barcode';
import { ToyBrick } from 'lucide-react';

interface Member {
  childName: string;
  barcode: string;
  branch: string;
  gender: string;
  expiryDate: string;
}

interface MemberCardProps {
  member: Member | null;
  cardRef: React.RefObject<HTMLDivElement>;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, cardRef }) => {
  if (!member) return null;

  let gradientStyle: React.CSSProperties;
  let textColor: string;
  let mutedTextColor: string;
  let barcodeColor: string;

  if (member.gender === 'Laki-laki') {
    // Dark Red to Dark Blue gradient for boys
    gradientStyle = { 
      background: 'linear-gradient(135deg, #8B0000 10%, #00008B 100%)', 
    };
    textColor = 'white';
    mutedTextColor = 'rgba(255, 255, 255, 0.85)';
    barcodeColor = 'white';
  } else if (member.gender === 'Perempuan') {
    // Pink to Yellow gradient for girls
    gradientStyle = { 
      background: 'linear-gradient(135deg, #FFC0CB 10%, #FFFF00 100%)', 
    };
    textColor = 'black'; // Dark text for light background
    mutedTextColor = 'rgba(0, 0, 0, 0.7)';
    barcodeColor = 'black';
  } else {
    // Default gradient
    gradientStyle = { 
      background: 'linear-gradient(135deg, #EE9AE5 10%, #5961F9 100%)', 
    };
    textColor = 'white';
    mutedTextColor = 'rgba(255, 255, 255, 0.85)';
    barcodeColor = 'white';
  }

  return (
    <div
      ref={cardRef}
      className="w-[350px] h-[220px] rounded-xl shadow-lg p-5 flex flex-col justify-between font-sans"
      style={gradientStyle}
    >
      {/* Header */}
      <div className="flex justify-between items-start w-full">
        <div className='pt-1'>
          <ToyBrick className="h-9 w-9" style={{ color: textColor }} />
        </div>
        <div className="flex-grow text-center">
          <h1 className="text-2xl font-bold font-headline leading-tight" style={{ color: textColor }}>
              Sukabumi Playground
          </h1>
        </div>
         <div className="w-9 h-9" />
      </div>
      
      {/* Body */}
      <div className="flex flex-col items-center -mt-2">
        <p className="text-xl font-bold font-headline" style={{ color: textColor }}>{member.childName}</p>
        <div className="w-full px-4 mt-1">
          {member.barcode && (
            <Barcode
              value={member.barcode}
              format="CODE128"
              width={1}
              height={30}
              displayValue={false}
              background="transparent"
              lineColor={barcodeColor}
              margin={0}
            />
          )}
        </div>
        <p className="text-[9px] tracking-widest font-sans" style={{ color: mutedTextColor }}>{member.barcode}</p>
      </div>

      {/* Footer */}
      <div className="flex justify-between w-full text-xs font-medium">
        <span style={{ color: mutedTextColor }}>Masa Berlaku s/d</span>
        <span style={{ color: textColor }}>{member.expiryDate}</span>
      </div>
    </div>
  );
};
