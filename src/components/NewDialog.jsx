import React, { useState } from 'react';
import { useDispatch } from '../App';

const PRESETS = [
  { label: '16x16', w: 16, h: 16 },
  { label: '32x32', w: 32, h: 32 },
  { label: '64x64', w: 64, h: 64 },
  { label: '128x128', w: 128, h: 128 },
  { label: '16x32', w: 16, h: 32 },
  { label: '32x16', w: 32, h: 16 },
];

export default function NewDialog() {
  const dispatch = useDispatch();
  const [w, setW] = useState(32);
  const [h, setH] = useState(32);

  const create = () => {
    dispatch({ type: 'SET_CANVAS_SIZE', w, h });
    dispatch({ type: 'SET_SHOW_NEW_DIALOG', value: false });
  };

  return (
    <div className="dialog-overlay" onClick={() => dispatch({ type: 'SET_SHOW_NEW_DIALOG', value: false })}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-title">
          <span>New Canvas</span>
          <button className="dialog-close" onClick={() => dispatch({ type: 'SET_SHOW_NEW_DIALOG', value: false })}>×</button>
        </div>
        <div className="dialog-body">
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                className="win-btn"
                style={{ fontSize: 10 }}
                onClick={() => { setW(p.w); setH(p.h); }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="dialog-row">
            <label>Width:</label>
            <input type="number" min="1" max="512" value={w} onChange={e => setW(+e.target.value)} />
          </div>
          <div className="dialog-row">
            <label>Height:</label>
            <input type="number" min="1" max="512" value={h} onChange={e => setH(+e.target.value)} />
          </div>
        </div>
        <div className="dialog-actions">
          <button className="win-btn" onClick={() => dispatch({ type: 'SET_SHOW_NEW_DIALOG', value: false })}>Cancel</button>
          <button className="win-btn" onClick={create}>OK</button>
        </div>
      </div>
    </div>
  );
}
