import React from 'react';
import { Handle, Position } from '@xyflow/react';

export function CustomNode({ data }: { data: any }) {
  const status = (data.status || 'healthy').toLowerCase();
  
  let bg = 'linear-gradient(135deg, rgba(6, 95, 70, 0.9), rgba(4, 120, 87, 0.8))';
  let border = '#10b981';
  let glow = '0 0 20px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
  let labelText = 'HEALTHY';
  let statusColor = '#34d399';
  
  if (status === 'failed' || status === 'unavailable') {
    bg = 'linear-gradient(135deg, rgba(127, 29, 29, 0.9), rgba(185, 28, 28, 0.8))';
    border = '#ef4444';
    glow = '0 0 25px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
    labelText = 'FAILED';
    statusColor = '#fca5a5';
  } else if (status === 'degraded' || status === 'latency') {
    bg = 'linear-gradient(135deg, rgba(120, 53, 15, 0.9), rgba(180, 83, 9, 0.8))';
    border = '#f59e0b';
    glow = '0 0 25px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
    labelText = 'DEGRADED';
    statusColor = '#fde047';
  }

  return (
    <div 
      onClick={data.onClick}
      style={{
        background: bg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#ffffff',
        border: `1.5px solid ${border}`,
        borderRadius: '12px',
        padding: '14px 18px',
        width: '160px',
        textAlign: 'center',
        boxShadow: glow,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
        e.currentTarget.style.boxShadow = `0 12px 30px rgba(0, 0, 0, 0.5), ${glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = glow;
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: border, width: 8, height: 8, border: '2px solid #090d16' }} />
      <div style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', color: '#f8fafc' }}>
        {data.label || data.id}
      </div>
      <div style={{ fontSize: '10px', fontWeight: 600, background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: '6px', display: 'inline-block', color: statusColor, letterSpacing: '0.05em' }}>
        {labelText} {data.impactOrder ? `#${data.impactOrder}` : ''}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: border, width: 8, height: 8, border: '2px solid #090d16' }} />
    </div>
  );
}
