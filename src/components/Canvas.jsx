import React, { useRef, useEffect, useCallback } from 'react';
import { useStateValue, useDispatch, hexToRgb } from '../App';

const PALETTE = [
  '#000000','#ffffff','#c0c0c0','#808080',
  '#800000','#ff0000','#808000','#ffff00',
  '#008000','#00ff00','#008080','#00ffff',
  '#000080','#0000ff','#800080','#ff00ff',
  '#c08000','#ff8000','#0080ff','#80ffff',
  '#ff80c0','#80ff80','#8080ff','#c0c0ff',
];

export default function Canvas() {
  const state = useStateValue();
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPixel = useRef(null);
  const shapeStart = useRef(null);
  const previewRef = useRef(null);

  const { canvasWidth: W, canvasHeight: H, zoom, showGrid, frames, currentFrame, tool, color, brushSize, onionSkin } = state;
  const frame = frames[currentFrame];
  const layer = frame?.layers[state.currentLayer];

  const composite = useCallback((frameIdx, alpha = 1) => {
    const f = frames[frameIdx];
    if (!f) return null;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    f.layers.filter(l => l.visible).forEach(l => {
      if (!l.data) return;
      ctx.globalAlpha = l.opacity * alpha;
      ctx.putImageData(new ImageData(new Uint8ClampedArray(l.data), W, H), 0, 0);
    });
    return c;
  }, [frames, W, H]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W * zoom;
    canvas.height = H * zoom;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // checkerboard — dark/light gray, clearly visible
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#cccccc' : '#999999';
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }

    // onion skin prev
    if (onionSkin && currentFrame > 0) {
      const prev = composite(currentFrame - 1, 0.25);
      if (prev) ctx.drawImage(prev, 0, 0, canvas.width, canvas.height);
    }

    // onion skin next
    if (onionSkin && currentFrame < frames.length - 1) {
      const next = composite(currentFrame + 1, 0.25);
      if (next) ctx.drawImage(next, 0, 0, canvas.width, canvas.height);
    }

    // current frame
    ctx.globalAlpha = 1;
    const comp = composite(currentFrame);
    if (comp) ctx.drawImage(comp, 0, 0, canvas.width, canvas.height);

    // grid
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x++) {
        ctx.beginPath(); ctx.moveTo(x * zoom + 0.5, 0); ctx.lineTo(x * zoom + 0.5, H * zoom); ctx.stroke();
      }
      for (let y = 0; y <= H; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * zoom + 0.5); ctx.lineTo(W * zoom, y * zoom + 0.5); ctx.stroke();
      }
    }

    // preview overlay for rect/line
    if (previewRef.current && shapeStart.current) {
      ctx.strokeStyle = tool === 'eraser' ? 'rgba(255,0,0,0.6)' : 'rgba(0,0,255,0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      const s = shapeStart.current, p = previewRef.current;
      if (tool === 'rect') {
        const rx = Math.min(s.x, p.x), ry = Math.min(s.y, p.y);
        const rw = Math.abs(p.x - s.x) + 1, rh = Math.abs(p.y - s.y) + 1;
        ctx.strokeRect(rx * zoom, ry * zoom, rw * zoom, rh * zoom);
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(s.x * zoom + zoom / 2, s.y * zoom + zoom / 2);
        ctx.lineTo(p.x * zoom + zoom / 2, p.y * zoom + zoom / 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }, [composite, zoom, showGrid, frames, currentFrame, W, H, tool, onionSkin]);

  const getPos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - r.left) / zoom),
      y: Math.floor((e.clientY - r.top) / zoom),
    };
  };

  const setPixel = useCallback((x, y, c) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    dispatch({ type: 'SET_PIXEL', x, y, color: c });
  }, [W, H, dispatch]);

  const drawBrush = useCallback((x, y, c) => {
    const r = Math.floor(brushSize / 2);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        setPixel(x + dx, y + dy, c);
      }
    }
  }, [brushSize, setPixel]);

  const drawLinePixels = (x0, y0, x1, y1, c) => {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      drawBrush(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };

  const commitShape = (endX, endY) => {
    if (!shapeStart.current) return;
    const s = shapeStart.current;
    const W2 = state.canvasWidth, H2 = state.canvasHeight;
    const ci = state.currentLayer;
    const f = frames[currentFrame];
    const l = f.layers[ci];
    const data = l.data ? new Uint8ClampedArray(l.data) : new Uint8ClampedArray(W2 * H2 * 4);
    const c = tool === 'eraser' ? null : hexToRgb(color);

    if (tool === 'rect') {
      const rx = Math.min(s.x, endX), ry = Math.min(s.y, endY);
      const rw = Math.abs(endX - s.x), rh = Math.abs(endY - s.y);
      for (let px = rx; px <= rx + rw; px++) {
        for (let py = ry; py <= ry + rh; py++) {
          if (px < 0 || px >= W2 || py < 0 || py >= H2) continue;
          const onEdge = px === rx || px === rx + rw || py === ry || py === ry + rh;
          if (!onEdge) continue;
          const i = (py * W2 + px) * 4;
          if (c) { data[i] = c.r; data[i+1] = c.g; data[i+2] = c.b; data[i+3] = 255; }
          else { data[i] = data[i+1] = data[i+2] = data[i+3] = 0; }
        }
      }
    } else if (tool === 'line') {
      const dx = Math.abs(endX - s.x), dy = -Math.abs(endY - s.y);
      const sx = s.x < endX ? 1 : -1, sy = s.y < endY ? 1 : -1;
      let err = dx + dy;
      let cx = s.x, cy = s.y;
      while (true) {
        if (cx >= 0 && cx < W2 && cy >= 0 && cy < H2) {
          const i = (cy * W2 + cx) * 4;
          if (c) { data[i] = c.r; data[i+1] = c.g; data[i+2] = c.b; data[i+3] = 255; }
          else { data[i] = data[i+1] = data[i+2] = data[i+3] = 0; }
        }
        if (cx === endX && cy === endY) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; cx += sx; }
        if (e2 <= dx) { err += dx; cy += sy; }
      }
    }

    dispatch({ type: 'PUSH_HISTORY' });
    dispatch({ type: 'COMMIT_SHAPE', layerIdx: ci, data });
  };

  const act = useCallback((x, y) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    if (tool === 'pencil' || tool === 'eraser') {
      drawBrush(x, y, tool === 'eraser' ? 'erase' : color);
    } else if (tool === 'fill') {
      dispatch({ type: 'PUSH_HISTORY' });
      dispatch({ type: 'FILL_AREA', x, y, color });
    } else if (tool === 'eyedropper') {
      if (!layer?.data) return;
      const i = (y * W + x) * 4;
      const d = layer.data;
      if (d[i + 3] > 0) {
        dispatch({ type: 'SET_COLOR', value: '#' + [d[i], d[i+1], d[i+2]].map(v => v.toString(16).padStart(2, '0')).join('') });
      }
    }
  }, [tool, color, W, H, layer, drawBrush, dispatch]);

  const onDown = (e) => {
    e.preventDefault();
    const p = getPos(e);

    if (tool === 'rect' || tool === 'line') {
      shapeStart.current = p;
      drawing.current = true;
      return;
    }

    drawing.current = true;
    lastPixel.current = p;
    if (tool === 'pencil' || tool === 'eraser') {
      dispatch({ type: 'PUSH_HISTORY' });
    }
    act(p.x, p.y);
  };

  const onMove = (e) => {
    const p = getPos(e);
    dispatch({ type: 'SET_MOUSE_POS', x: p.x, y: p.y });

    if (!drawing.current) return;

    if (tool === 'rect' || tool === 'line') {
      previewRef.current = p;
      // trigger re-render by dispatching a dummy
      dispatch({ type: 'SET_MOUSE_POS', x: p.x, y: p.y });
      return;
    }

    if (p.x === lastPixel.current.x && p.y === lastPixel.current.y) return;
    drawLinePixels(lastPixel.current.x, lastPixel.current.y, p.x, p.y, tool === 'eraser' ? 'erase' : color);
    lastPixel.current = p;
  };

  const onUp = (e) => {
    if (drawing.current && (tool === 'rect' || tool === 'line')) {
      const p = getPos(e);
      commitShape(p.x, p.y);
      shapeStart.current = null;
      previewRef.current = null;
    }
    drawing.current = false;
    lastPixel.current = null;
  };

  useEffect(() => {
    const handler = () => { drawing.current = false; lastPixel.current = null; shapeStart.current = null; previewRef.current = null; };
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, []);

  return (
    <div className="canvas-area">
      <canvas
        ref={canvasRef}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
      />
    </div>
  );
}
