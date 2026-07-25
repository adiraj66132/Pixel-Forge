import React from 'react';
import { useStateValue, useDispatch } from '../App';

export default function StatusBar() {
  const state = useStateValue();
  const frame = state.frames[state.currentFrame];
  const layer = frame?.layers[state.currentLayer];

  return (
    <div className="status-bar">
      <span className="status-section">
        {state.canvasWidth} x {state.canvasHeight}px
      </span>
      <span className="status-section">
        X: {state.mouseX} Y: {state.mouseY}
      </span>
      <span className="status-section">
        {state.tool.charAt(0).toUpperCase() + state.tool.slice(1)} | Size: {state.brushSize}
      </span>
      <span className="status-section">
        Frame {state.currentFrame + 1}/{state.frames.length}
      </span>
      <span className="status-section">
        {state.past.length} undo | {state.future.length} redo
      </span>
    </div>
  );
}
