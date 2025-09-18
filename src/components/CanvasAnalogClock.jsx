import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGlobalStore } from '../hooks/useGlobalStore';
import './CanvasAnalogClock.css';

const CanvasAnalogClock = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { state } = useGlobalStore();
  
  // Get settings for showing date and digital time
  const showAnalogDate = state.settings?.showAnalogDate !== false; // Default to true
  const showAnalogDigitalTime = state.settings?.showAnalogDigitalTime !== false; // Default to true

  // Clock configuration - easily customizable
  const clockConfig = {
    size: 280,
    centerX: 140,
    centerY: 140,
    outerRadius: 130,
    innerRadius: 120,
    hourHandLength: 60,
    minuteHandLength: 85,
    secondHandLength: 100,
    colors: {
      background: '#1a1a2e',
      bezel: '#2d2d4a',
      face: '#0f0f23',
      hourMarkers: '#ffffff',
      numbers: '#ffffff',
      hourHand: '#e0e0e0',
      minuteHand: '#f0f0f0',
      secondHand: '#ff4757',
      center: '#ffffff'
    }
  };

  const drawClock = useCallback((ctx, time) => {
    const { size, centerX, centerY, outerRadius, innerRadius, colors } = clockConfig;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Draw outer bezel
    const bezelGradient = ctx.createRadialGradient(
      centerX * 0.7, centerY * 0.7, 0,
      centerX, centerY, outerRadius
    );
    bezelGradient.addColorStop(0, 'rgba(120, 120, 140, 0.9)');
    bezelGradient.addColorStop(0.7, 'rgba(60, 60, 80, 0.95)');
    bezelGradient.addColorStop(1, 'rgba(20, 20, 30, 1)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = bezelGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(80, 80, 100, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw clock face
    const faceGradient = ctx.createRadialGradient(
      centerX * 0.8, centerY * 0.8, 0,
      centerX, centerY, innerRadius
    );
    faceGradient.addColorStop(0, 'rgba(45, 45, 60, 0.95)');
    faceGradient.addColorStop(0.5, 'rgba(25, 25, 40, 0.98)');
    faceGradient.addColorStop(1, 'rgba(10, 10, 20, 1)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = faceGradient;
    ctx.fill();

    // Draw hour markers and numbers
    ctx.font = 'bold 18px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const isMainHour = i % 3 === 0;
      
      // Draw hour markers
      const outerX = centerX + Math.cos(angle) * (innerRadius - 10);
      const outerY = centerY + Math.sin(angle) * (innerRadius - 10);
      const innerX = centerX + Math.cos(angle) * (innerRadius - (isMainHour ? 30 : 20));
      const innerY = centerY + Math.sin(angle) * (innerRadius - (isMainHour ? 30 : 20));
      
      ctx.beginPath();
      ctx.moveTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
      ctx.strokeStyle = colors.hourMarkers;
      ctx.lineWidth = isMainHour ? 3 : 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Draw numbers
      const numX = centerX + Math.cos(angle) * (innerRadius - 45);
      const numY = centerY + Math.sin(angle) * (innerRadius - 45);
      
      ctx.fillStyle = colors.numbers;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;
      ctx.fillText(i.toString(), numX, numY);
      ctx.shadowBlur = 0;
    }

    // Get time components
    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const milliseconds = time.getMilliseconds();

    // Calculate angles
    const secondAngle = ((seconds + milliseconds / 1000) * 6 - 90) * Math.PI / 180;
    const minuteAngle = ((minutes + seconds / 60) * 6 - 90) * Math.PI / 180;
    const hourAngle = ((hours + minutes / 60) * 30 - 90) * Math.PI / 180;

    // Draw hour hand
    const drawHand = (angle, length, width, color, gradient = null) => {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      
      ctx.beginPath();
      ctx.moveTo(-width/2, 0);
      ctx.lineTo(-width/4, -length);
      ctx.lineTo(width/4, -length);
      ctx.lineTo(width/2, 0);
      ctx.closePath();
      
      if (gradient) {
        const handGradient = ctx.createLinearGradient(-width/2, 0, width/2, 0);
        handGradient.addColorStop(0, gradient.start);
        handGradient.addColorStop(0.5, gradient.middle);
        handGradient.addColorStop(1, gradient.end);
        ctx.fillStyle = handGradient;
      } else {
        ctx.fillStyle = color;
      }
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    };

    // Draw hands
    drawHand(hourAngle, clockConfig.hourHandLength, 8, colors.hourHand, {
      start: 'rgba(240, 240, 250, 0.95)',
      middle: 'rgba(200, 200, 210, 0.85)',
      end: 'rgba(160, 160, 170, 0.75)'
    });

    drawHand(minuteAngle, clockConfig.minuteHandLength, 5, colors.minuteHand, {
      start: 'rgba(245, 245, 255, 0.98)',
      middle: 'rgba(215, 215, 225, 0.88)',
      end: 'rgba(185, 185, 195, 0.78)'
    });

    // Second hand (thin line)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(secondAngle);
    
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(0, -clockConfig.secondHandLength);
    ctx.strokeStyle = colors.secondHand;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255, 71, 87, 0.6)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    
    ctx.restore();

    // Draw center circle
    const centerGradient = ctx.createRadialGradient(
      centerX - 3, centerY - 3, 0,
      centerX, centerY, 12
    );
    centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    centerGradient.addColorStop(0.5, 'rgba(220, 220, 230, 0.85)');
    centerGradient.addColorStop(1, 'rgba(180, 180, 190, 0.75)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = centerGradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 0;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
  }, [clockConfig]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const now = new Date();
    setCurrentTime(now);
    
    drawClock(ctx, now);
    animationRef.current = requestAnimationFrame(animate);
  }, [drawClock]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = clockConfig.size;
    canvas.height = clockConfig.size;

    // Start animation
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, clockConfig.size]);

  // Format time for digital display
  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="canvas-analog-clock">
      <canvas
        ref={canvasRef}
        className="clock-canvas"
      />
      
      {/* Digital Time Display - Only show if enabled in settings */}
      {(showAnalogDigitalTime || showAnalogDate) && (
        <div className="canvas-digital-display">
          {showAnalogDigitalTime && (
            <div className="canvas-digital-time">{formatTime()}</div>
          )}
          {showAnalogDate && (
            <div className="canvas-digital-date">{formatDate()}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CanvasAnalogClock;
