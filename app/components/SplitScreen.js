"use client";

import { useState, useEffect } from "react";
import { useGameState } from "./GameState";

/**
 * SplitScreen Component
 *
 * Renders a split-screen view using SVG radial wedges in a square container.
 * The screen is divided into equal wedges that meet at the center.
 */
export default function SplitScreen() {
  const {
    settings,
    gameState,
    currentSpeaker,
    playerTimes,
    jumpInCounts,
    gracePeriodActive,
    handleJumpIn,
    handleSpeakerFinish,
  } = useGameState();

  const playerCount = settings.playerCount;

  // Track container dimensions for responsive rendering
  // Use consistent default to avoid hydration mismatch
  const [dimensions, setDimensions] = useState({
    width: 1000,
    height: 1000,
    mounted: false,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      setDimensions({
        width: width,
        height: width, // Square container
        mounted: true,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const containerWidth = dimensions.width;
  const containerHeight = dimensions.height;
  const isMounted = dimensions.mounted;

  // Center point of the container
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  // Calculate radius to ensure wedges reach all corners
  // Use the diagonal distance to ensure full coverage
  const radius = Math.sqrt(containerWidth ** 2 + containerHeight ** 2) / 2;

  /**
   * Converts an angle in degrees to radians
   */
  const degToRad = (degrees) => (degrees * Math.PI) / 180;

  /**
   * Converts polar coordinates to Cartesian coordinates
   */
  const polarToCartesian = (angleDegrees, r) => {
    const angleRad = degToRad(angleDegrees);
    return {
      x: centerX + r * Math.cos(angleRad),
      y: centerY + r * Math.sin(angleRad),
    };
  };

  /**
   * Generates an SVG path string for a single wedge
   */
  const createWedge = (startAngleDegrees, endAngleDegrees, colorIndex) => {
    const startPoint = polarToCartesian(startAngleDegrees, radius);
    const endPoint = polarToCartesian(endAngleDegrees, radius);

    const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;
    const startAngleNorm = normalizeAngle(startAngleDegrees);
    const endAngleNorm = normalizeAngle(endAngleDegrees);

    let angleDiff = endAngleNorm - startAngleNorm;
    if (angleDiff < 0) {
      angleDiff += 360;
    }

    const sweepFlag = 1;
    const largeArcFlag = angleDiff > 180 ? 1 : 0;

    const path = `
      M ${centerX} ${centerY}
      L ${startPoint.x} ${startPoint.y}
      A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}
      Z
    `.trim();

    const hue = (360 * colorIndex) / Math.max(8, playerCount);
    const color = `hsl(${hue}, 70%, 50%)`;

    return { path, color };
  };

  /**
   * Generates all wedges for the current player count
   */
  const generateWedges = () => {
    if (playerCount === 0) return [];

    const anglePerWedge = 360 / playerCount;
    const startAngle = -90; // Start at top

    const wedges = [];
    for (let i = 0; i < playerCount; i++) {
      const wedgeStartAngle = startAngle + i * anglePerWedge;
      const wedgeEndAngle = startAngle + (i + 1) * anglePerWedge;
      const wedge = createWedge(wedgeStartAngle, wedgeEndAngle, i);
      wedges.push(wedge);
    }

    return wedges;
  };

  const wedges = generateWedges();

  // Handle wedge click
  const handleWedgeClick = (playerIndex) => {
    if (gameState !== "playing") return;

    if (playerIndex === currentSpeaker) {
      handleSpeakerFinish();
    } else {
      // Check if player has jump-ins remaining and time remaining
      const remainingJumps = jumpInCounts[playerIndex] || 0;
      const remainingTime = playerTimes[playerIndex] || 0;
      if (remainingJumps > 0 && remainingTime > 0) {
        handleJumpIn(playerIndex);
      }
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    return Math.ceil(Math.max(0, seconds)).toString();
  };

  // Get display content for a wedge
  const getWedgeContent = (playerIndex) => {
    // Only hide content in menu, show it when playing or paused
    if (gameState === "menu") {
      return { time: null, jumpIns: null };
    }

    // Show each player's remaining time (chess clock style)
    const playerTime = playerTimes[playerIndex] || 0;
    const remainingJumps = jumpInCounts[playerIndex] || 0;

    // When paused, show all players' times and jump-ins
    if (gameState === "paused") {
      return { time: formatTime(playerTime), jumpIns: remainingJumps };
    }

    // When playing
    if (playerIndex === currentSpeaker) {
      // Current speaker: show their time ticking down
      return { time: formatTime(playerTime), jumpIns: remainingJumps };
    } else {
      // Other players: show their remaining time when grace period is over
      if (gracePeriodActive) {
        // During grace period, they're grayed out, no time shown
        return { time: null, jumpIns: remainingJumps };
      }
      // Grace period over - show their remaining time
      return { time: formatTime(playerTime), jumpIns: remainingJumps };
    }
  };

  // Get text position and rotation for a wedge
  const getTextPosition = (index) => {
    const anglePerWedge = 360 / playerCount;
    const startAngle = -90;
    const middleAngle = startAngle + (index + 0.5) * anglePerWedge;

    // Position text at about 40% of the radius
    const textRadius = radius * 0.4;
    const pos = polarToCartesian(middleAngle, textRadius);

    // Calculate rotation for text to be readable
    // For SVG, rotation is in degrees and rotates around the point
    // We want text to follow the angle of the wedge
    let rotation = middleAngle;
    // Adjust rotation for readability - flip text on bottom half
    if (rotation > 90 && rotation < 270) {
      rotation += 180;
    }

    return {
      x: pos.x,
      y: pos.y,
      rotation: rotation,
    };
  };

  // Get jump-in position (below the time text)
  const getJumpInPosition = (index) => {
    const anglePerWedge = 360 / playerCount;
    const startAngle = -90;
    const middleAngle = startAngle + (index + 0.5) * anglePerWedge;

    // Position below the time text
    const textRadius = radius * 0.4;
    const basePos = polarToCartesian(middleAngle, textRadius);

    // Offset downward along the angle direction (perpendicular to the radius)
    const offsetDistance = 35; // pixels
    const perpAngle = middleAngle + 90; // Perpendicular to the radius
    const offsetAngle = degToRad(perpAngle);
    const offsetX = basePos.x + offsetDistance * Math.cos(offsetAngle);
    const offsetY = basePos.y + offsetDistance * Math.sin(offsetAngle);

    // Same rotation as text
    let rotation = middleAngle;
    if (rotation > 90 && rotation < 270) {
      rotation += 180;
    }

    return {
      x: offsetX,
      y: offsetY,
      rotation: rotation,
    };
  };

  // Don't render SVG until mounted to avoid hydration mismatch
  if (!isMounted) {
    return <div className="relative w-full h-full" />;
  }

  return (
    <div className="relative w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {wedges.map((wedge, index) => {
          const isCurrentSpeaker = index === currentSpeaker;
          const isGrayedOut =
            gameState === "playing" && !isCurrentSpeaker && gracePeriodActive;
          const hasNoJumpsLeft =
            gameState === "playing" &&
            !isCurrentSpeaker &&
            (jumpInCounts[index] || 0) <= 0;
          const hasNoTimeLeft =
            (gameState === "playing" || gameState === "paused") &&
            (playerTimes[index] || 0) <= 0;
          const textPos = getTextPosition(index);
          const jumpInPos = getJumpInPosition(index);
          const content = getWedgeContent(index);

          return (
            <g key={index}>
              <path
                d={wedge.path}
                fill={
                  isGrayedOut || hasNoJumpsLeft || hasNoTimeLeft
                    ? "gray"
                    : wedge.color
                }
                stroke="#fff"
                strokeWidth="4"
                opacity={
                  isGrayedOut || hasNoJumpsLeft || hasNoTimeLeft ? 0.5 : 1
                }
                style={{
                  cursor:
                    (gameState === "playing" || gameState === "paused") &&
                    !hasNoJumpsLeft &&
                    !hasNoTimeLeft
                      ? "pointer"
                      : "default",
                }}
                onClick={() => handleWedgeClick(index)}
              />
              {/* Time display */}
              {content.time && (
                <text
                  x={textPos.x}
                  y={textPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="clamp(1rem, 4vw, 2rem)"
                  fontWeight="bold"
                  transform={`rotate(${textPos.rotation} ${textPos.x} ${textPos.y})`}
                  style={{
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    pointerEvents: "none",
                  }}
                >
                  {content.time}
                </text>
              )}

              {/* Jump-in count with icon */}
              {content.jumpIns !== null && content.jumpIns > 0 && (
                <g
                  transform={`translate(${jumpInPos.x}, ${jumpInPos.y}) rotate(${jumpInPos.rotation})`}
                  style={{ pointerEvents: "none" }}
                >
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="clamp(0.75rem, 3vw, 1.25rem)"
                    fontWeight="bold"
                    style={{
                      textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {content.jumpIns}
                  </text>
                  {/* Circle Arrow Out Up Right icon as SVG */}
                  <g transform="translate(12, 0)">
                    <circle
                      cx="0"
                      cy="0"
                      r="5"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.2"
                      style={{
                        filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))",
                      }}
                    />
                    {/* Arrow pointing up-right */}
                    <path
                      d="M 2.5 -2.5 L 5.5 -5.5 M 2.5 -2.5 L 5.5 -2.5 M 2.5 -2.5 L 2.5 -5.5"
                      stroke="white"
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))",
                      }}
                    />
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
