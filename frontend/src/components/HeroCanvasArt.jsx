import React, { useId, useMemo } from "react";
import { motion } from "framer-motion";

export function HeroCanvasArt({ mouseX = 0, mouseY = 0, isDark = true }) {
  const filterId = useId();
  const gradAuraId = useId();
  const gradLineId = useId();
  const gradGlowId = useId();

  // Generate ambient floating sparkles/stardust
  const sparkles = useMemo(
    () => [
      { id: 1, cx: 280, cy: 320, r: 2.2, delay: 0, dur: 4.5 },
      { id: 2, cx: 340, cy: 480, r: 1.8, delay: 1.2, dur: 5.2 },
      { id: 3, cx: 620, cy: 340, r: 2.5, delay: 0.7, dur: 4.8 },
      { id: 4, cx: 680, cy: 520, r: 2.0, delay: 2.1, dur: 5.5 },
      { id: 5, cx: 480, cy: 220, r: 2.8, delay: 1.5, dur: 3.8 },
      { id: 6, cx: 440, cy: 620, r: 1.6, delay: 0.3, dur: 4.2 },
      { id: 7, cx: 560, cy: 640, r: 2.1, delay: 2.7, dur: 4.6 },
      { id: 8, cx: 310, cy: 190, r: 1.5, delay: 1.8, dur: 5.0 },
      { id: 9, cx: 650, cy: 210, r: 1.9, delay: 0.9, dur: 4.4 },
    ],
    []
  );

  // Generate sacred geometry spirograph petal paths
  const mandalaRays = useMemo(() => {
    const rays = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      rays.push(angle);
    }
    return rays;
  }, []);

  return (
    <div className="hero-art-wrapper" aria-hidden="true">
      {/* Background Concentric Glowing Aura Rings */}
      <div className="aura-rings-container">
        <motion.div
          className="aura-ring aura-ring-1"
          animate={{ scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="aura-ring aura-ring-2"
          animate={{ scale: [1, 1.06, 1], opacity: [0.65, 0.85, 0.65] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="aura-ring aura-ring-3"
          animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.65, 0.45] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="aura-ring aura-ring-4"
          animate={{ scale: [1, 1.05, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>

      {/* Main Vector SVG: Figure, Mandala, Connectors & Ambient Glow */}
      <motion.svg
        className="hero-art-svg"
        viewBox="0 0 960 760"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          x: mouseX * 12,
          y: mouseY * 8,
        }}
      >
        <defs>
          <filter id={`glow-${filterId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`softGlow-${filterId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="16" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id={`coreGlow-${gradGlowId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff4d4" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#e5b06d" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#c98a66" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c98a66" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`auraLine-${gradLineId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#faecd0" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#dfa767" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9a714a" stopOpacity="0.5" />
          </linearGradient>

          <radialGradient id={`bubbleBackdrop-${gradAuraId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2af70" stopOpacity={isDark ? "0.35" : "0.22"} />
            <stop offset="60%" stopColor="#c98a66" stopOpacity={isDark ? "0.12" : "0.08"} />
            <stop offset="100%" stopColor="#c98a66" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Central Core Light Radiance */}
        <g className="hero-head-core" filter={`url(#softGlow-${filterId})`}>
          <circle cx="480" cy="270" r="140" fill={`url(#coreGlow-${gradGlowId})`} opacity="0.65" />
          <circle cx="480" cy="270" r="45" fill="#fff9eb" opacity="0.9" filter={`url(#glow-${filterId})`} />
        </g>

        {/* Ambient Sparkles */}
        <g className="hero-sparkles">
          {sparkles.map((sp) => (
            <motion.circle
              key={sp.id}
              cx={sp.cx}
              cy={sp.cy}
              r={sp.r}
              fill="#fff7de"
              filter={`url(#glow-${filterId})`}
              animate={{
                opacity: [0.2, 0.95, 0.2],
                scale: [0.8, 1.3, 0.8],
                y: [0, -8, 0],
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

        {/* Floating Bubble Backing Orbs (Glowing misty halos behind tags) */}
        <circle cx="355" cy="385" r="75" fill={`url(#bubbleBackdrop-${gradAuraId})`} />
        <circle cx="480" cy="460" r="65" fill={`url(#bubbleBackdrop-${gradAuraId})`} />
        <circle cx="615" cy="520" r="70" fill={`url(#bubbleBackdrop-${gradAuraId})`} />
        <circle cx="585" cy="375" r="65" fill={`url(#bubbleBackdrop-${gradAuraId})`} />

        {/* Connecting Curved Bezier Lines from Head/Body to Floating Tags */}
        <g className="hero-connector-lines">
          {/* Connector to Top-Left tag (Overthinking) */}
          <motion.path
            d="M 440 320 C 395 340 365 358 355 385"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />

          {/* Connector from Top-Left to Mid-Center (Stress / Burnout) */}
          <motion.path
            d="M 355 410 C 385 450 430 460 460 460"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 1.6, delay: 0.2, ease: "easeOut" }}
          />

          {/* Connector to Right side (Dreshing / Stress / Burnout) */}
          <motion.path
            d="M 520 460 C 555 460 575 485 605 515"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 1.6, delay: 0.4, ease: "easeOut" }}
          />

          {/* Connector to Upper Right */}
          <motion.path
            d="M 520 320 C 550 340 568 355 580 375"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.3"
            strokeDasharray="3 3"
            fill="none"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1.2, delay: 0.6 }}
          />
        </g>

        {/* Sacred Geometry Spirograph / Thought Mandala Above Head */}
        <g className="hero-mandala" transform="translate(480, 270)">
          {/* Outer Rotating Mandala */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          >
            {mandalaRays.map((angle, idx) => (
              <g key={idx} transform={`rotate(${angle})`}>
                <ellipse
                  cx="0"
                  cy="-75"
                  rx="48"
                  ry="95"
                  stroke={`url(#auraLine-${gradLineId})`}
                  strokeWidth="1.1"
                  strokeOpacity="0.45"
                  fill="none"
                />
                <circle
                  cx="0"
                  cy="-140"
                  r="3.5"
                  fill="#ffe9be"
                  fillOpacity="0.6"
                />
              </g>
            ))}
          </motion.g>

          {/* Counter-rotating Inner Intricate Geometry */}
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          >
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
              <ellipse
                key={i}
                transform={`rotate(${angle})`}
                cx="0"
                cy="-45"
                rx="35"
                ry="65"
                stroke="#fff2d1"
                strokeWidth="1"
                strokeOpacity="0.65"
                fill="none"
              />
            ))}
            <circle cx="0" cy="0" r="50" stroke="#f6deb5" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.7" fill="none" />
            <circle cx="0" cy="0" r="95" stroke="#f6deb5" strokeWidth="1" strokeOpacity="0.4" fill="none" />
            <circle cx="0" cy="0" r="145" stroke="#f6deb5" strokeWidth="0.8" strokeDasharray="4 6" strokeOpacity="0.3" fill="none" />
          </motion.g>
        </g>

        {/* Meditating Silhouette / Padmasana Vector Figure */}
        <g className="hero-meditator" filter={`url(#glow-${filterId})`}>
          {/* Head & Neck */}
          <path
            d="M 464 260 C 464 246 470 236 480 236 C 490 236 496 246 496 260 C 496 274 489 285 480 285 C 471 285 464 274 464 260 Z"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="2.2"
            fill="none"
          />
          {/* Neck to Shoulders */}
          <path
            d="M 473 283 C 473 294 466 304 445 315 C 424 326 405 348 395 380"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 487 283 C 487 294 494 304 515 315 C 536 326 555 348 565 380"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Chest & Torso Outlines */}
          <path
            d="M 454 365 C 460 380 472 388 480 388 C 488 388 500 380 506 365"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 480 388 L 480 475"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.4"
            strokeOpacity="0.7"
            strokeLinecap="round"
          />
          <circle cx="480" cy="445" r="2.5" fill="#fbe8c7" />

          {/* Arms & Hands Resting in Mudra / Padmasana */}
          {/* Left Arm (viewer's left) */}
          <path
            d="M 395 380 C 385 415 380 455 382 495 C 384 530 405 558 438 565 C 460 570 478 555 490 540"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Arm (viewer's right) */}
          <path
            d="M 565 380 C 575 415 580 455 578 495 C 576 530 555 558 522 565 C 500 570 482 555 470 540"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Torso Sides */}
          <path
            d="M 436 345 C 442 390 440 435 432 475 C 428 495 422 515 415 530"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.8"
            fill="none"
          />
          <path
            d="M 524 345 C 518 390 520 435 528 475 C 532 495 538 515 545 530"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.8"
            fill="none"
          />

          {/* Crossed Legs in Lotus / Padmasana Pose */}
          <path
            d="M 415 530 C 375 540 338 565 330 585 C 322 605 340 615 372 612 C 410 608 450 585 480 570 C 510 585 550 608 588 612 C 620 615 638 605 630 585 C 622 565 585 540 545 530"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Feet & Lotus Fold Details */}
          <path
            d="M 360 605 C 390 622 435 628 480 628 C 525 628 570 622 600 605"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 410 595 C 445 612 470 615 480 615 C 490 615 515 612 550 595"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 335 595 C 352 580 375 580 395 590"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 625 595 C 608 580 585 580 565 590"
            stroke={`url(#auraLine-${gradLineId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Calming Ripple Floor Lines under meditation base */}
          <g className="hero-ground-ripples" stroke={`url(#auraLine-${gradLineId})`} strokeLinecap="round" opacity="0.7">
            <line x1="310" y1="636" x2="650" y2="636" strokeWidth="1.4" />
            <line x1="345" y1="644" x2="615" y2="644" strokeWidth="1.2" />
            <line x1="385" y1="651" x2="575" y2="651" strokeWidth="1.0" />
            <line x1="425" y1="657" x2="535" y2="657" strokeWidth="0.8" />
          </g>
        </g>
      </motion.svg>

      {/* Floating Animated Badges / Emotion Tags with curved pill aesthetic */}
      <div className="hero-floating-tags">
        {/* Top-Left Tag: Overthinking */}
        <motion.div
          className="hero-badge badge-overthinking"
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
          transition={{
            opacity: { duration: 0.8, delay: 0.3 },
            y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <span>Overthinking</span>
        </motion.div>

        {/* Mid-Center Tag: Stress */}
        <motion.div
          className="hero-badge badge-stress"
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -5, 0], scale: 1 }}
          transition={{
            opacity: { duration: 0.8, delay: 0.5 },
            y: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
          }}
        >
          <span>Stress</span>
        </motion.div>

        {/* Mid-Left Tag: Burnout */}
        <motion.div
          className="hero-badge badge-burnout"
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -7, 0], scale: 1 }}
          transition={{
            opacity: { duration: 0.8, delay: 0.7 },
            y: { duration: 5.0, repeat: Infinity, ease: "easeInOut", delay: 1.4 },
          }}
        >
          <span>Burnout</span>
        </motion.div>

        {/* Top-Right Tag: Dreshing */}
        <motion.div
          className="hero-badge badge-dreshing"
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
          transition={{
            opacity: { duration: 0.8, delay: 0.9 },
            y: { duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.1 },
          }}
        >
          <span>Dreshing</span>
        </motion.div>

        {/* Bottom-Right Tag: Stress / Burnout */}
        <motion.div
          className="hero-badge badge-burnout-alt"
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -5, 0], scale: 1 }}
          transition={{
            opacity: { duration: 0.8, delay: 1.1 },
            y: { duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 1.8 },
          }}
        >
          <span>Stress</span>
        </motion.div>
      </div>
    </div>
  );
}
export default HeroCanvasArt;
