import React from 'react';
import { useStateValue, useDispatch } from '../App';

export default function LayerPanel() {
  const state = useStateValue();
  const dispatch = useDispatch();
  const frame = state.frames[state.currentFrame];
  const layers = frame?.layers || [];

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <span className="panel-title">Layers</span>
        <div className="panel-actions">
          <button onClick={() => dispatch({ type: 'ADD_LAYER' })} title="Add Layer">+</button>
          <button onClick={() => dispatch({ type: 'REMOVE_LAYER' })} title="Remove Layer">-</button>
        </div>
      </div>
      <div className="layer-list">
        {[...layers].reverse().map((l, ri) => {
          const i = layers.length - 1 - ri;
          return (
            <div
              key={l.id}
              className={`layer-item ${i === state.currentLayer ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_CURRENT_LAYER', value: i })}
            >
              <button
                className={`vis-btn ${l.visible ? '' : 'hidden'}`}
                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_LAYER_VISIBILITY' }); }}
                title="Toggle Visibility"
              >
                {l.visible ? '👁' : '—'}
              </button>
              <input
                className="layer-name"
                value={l.name}
                onChange={e => dispatch({ type: 'SET_LAYER_NAME', value: e.target.value })}
                onClick={e => e.stopPropagation()}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={l.opacity}
                onChange={e => dispatch({ type: 'SET_LAYER_OPACITY', value: +e.target.value })}
                onClick={e => e.stopPropagation()}
                className="opacity-slider"
                title={`Opacity: ${Math.round(l.opacity * 100)}%`}
              />
              <div className="layer-move">
                <button disabled={i === layers.length - 1} onClick={(e) => { e.stopPropagation(); dispatch({ type: 'MOVE_LAYER', dir: 1 }); }}>↑</button>
                <button disabled={i === 0} onClick={(e) => { e.stopPropagation(); dispatch({ type: 'MOVE_LAYER', dir: -1 }); }}>↓</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="layer-ops">
        <button onClick={() => dispatch({ type: 'DUPLICATE_LAYER' })} title="Duplicate Layer">Dup</button>
        <button onClick={() => dispatch({ type: 'CLEAR_LAYER' })} title="Clear Layer">Clear</button>
        <button onClick={() => dispatch({ type: 'MERGE_DOWN' })} title="Merge Down" disabled={state.currentLayer <= 0}>Merge</button>
      </div>
    </div>
  );
}
