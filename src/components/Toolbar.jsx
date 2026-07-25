import React from 'react';
import { useStateValue, useDispatch } from '../App';

const tools = [
  { id: 'pencil', label: 'B', title: 'Pencil (B)' },
  { id: 'eraser', label: 'E', title: 'Eraser (E)' },
  { id: 'fill', label: 'G', title: 'Fill (G)' },
  { id: 'eyedropper', label: 'I', title: 'Eyedropper (I)' },
  { id: 'rect', label: 'R', title: 'Rectangle (R)' },
  { id: 'line', label: 'L', title: 'Line (L)' },
];

const PALETTE = [
  '#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#efefef','#f3f3f3','#ffffff',
  '#980000','#ff0000','#ff9900','#ffff00','#00ff00','#00ffff','#4a86e8','#0000ff','#9900ff','#ff00ff',
  '#e6b8af','#f4cccc','#fce5cd','#fff2cc','#d9ead3','#d0e0e3','#c9daf8','#cfe2f3','#d9d2e9','#ead1dc',
  '#dd7e6b','#ea9999','#f9cb9c','#ffe599','#b6d7a8','#a2c4c9','#a4c2f4','#9fc5e8','#b4a7d6','#d5a6bd',
];

export default function Toolbar() {
  const state = useStateValue();
  const dispatch = useDispatch();

  return (
    <div className="toolbar">
      <div className="tool-group">
        <span className="tool-label">Tools</span>
        <div className="tool-grid">
          {tools.map(t => (
            <button
              key={t.id}
              className={`tool-btn ${state.tool === t.id ? 'active' : ''}`}
              title={t.title}
              onClick={() => dispatch({ type: 'SET_TOOL', value: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tool-separator" />

      <div className="tool-group">
        <span className="tool-label">Color</span>
        <input
          type="color"
          value={state.color}
          onChange={e => dispatch({ type: 'SET_COLOR', value: e.target.value })}
          className="color-input"
        />
      </div>

      <div className="tool-group">
        <span className="tool-label">Palette</span>
        <div className="palette">
          {PALETTE.map(c => (
            <div
              key={c}
              className="palette-color"
              style={{ background: c }}
              title={c}
              onClick={() => dispatch({ type: 'SET_COLOR', value: c })}
            />
          ))}
        </div>
      </div>

      <div className="tool-separator" />

      <div className="tool-group">
        <span className="tool-label">Size</span>
        <div className="brush-size">
          <input
            type="range"
            min="1"
            max="16"
            value={state.brushSize}
            onChange={e => dispatch({ type: 'SET_BRUSH_SIZE', value: +e.target.value })}
          />
          <span className="brush-size-val">{state.brushSize}</span>
        </div>
      </div>

      <div className="tool-separator" />

      <div className="tool-group">
        <span className="tool-label">Zoom</span>
        <div className="zoom-controls">
          <button onClick={() => dispatch({ type: 'SET_ZOOM', value: state.zoom - 2 })}>-</button>
          <span>{state.zoom}x</span>
          <button onClick={() => dispatch({ type: 'SET_ZOOM', value: state.zoom + 2 })}>+</button>
        </div>
      </div>

      <div className="tool-group">
        <button
          className={`tool-btn ${state.showGrid ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
          title="Toggle Grid (#)"
          style={{ width: '100%' }}
        >
          Grid
        </button>
      </div>

      <div className="tool-separator" />

      <div className="tool-group">
        <span className="tool-label">History</span>
        <div className="tool-grid">
          <button className="tool-btn" onClick={() => dispatch({ type: 'UNDO' })} title="Undo (Ctrl+Z)">↩</button>
          <button className="tool-btn" onClick={() => dispatch({ type: 'REDO' })} title="Redo (Ctrl+Y)">↪</button>
        </div>
      </div>
    </div>
  );
}
