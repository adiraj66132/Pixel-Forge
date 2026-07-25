import React from 'react';
import { useStateValue, useDispatch } from '../App';

export default function Timeline() {
  const state = useStateValue();
  const dispatch = useDispatch();

  return (
    <div className="timeline">
      <div className="timeline-controls">
        <button
          className={`play-btn ${state.isPlaying ? 'playing' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          title="Play/Pause (Space)"
        >
          {state.isPlaying ? '⏸' : '▶'}
        </button>
        <label className="fps-control">
          FPS
          <input
            type="number"
            min="1"
            max="30"
            value={state.fps}
            onChange={e => dispatch({ type: 'SET_FPS', value: +e.target.value })}
          />
        </label>
      </div>
      <div className="frame-strip">
        {state.frames.map((f, i) => (
          <div
            key={f.id}
            className={`frame-thumb ${i === state.currentFrame ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_CURRENT_FRAME', value: i })}
            title={`Frame ${i + 1}`}
          >
            <span className="frame-num">{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="timeline-actions">
        <button onClick={() => dispatch({ type: 'ADD_FRAME' })} title="Add Frame (N)">+ Frame</button>
        <button onClick={() => dispatch({ type: 'REMOVE_FRAME' })} title="Remove Frame">- Frame</button>
        <button
          className={`onion-btn ${state.onionSkin ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_ONION' })}
          title="Onion Skin"
          style={state.onionSkin ? { background: '#000080', color: '#fff' } : {}}
        >
          Onion
        </button>
      </div>
    </div>
  );
}
