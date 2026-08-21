/**
 * Module: HeroCanvasArt meditation illustration
 * Purpose: Render the responsive SVG meditation figure, crown geometry, and sequential mental-health labels
 * Used by: LandingPage in frontend/src/App.js
 * Dependencies: React, Framer Motion, hero-canvas.css
 * Public functions: HeroCanvasArt()
 * Side effects: Runs timed label sequencing and transform-only pointer parallax animation
 */
import React, { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const TAG_SEQUENCE = [
  { id: "t1", text: "Pikiran berlebih", side: "top-left", x: 310, y: 350, fromX: 435, fromY: 280 },
  { id: "t2", text: "Kelelahan mental", side: "bottom-left", x: 320, y: 430, fromX: 440, fromY: 360 },
  { id: "t3", text: "Rasa cemas", side: "top-right", x: 610, y: 330, fromX: 525, fromY: 280 },
  { id: "t4", text: "Kehabisan energi", side: "bottom-right", x: 600, y: 480, fromX: 520, fromY: 370 },
];

export function HeroCanvasArt({ mouseX = 0, mouseY = 0, isDark = true }) {
  const filterId = useId();
  const gradLineId = useId();
  const gradGlowId = useId();
  const gradAuraId = useId();

  // Cycling states for intro-outro text animation
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % TAG_SEQUENCE.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentTags = [TAG_SEQUENCE[cycleIndex]];

  // Ambient floating sparkles / stardust
  const sparkles = useMemo(
    () => [
      { id: 1, cx: 240, cy: 180, r: 2.2, delay: 0, dur: 4.2 },
      { id: 2, cx: 280, cy: 300, r: 1.8, delay: 1.1, dur: 5.0 },
      { id: 3, cx: 330, cy: 450, r: 2.5, delay: 0.6, dur: 4.6 },
      { id: 4, cx: 220, cy: 530, r: 1.6, delay: 2.2, dur: 5.5 },
      { id: 5, cx: 480, cy: 140, r: 3.0, delay: 0.3, dur: 3.8 },
      { id: 6, cx: 640, cy: 220, r: 2.4, delay: 1.5, dur: 4.8 },
      { id: 7, cx: 710, cy: 340, r: 1.9, delay: 0.8, dur: 5.2 },
      { id: 8, cx: 660, cy: 480, r: 2.6, delay: 2.5, dur: 4.5 },
      { id: 9, cx: 740, cy: 560, r: 1.7, delay: 1.9, dur: 5.6 },
      { id: 10, cx: 380, cy: 620, r: 2.0, delay: 0.5, dur: 4.4 },
      { id: 11, cx: 580, cy: 630, r: 2.1, delay: 1.7, dur: 4.9 },
    ],
    []
  );

  return (
    <div className="hero-art-wrapper" aria-hidden="true">
      {/* ================= LIGHT WAVE RIPPLES (GELOMBANG CAHAYA) ================= */}
      <div className="light-waves-container">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`light-wave-ring wave-${i + 1}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: [0.65, 1.15, 1.65, 2.1],
              opacity: [0, 0.65, 0.35, 0],
            }}
            transition={{
              duration: 8.5,
              repeat: Infinity,
              delay: i * 1.7,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        ))}
        {/* Core luminous glow center */}
        <div className="light-wave-core" />
      </div>

      {/* ================= MAIN VECTOR SVG MEDITATING FIGURE & MANDALA ================= */}
      <motion.svg
        className="hero-art-svg"
        viewBox="0 0 960 760"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          x: mouseX * 10,
          y: mouseY * 6,
        }}
      >
        <defs>
          <filter id={`glow-${filterId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`intenseGlow-${filterId}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id={`coreHalo-${gradGlowId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbf0" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#f5ca88" stopOpacity="0.75" />
            <stop offset="65%" stopColor="#d49557" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d49557" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`whiteGoldLine-${gradLineId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="50%" stopColor="#faecd0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f3d8a8" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id={`accentRibbon-${gradAuraId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8a87c" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c97d52" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Radiant Light Core Behind Head & Crown */}
        <g className="hero-light-burst" filter={`url(#intenseGlow-${filterId})`}>
          <circle cx="480" cy="255" r="95" fill={`url(#coreHalo-${gradGlowId})`} />
          <circle cx="480" cy="255" r="28" fill="#ffffff" opacity="0.95" />
        </g>

        {/* Ambient Stardust Sparkles */}
        <g className="hero-sparkles">
          {sparkles.map((sp) => (
            <motion.circle
              key={sp.id}
              cx={sp.cx}
              cy={sp.cy}
              r={sp.r}
              fill="#fff9e6"
              filter={`url(#glow-${filterId})`}
              animate={{
                opacity: [0.2, 0.95, 0.2],
                scale: [0.8, 1.35, 0.8],
                y: [0, -10, 0],
              }}
              transition={{
                duration: sp.dur,
                delay: sp.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </g>

        {/* ================= INTRICATE SPIROGRAPH / THOUGHT MANDALA ================= */}
        <g className="hero-spirograph" transform="translate(480, 245)" filter={`url(#glow-${filterId})`}>
          {/* Subtle Outer Geometry Rotation */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 110, repeat: Infinity, ease: "linear" }}
          >
            {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle, i) => (
              <ellipse
                key={i}
                transform={`rotate(${angle})`}
                cx="0"
                cy="-65"
                rx="65"
                ry="115"
                stroke="url(#whiteGoldLine)"
                strokeWidth="1.25"
                strokeOpacity="0.65"
                fill="none"
              />
            ))}
          </motion.g>

          {/* Inner Intricate Flower & Sacred Geometry */}
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 85, repeat: Infinity, ease: "linear" }}
          >
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
              <g key={i} transform={`rotate(${angle})`}>
                <ellipse
                  cx="0"
                  cy="-35"
                  rx="32"
                  ry="60"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeOpacity="0.8"
                  fill="none"
                />
                <circle cx="0" cy="-95" r="2.5" fill="#fff5dc" />
              </g>
            ))}
            {/* Concentric rings */}
            <circle cx="0" cy="0" r="38" stroke="#ffffff" strokeWidth="1.4" strokeOpacity="0.85" fill="none" />
            <circle cx="0" cy="0" r="75" stroke="#f6ddb2" strokeWidth="1" strokeDasharray="3 4" strokeOpacity="0.6" fill="none" />
            <circle cx="0" cy="0" r="125" stroke="#f6ddb2" strokeWidth="0.8" strokeOpacity="0.35" fill="none" />
          </motion.g>
        </g>

        {/* Floating Wavy Ribbon / Connector Accents */}
        <g className="hero-ribbons">
          <motion.path
            d="M 410 240 C 350 260 260 260 210 280 C 180 292 160 310 140 320"
            stroke="url(#accentRibbon)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={{
              d: [
                "M 410 240 C 350 260 260 260 210 280 C 180 292 160 310 140 320",
                "M 410 238 C 345 255 265 268 205 275 C 175 288 155 315 135 318",
                "M 410 240 C 350 260 260 260 210 280 C 180 292 160 310 140 320",
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.path
            d="M 550 240 C 610 260 700 250 740 230 C 765 218 780 210 795 220 C 810 230 790 250 770 260"
            stroke="url(#accentRibbon)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={{
              d: [
                "M 550 240 C 610 260 700 250 740 230 C 765 218 780 210 795 220 C 810 230 790 250 770 260",
                "M 550 242 C 615 255 695 258 745 235 C 770 222 785 208 798 222 C 812 234 788 252 768 262",
                "M 550 240 C 610 260 700 250 740 230 C 765 218 780 210 795 220 C 810 230 790 250 770 260",
              ],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>

        {/* Dynamic Curved Bezier Connectors to Active Tags */}
        <g className="hero-active-connectors">
          {currentTags.map((tag) => (
            <motion.path
              key={`${cycleIndex}-${tag.id}`}
              d={`M ${tag.fromX} ${tag.fromY} Q ${(tag.fromX + tag.x) / 2} ${tag.y + 15} ${tag.x + 30} ${tag.y + 15}`}
              stroke="#faecd0"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ))}
        </g>

        {/* ================= PRECISE MEDITATING SILHOUETTE VECTOR ================= */}
        <g className="hero-meditating-figure" filter={`url(#glow-${filterId})`}>
          {/* Head & Face Contour */}
          <path
            d="M 458 320 C 454 350 464 380 480 395 C 496 380 506 350 502 320 C 500 290 460 290 458 320 Z"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Serene Facial Features (Matching the user screenshot!) */}
          {/* Left Eyebrow & Eyelid */}
          <path d="M 466 336 Q 472 331 477 334" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 466 342 Q 471 346 476 342" stroke="#ffffff" strokeWidth="1.9" strokeLinecap="round" fill="none" />

          {/* Right Eyebrow & Eyelid */}
          <path d="M 483 334 Q 488 331 494 336" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 484 342 Q 489 346 494 342" stroke="#ffffff" strokeWidth="1.9" strokeLinecap="round" fill="none" />

          {/* Third Eye Bindi / Teardrop Jewel */}
          <path d="M 480 323 C 478 326 478 329 480 331 C 482 329 482 326 480 323 Z" fill="#ffffff" />

          {/* Nose & Peaceful Smile */}
          <path d="M 480 341 L 480 354 Q 483 356 485 354" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 473 365 Q 480 371 487 365" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Hair bun & Crown Lotus */}
          <path
            d="M 458 316 C 452 290 470 268 480 260 C 490 268 508 290 502 316"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Crown Lotus Petals Blooming above Head */}
          <g className="crown-lotus" transform="translate(480, 255)">
            <path d="M 0 0 C -8 -16 -12 -32 0 -42 C 12 -32 8 -16 0 0 Z" stroke="#ffffff" strokeWidth="1.8" fill="#fffbe8" fillOpacity="0.4" />
            <path d="M 0 0 C -18 -12 -30 -22 -26 -35 C -12 -32 -4 -18 0 0 Z" stroke="#ffffff" strokeWidth="1.5" fill="none" />
            <path d="M 0 0 C 18 -12 30 -22 26 -35 C 12 -32 4 -18 0 0 Z" stroke="#ffffff" strokeWidth="1.5" fill="none" />
            <path d="M 0 0 C -22 2 -38 0 -36 -14 C -22 -16 -10 -8 0 0 Z" stroke="#ffffff" strokeWidth="1.4" fill="none" />
            <path d="M 0 0 C 22 2 38 0 36 -14 C 22 -16 10 -8 0 0 Z" stroke="#ffffff" strokeWidth="1.4" fill="none" />
            <circle cx="0" cy="-2" r="3.5" fill="#ffffff" />
          </g>

          {/* Neck & Graceful Collarbones */}
          <path d="M 472 390 C 472 402 462 414 445 424" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M 488 390 C 488 402 498 414 515 424" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* Collarbone subtle curves */}
          <path d="M 456 422 Q 468 426 476 430" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M 504 422 Q 492 426 484 430" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85" />

          {/* Shoulders, Upper Body & Chest Outlines */}
          <path
            d="M 445 424 C 420 435 398 460 388 495"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 515 424 C 540 435 562 460 572 495"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Torso & Bust Curves */}
          <path
            d="M 445 490 C 452 506 468 514 480 514 C 492 514 508 506 515 490"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M 436 465 C 445 520 442 560 430 600" stroke="#ffffff" strokeWidth="2.4" fill="none" />
          <path d="M 524 465 C 515 520 518 560 530 600" stroke="#ffffff" strokeWidth="2.4" fill="none" />

          {/* Navel Teardrop */}
          <path d="M 480 572 C 478.5 575 478.5 578 480 580 C 481.5 578 481.5 575 480 572 Z" fill="#ffffff" />

          {/* Left Arm & Gyan Mudra Hand */}
          <path
            d="M 388 495 C 378 535 372 580 376 620 C 378 640 388 656 405 660 C 418 662 432 654 445 640"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Left Gyan Mudra Hand (Index + Thumb circle, 3 fingers extended outwards) */}
          <path
            d="M 374 615 C 362 612 346 620 342 632 C 340 642 350 648 360 645 C 368 642 374 632 372 624 Z"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M 342 632 C 330 634 322 626 324 618 C 326 612 334 614 344 624" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 346 638 C 334 644 326 638 328 630 C 330 626 338 628 346 634" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 352 642 C 342 650 336 646 338 638" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" fill="none" />

          {/* Right Arm & Gyan Mudra Hand */}
          <path
            d="M 572 495 C 582 535 588 580 584 620 C 582 640 572 656 555 660 C 542 662 528 654 515 640"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Gyan Mudra Hand */}
          <path
            d="M 586 615 C 598 612 614 620 618 632 C 620 642 610 648 600 645 C 592 642 586 632 588 624 Z"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M 618 632 C 630 634 638 626 636 618 C 634 612 626 614 616 624" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 614 638 C 626 644 634 638 632 630 C 630 626 622 628 614 634" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 608 642 C 618 650 624 646 622 638" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" fill="none" />

          {/* Padmasana Crossed Legs Base (Full Lotus Pose) */}
          <path
            d="M 430 600 C 390 608 350 630 338 652 C 328 672 344 686 376 684 C 418 680 455 655 480 642 C 505 655 542 680 584 684 C 616 686 632 672 622 652 C 610 630 570 608 530 600"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Folded Ankles and Soles in Lotus */}
          <path
            d="M 370 675 C 400 690 440 696 480 696 C 520 696 560 690 590 675"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 415 668 C 445 682 468 685 480 685 C 492 685 515 682 545 668"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 345 665 C 362 650 385 652 405 662"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 615 665 C 598 650 575 652 555 662"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Water / Ground Calm Waves underneath */}
          <g className="hero-ground-ripples" stroke="#ffffff" strokeLinecap="round" opacity="0.85">
            <line x1="280" y1="706" x2="680" y2="706" strokeWidth="1.6" />
            <line x1="320" y1="715" x2="640" y2="715" strokeWidth="1.3" />
            <line x1="365" y1="723" x2="595" y2="723" strokeWidth="1.1" />
            <line x1="415" y1="730" x2="545" y2="730" strokeWidth="0.9" />
          </g>
        </g>
      </motion.svg>

      {/* ================= INTRO-OUTRO CYCLING THOUGHT BADGES ================= */}
      <div className="hero-floating-tags" aria-label="Label pikiran yang sedang dirasakan">
        <AnimatePresence mode="wait">
          {currentTags.map((tag) => (
            <motion.div
              key={`${cycleIndex}-${tag.id}`}
              className={`hero-badge badge-${tag.side}`}
              style={{
                left: `${(tag.x / 960) * 100}%`,
                top: `${(tag.y / 760) * 100}%`,
              }}
            >
              <span>{tag.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default HeroCanvasArt;
