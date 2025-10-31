'use client';

import { useEffect, useRef, useState } from 'react';

interface PrizeWheelProps {
  names: string[];
  onSpinComplete: (winner: string) => void;
  isSpinning: boolean;
  fullscreen?: boolean;
}

export function PrizeWheel({
  names,
  onSpinComplete,
  isSpinning,
  fullscreen = false
}: PrizeWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [canvasSize, setCanvasSize] = useState(500);
  const animationRef = useRef<number | undefined>(undefined);

  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
    '#F8B739',
    '#52B788'
  ];

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxSize = fullscreen
          ? Math.min(containerWidth - 64, 1000)
          : Math.min(containerWidth, 500);
        setCanvasSize(maxSize);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [fullscreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || names.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const anglePerSegment = (2 * Math.PI) / names.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    names.forEach((name, i) => {
      const angle = i * anglePerSegment;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + anglePerSegment);
      ctx.lineTo(0, 0);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(angle + anglePerSegment / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      const fontSize = fullscreen ? 20 : 16;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      const maxWidth = radius - 20;
      const text = name.length > 15 ? name.substring(0, 15) + '...' : name;
      ctx.fillText(text, radius - 15, 5, maxWidth);
      ctx.restore();
    });

    ctx.restore();

    ctx.beginPath();
    ctx.fillStyle = '#333';
    ctx.arc(centerX, 20, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.moveTo(centerX, 35);
    ctx.lineTo(centerX - 10, 5);
    ctx.lineTo(centerX + 10, 5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }, [names, rotation, colors, fullscreen, canvasSize]);

  useEffect(() => {
    if (isSpinning && names.length > 0) {
      const spinDuration = 4000;
      const startTime = Date.now();
      const startRotation = rotation;
      const spins = 5 + Math.random() * 3;
      const randomOffset = Math.random() * (2 * Math.PI);
      const targetRotation = startRotation + spins * 2 * Math.PI + randomOffset;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        const currentRotation =
          startRotation + (targetRotation - startRotation) * easeOut;
        setRotation(currentRotation);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          const normalizedRotation = currentRotation % (2 * Math.PI);
          const segmentAngle = (2 * Math.PI) / names.length;
          const winningIndex =
            Math.floor(
              (2 * Math.PI - normalizedRotation + (3 * Math.PI) / 2) /
                segmentAngle
            ) % names.length;
          onSpinComplete(names[winningIndex]);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isSpinning, names, onSpinComplete]);

  return (
    <div ref={containerRef} className="flex justify-center w-full">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="max-w-full h-auto"
      />
    </div>
  );
}
