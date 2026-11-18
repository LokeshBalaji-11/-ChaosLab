import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isAnimated = data?.isAnimated || false;
  const strokeColor = (data?.strokeColor as string) || (style.stroke as string) || '#334155';
  const strokeWidth = data?.strokeWidth ? Number(data.strokeWidth) : 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...(style as any),
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDasharray: isAnimated ? '8 4' : undefined,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
        }}
      />
      {isAnimated && (
        <circle r="4" fill={strokeColor as string} filter="drop-shadow(0 0 6px rgba(255,255,255,0.8))">
          <animateMotion dur="1.2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}
