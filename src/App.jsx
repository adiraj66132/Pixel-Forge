import React, { useReducer, useEffect, useRef, createContext, useContext } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import LayerPanel from './components/LayerPanel';
import Timeline from './components/Timeline';
import StatusBar from './components/StatusBar';
import NewDialog from './components/NewDialog';
import { saveProject, loadProject } from './db';

const StateContext = createContext();
const DispatchContext = createContext();

export function useStateValue() { return useContext(StateContext); }
export function useDispatch() { return useContext(DispatchContext); }

let nextId = 1;
const uid = () => nextId++;

const MAX_HISTORY = 50;

function makeLayer(name) {
  return { id: uid(), name, visible: true, opacity: 1, data: null };
}

function makeFrame(layers) {
  return { id: uid(), layers: layers || [makeLayer('Layer 1')] };
}

function initState(w = 32, h = 32) {
  return {
    canvasWidth: w,
    canvasHeight: h,
    frames: [makeFrame()],
    currentFrame: 0,
    currentLayer: 0,
    tool: 'pencil',
    color: '#000000',
    brushSize: 1,
    zoom: 12,
    showGrid: true,
    isPlaying: false,
    fps: 8,
    onionSkin: false,
    mouseX: 0,
    mouseY: 0,
    showNewDialog: false,
    past: [],
    future: [],
  };
}

function snapshot(s) {
  const { mouseX, mouseY, showNewDialog, ...rest } = s;
  return {
    ...rest,
    frames: rest.frames.map(f => ({
      ...f,
      layers: f.layers.map(l => ({ ...l, data: l.data ? new Uint8ClampedArray(l.data) : null }))
    }))
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TOOL': return { ...state, tool: action.value };
    case 'SET_COLOR': return { ...state, color: action.value };
    case 'SET_BRUSH_SIZE': return { ...state, brushSize: Math.max(1, Math.min(16, action.value)) };
    case 'SET_ZOOM': return { ...state, zoom: Math.max(1, Math.min(64, action.value)) };
    case 'TOGGLE_GRID': return { ...state, showGrid: !state.showGrid };
    case 'TOGGLE_ONION': return { ...state, onionSkin: !state.onionSkin };
    case 'SET_MOUSE_POS': return { ...state, mouseX: action.x, mouseY: action.y };
    case 'SET_SHOW_NEW_DIALOG': return { ...state, showNewDialog: action.value };
    case 'SET_CURRENT_FRAME': return { ...state, currentFrame: action.value, currentLayer: 0 };
    case 'SET_CURRENT_LAYER': return { ...state, currentLayer: action.value };

    case 'ADD_FRAME': {
      const dup = state.frames[state.currentFrame];
      const newLayers = dup.layers.map(l => ({ ...l, id: uid(), data: l.data ? new Uint8ClampedArray(l.data) : null }));
      const frames = [...state.frames];
      frames.splice(state.currentFrame + 1, 0, makeFrame(newLayers));
      return { ...state, frames, currentFrame: state.currentFrame + 1 };
    }
    case 'REMOVE_FRAME': {
      if (state.frames.length <= 1) return state;
      const frames = state.frames.filter((_, i) => i !== state.currentFrame);
      return { ...state, frames, currentFrame: Math.min(state.currentFrame, frames.length - 1) };
    }

    case 'ADD_LAYER': {
      const frames = state.frames.map((f, i) => {
        if (i !== state.currentFrame) return f;
        return { ...f, layers: [...f.layers, makeLayer(`Layer ${f.layers.length + 1}`)] };
      });
      return { ...state, frames, currentLayer: frames[state.currentFrame].layers.length - 1 };
    }
    case 'REMOVE_LAYER': {
      const frame = state.frames[state.currentFrame];
      if (frame.layers.length <= 1) return state;
      const frames = state.frames.map((f, i) => {
        if (i !== state.currentFrame) return f;
        return { ...f, layers: f.layers.filter((_, j) => j !== state.currentLayer) };
      });
      return { ...state, frames, currentLayer: Math.min(state.currentLayer, frames[state.currentFrame].layers.length - 2) };
    }
    case 'DUPLICATE_LAYER': {
      const frames = state.frames.map((f, i) => {
        if (i !== state.currentFrame) return f;
        const src = f.layers[state.currentLayer];
        const dup = { ...src, id: uid(), name: src.name + ' copy', data: src.data ? new Uint8ClampedArray(src.data) : null };
        const layers = [...f.layers];
        layers.splice(state.currentLayer + 1, 0, dup);
        return { ...f, layers };
      });
      return { ...state, frames, currentLayer: state.currentLayer + 1 };
    }
    case 'CLEAR_LAYER': {
      const frames = state.frames.map((f, i) => {
        if (i !== state.currentFrame) return f;
        const layers = f.layers.map((l, j) => {
          if (j !== state.currentLayer) return l;
          return { ...l, data: null };
        });
        return { ...f, layers };
      });
      return { ...state, frames };
    }
    case 'MERGE_DOWN': {
      const frame = state.frames[state.currentFrame];
      if (state.currentLayer <= 0) return state;
      const W = state.canvasWidth, H = state.canvasHeight;
      const frames = state.frames.map((f, i) => {
        if (i !== state.currentFrame) return f;
        const upper = f.layers[state.currentLayer];
        const lower = f.layers[state.currentLayer - 1];
        const uData = upper.data ? new Uint8ClampedArray(upper.data) : new Uint8ClampedArray(W * H * 4);
        const lData = lower.data ? new Uint8ClampedArray(lower.data) : new Uint8ClampedArray(W * H * 4);
        for (let pi = 0; pi < W * H; pi++) {
          const ai = pi * 4 + 3;
          if (uData[ai] > 0) {
            const a = uData[ai] / 255;
            const la = lData[ai] / 255;
            const outA = a + la * (1 - a);
            if (outA > 0) {
              for (let c = 0; c < 3; c++) {
                lData[pi * 4 + c] = Math.round((uData[pi * 4 + c] * a + lData[pi * 4 + c] * la * (1 - a)) / outA);
              }
              lData[ai] = Math.round(outA * 255);
            }
          }
        }
        const layers = f.layers.filter((_, j) => j !== state.currentLayer);
        layers[state.currentLayer - 1] = { ...lower, data: lData };
        return { ...f, layers };
      });
      return { ...state, frames, currentLayer: state.currentLayer - 1 };
    }
    case 'TOGGLE_LAYER_VISIBILITY': {
      const frames = state.frames.map((f, i) => {
        if (i !== state.currentFrame) return f;
        const layers = f.layers.map((l, j) => j === state.currentLayer ? { ...l, visible: !l.visible } : l);
        return { ...f, layers };
      });
      return { ...state, frames };
    }
    case 'SET_LAYER_OPACITY': {
      const frames = state.frames.map((f, i) => {
        if (i !== state.currentFrame) return f;
        const layers = f.layers.map((l, j) => j === state.currentLayer ? { ...l, opacity: action.value } : l);
        return { ...f, layers };
      });
      return { ...state, frames };
    }
    case 'SET_LAYER_NAME': {
      const frames = state.frames.map((f, i) => {
        if (i !== state.currentFrame) return f;
        const layers = f.layers.map((l, j) => j === state.currentLayer ? { ...l, name: action.value } : l);
        return { ...f, layers };
      });
      return { ...state, frames };
    }
    case 'MOVE_LAYER': {
      const frames = state.frames.map((f, i) => {
        if (i !== state.currentFrame) return f;
        const layers = [...f.layers];
        const [moved] = layers.splice(state.currentLayer, 1);
        layers.splice(state.currentLayer + action.dir, 0, moved);
        return { ...f, layers };
      });
      return { ...state, frames, currentLayer: state.currentLayer + action.dir };
    }

    case 'COMMIT_SHAPE': {
      const { layerIdx, data } = action;
      const frames = state.frames.map((f, fi) => {
        if (fi !== state.currentFrame) return f;
        const layers = f.layers.map((l, li) => {
          if (li !== layerIdx) return l;
          return { ...l, data };
        });
        return { ...f, layers };
      });
      return { ...state, frames };
    }

    case 'TOGGLE_PLAY': return { ...state, isPlaying: !state.isPlaying };
    case 'SET_FPS': return { ...state, fps: Math.max(1, Math.min(30, action.value)) };
    case 'SET_CANVAS_SIZE': return {
      ...state, canvasWidth: action.w, canvasHeight: action.h,
      frames: [makeFrame()], currentFrame: 0, currentLayer: 0,
      past: [], future: [],
    };

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        ...state,
        ...prev,
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, MAX_HISTORY),
        mouseX: state.mouseX, mouseY: state.mouseY,
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        ...next,
        past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
        future: state.future.slice(1),
        mouseX: state.mouseX, mouseY: state.mouseY,
      };
    }
    case 'PUSH_HISTORY': {
      return {
        ...state,
        past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
        future: [],
      };
    }

    case 'LOAD_STATE': return { ...state, ...action.state, past: [], future: [] };
    default: return state;
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function getPixel(data, w, x, y) {
  const i = (y * w + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

export function colorsMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

export { hexToRgb };

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const saved = localStorage.getItem('pixel-forge-init');
    if (saved) {
      try { return { ...initState(), ...JSON.parse(saved) }; } catch {}
    }
    return initState();
  });
  const saveTimer = useRef(null);

  useEffect(() => {
    loadProject('current').then(p => {
      if (p) {
        nextId = p.nextId || 100;
        dispatch({ type: 'LOAD_STATE', state: p.state });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProject({ id: 'current', state, nextId }).catch(() => {});
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  useEffect(() => {
    if (!state.isPlaying) return;
    const id = setInterval(() => {
      dispatch({ type: 'SET_CURRENT_FRAME', value: (state.currentFrame + 1) % state.frames.length });
    }, 1000 / state.fps);
    return () => clearInterval(id);
  }, [state.isPlaying, state.currentFrame, state.frames.length, state.fps]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && key === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      else if (ctrl && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); dispatch({ type: 'REDO' }); }
      else if (key === 'b') dispatch({ type: 'SET_TOOL', value: 'pencil' });
      else if (key === 'e') dispatch({ type: 'SET_TOOL', value: 'eraser' });
      else if (key === 'g') dispatch({ type: 'SET_TOOL', value: 'fill' });
      else if (key === 'i') dispatch({ type: 'SET_TOOL', value: 'eyedropper' });
      else if (key === 'r') dispatch({ type: 'SET_TOOL', value: 'rect' });
      else if (key === 'l') dispatch({ type: 'SET_TOOL', value: 'line' });
      else if (key === ' ') { e.preventDefault(); dispatch({ type: 'TOGGLE_PLAY' }); }
      else if (key === '+' || key === '=') dispatch({ type: 'SET_ZOOM', value: state.zoom + 2 });
      else if (key === '-') dispatch({ type: 'SET_ZOOM', value: state.zoom - 2 });
      else if (key === 'n' && !ctrl) dispatch({ type: 'ADD_FRAME' });
      else if (key === 'delete' || key === 'backspace') {
        if (e.target.tagName !== 'INPUT') dispatch({ type: 'CLEAR_LAYER' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.zoom]);

  const exportPNG = () => {
    const a = document.createElement('a');
    const c = document.createElement('canvas');
    c.width = state.canvasWidth; c.height = state.canvasHeight;
    const ctx = c.getContext('2d');
    const frame = state.frames[state.currentFrame];
    frame.layers.filter(l => l.visible).forEach(l => {
      if (!l.data) return;
      ctx.globalAlpha = l.opacity;
      ctx.putImageData(new ImageData(new Uint8ClampedArray(l.data), state.canvasWidth, state.canvasHeight), 0, 0);
    });
    a.href = c.toDataURL('image/png');
    a.download = 'pixel-forge.png';
    a.click();
  };

  const exportSpritesheet = () => {
    const cols = Math.ceil(Math.sqrt(state.frames.length));
    const rows = Math.ceil(state.frames.length / cols);
    const c = document.createElement('canvas');
    c.width = state.canvasWidth * cols;
    c.height = state.canvasHeight * rows;
    const ctx = c.getContext('2d');
    state.frames.forEach((frame, fi) => {
      const col = fi % cols, row = Math.floor(fi / cols);
      frame.layers.filter(l => l.visible).forEach(l => {
        if (!l.data) return;
        ctx.globalAlpha = l.opacity;
        ctx.putImageData(new ImageData(new Uint8ClampedArray(l.data), state.canvasWidth, state.canvasHeight), col * state.canvasWidth, row * state.canvasHeight);
      });
    });
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'spritesheet.png';
    a.click();
  };

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        <div className="app">
          <div className="app-header">
            <span className="logo">
              <span className="logo-icon">P</span>
              Pixel Forge
            </span>
            <div className="header-actions">
              <button className="win-btn" onClick={() => dispatch({ type: 'SET_SHOW_NEW_DIALOG', value: true })}>New</button>
              <button className="win-btn" onClick={exportPNG}>Export PNG</button>
              <button className="win-btn" onClick={exportSpritesheet}>Export Sheet</button>
            </div>
          </div>
          <div className="menu-bar">
            <span className="menu-item" onClick={() => dispatch({ type: 'UNDO' })}>Edit</span>
            <span className="menu-item">View</span>
            <span className="menu-item">Help</span>
          </div>
          <div className="app-body">
            <Toolbar />
            <div className="canvas-wrapper">
              <Canvas />
              <StatusBar />
            </div>
            <LayerPanel />
          </div>
          <Timeline />
          {state.showNewDialog && <NewDialog />}
        </div>
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}
