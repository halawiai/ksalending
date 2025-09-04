'use client';

import { useEffect, useRef, useState } from 'react';

interface TouchGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  className?: string;
}

export function TouchGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  className = ''
}: TouchGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start tracking swipe
      setTouchEnd(null);
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (e.touches.length === 2 && onPinch) {
      // Two touches - start tracking pinch
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && onPinch && initialDistance) {
      // Handle pinch gesture
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;
      onPinch(scale);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart) return;

    if (e.changedTouches.length === 1) {
      setTouchEnd({
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      });
    }

    setInitialDistance(null);
  };

  useEffect(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Determine primary direction
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      // Vertical swipe
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
      } else if (isDownSwipe && onSwipeDown) {
        onSwipeDown();
      }
    }
  }, [touchEnd, touchStart, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}