import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';
import '../../styles/Canvas.css';

const HANDLE_SIZE = 8;
const LINE_HEIGHT_RATIO = 1.2;
const PADDING = 10;
const ZOOM_SENSITIVITY = 0.01;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const NOTE_COLORS = ['#ffe492', '#a2cff7', '#bef09f', '#f1bc9d', '#a9a9f5'];

const isPointInRect = (px, py, x, y, w, h) => px >= x && px <= x + w && py >= y && py <= y + h;

const drawMultiLineText = (ctx, text, x, y, width, fontSize, isNote) => {
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  ctx.textBaseline = 'top';

  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const maxWidth = isNote ? width - (PADDING * 2) : width;
  const startX = x + (isNote ? PADDING : 0);
  let currentY = y + (isNote ? PADDING : 0);

  text.split('\n').forEach(paragraph => {
    if (!paragraph) { currentY += lineHeight; return; }
    
    let line = '';
    paragraph.split(' ').forEach((word, n) => {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        ctx.fillText(line, startX, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    });
    ctx.fillText(line, startX, currentY);
    currentY += lineHeight;
  });
};

const Canvas = ({ userName = "Usuari", readOnly = false }) => {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const ignoreClickRef = useRef(false);
  const wsRef = useRef(null);
  const { id } = useParams();

  const [activeTool, setActiveTool] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [hoveredElementId, setHoveredElementId] = useState(null);
  const [otherCursors, setOtherCursors] = useState({});
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const [interactionState, setInteractionState] = useState('IDLE');
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [pendingDeletions, setPendingDeletions] = useState(new Set());

  const [pencilRadius, setPencilRadius] = useState(3);
  const [pencilColor, setPencilColor] = useState("#172B4D");
  const [eraserRadius, setEraserRadius] = useState(15);
  const [defaultTextSize, setDefaultTextSize] = useState(16);
  const [defaultTextColor, setDefaultTextColor] = useState("#172B4D");

  const [isAddImagePopupOpen, setIsAddImagePopupOpen] = useState(false);
  const [addImagePopupFormData, setAddImagePopupFormData] = useState({ url: '' });
  const [pendingImagePosition, setPendingImagePosition] = useState(null);
  const [textInput, setTextInput] = useState(null);

  const imageCache = useRef(new Map());

  useEffect(() => {
    if (textInput && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [textInput]);

  useEffect(() => {
    if (!id) return;

    const wsUrl = import.meta.env.VITE_WS_URL 
      ? `${import.meta.env.VITE_WS_URL}/${id}` 
      : `wss://api-canvas.fabioamarelle.com:8080/ws/whiteboard/${id}`;
      
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'PING' }));
    }, 30000);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.action === 'CREATE' || message.action === 'UPDATE') {
        setElements(prev => {
          const filtered = prev.filter(e => e.id !== message.element.id);
          return [...filtered, message.element].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        });
        if (message.element.type === 'IMAGE' && message.element.properties.url) {
          loadImage(message.element.properties.url);
        }
      } else if (message.action === 'DELETE') {
        setElements(prev => prev.filter(e => e.id !== message.elementId));
      } else if (message.action === 'MOUSE_MOVE') {
        setOtherCursors(prev => ({ ...prev, [message.sessionId]: { x: message.x, y: message.y, name: message.userName, color: '#0052CC'} }));
      } else if (message.action === 'DELETE_CURSOR') {
        setOtherCursors(prev => { const copy = { ...prev }; delete copy[message.sessionId]; return copy; });
      }
    };

    return () => { clearInterval(ping); ws.close(); };
  }, [id]);

  const broadcastChange = (action, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && !readOnly) {
      wsRef.current.send(JSON.stringify({ action, ...payload }));
    }
  };

  useEffect(() => {
    const loadElements = async () => {
      try {
        const response = await apiClient.get(`/whiteboards/${id}`);
        const loadedElements = response.data.elementList || response.data.elements || [];
        loadedElements.forEach(el => el.type === 'IMAGE' && el.properties.url && loadImage(el.properties.url));
        setElements(loadedElements);
      } catch (error) {}
    };
    if (id) loadElements();
  }, [id]);

  const loadImage = (url) => {
    if (!imageCache.current.has(url)) {
      const img = new Image();
      img.src = url;
      img.onload = () => { imageCache.current.set(url, img); renderCanvas(); };
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveTool(null);
        setSelectedElementId(null);
        setIsAddImagePopupOpen(false);
        setInteractionState('IDLE');
        if (textAreaRef.current) textAreaRef.current.blur(); 
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && !textInput && !readOnly) {
        setElements(prev => prev.filter(el => el.id !== selectedElementId));
        broadcastChange('DELETE', { elementId: selectedElementId });
        setSelectedElementId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, textInput, readOnly]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        renderCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [elements, panOffset, scale, selectedElementId, hoveredElementId, activeTool, otherCursors]); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const newScale = Math.min(Math.max(scale - (e.deltaY * ZOOM_SENSITIVITY), MIN_ZOOM), MAX_ZOOM);
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        setPanOffset({
          x: mouseX - ((mouseX - panOffset.x) / scale) * newScale,
          y: mouseY - ((mouseY - panOffset.y) / scale) * newScale
        });
        setScale(newScale);
      } else {
        setPanOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [scale, panOffset]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, scale);

    [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).forEach(el => {
      ctx.save();
      const p = el.properties;

      if (activeTool === 'Eraser' && hoveredElementId === el.id && el.type !== 'DRAWING') {
        ctx.shadowColor = "#e8413e"; ctx.shadowBlur = 15; 
      }

      switch (el.type) {
        case 'DRAWING':
          if (p.points?.length > 0) {
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.lineWidth = p.width; ctx.strokeStyle = p.color;
            ctx.beginPath();
            let isDrawing = false;
            p.points.forEach(pt => {
              if (!pt) { if (isDrawing) ctx.stroke(); isDrawing = false; ctx.beginPath(); }
              else if (!isDrawing) { ctx.moveTo(pt.x, pt.y); isDrawing = true; }
              else { ctx.lineTo(pt.x, pt.y); }
            });
            if (isDrawing) ctx.stroke();
          }
          break;
        case 'IMAGE':
          const img = imageCache.current.get(p.url);
          if (img) ctx.drawImage(img, p.x, p.y, p.width, p.height);
          break;
        case 'TEXT':
          ctx.fillStyle = p.color || '#1d2534';
          drawMultiLineText(ctx, p.text, p.x, p.y, p.width || 200, p.fontSize || 16, false);
          break;
        case 'NOTE':
          ctx.fillStyle = p.backgroundColor || NOTE_COLORS[0];
          if (activeTool !== 'Eraser' || hoveredElementId !== el.id) {
            ctx.shadowColor = "rgba(9, 30, 66, 0.25)"; ctx.shadowBlur = 8 / scale;
          }
          ctx.fillRect(p.x, p.y, p.width || 150, p.height || 150);
          ctx.shadowBlur = 0;
          ctx.fillStyle = p.color || "#1d2534";
          drawMultiLineText(ctx, p.text, p.x, p.y, p.width || 150, p.fontSize || 16, true);
          break;
        default: break;
      }
      ctx.restore();
    });

    if (selectedElementId && activeTool !== 'Eraser') {
      const el = elements.find(e => e.id === selectedElementId);
      if (el) drawSelectionBox(ctx, el);
    }

    Object.values(otherCursors).forEach(c => {
      ctx.save(); ctx.fillStyle = c.color; ctx.beginPath();
      const sz = 15 / scale; 
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + (sz * 0.7), c.y + sz);
      ctx.lineTo(c.x + (sz * 0.3), c.y + (sz * 0.8));
      ctx.fill();
      ctx.font = `500 ${12 / scale}px -apple-system, sans-serif`;
      ctx.fillText(c.name, c.x + (sz * 0.8), c.y + (sz * 1.5));
      ctx.restore();
    });
    ctx.restore();
  };

  const drawSelectionBox = (ctx, el) => {
    let { x, y, width: w = el.type === 'NOTE' ? 150 : 200, height: h = el.type === 'NOTE' ? 150 : 50 } = el.properties;

    ctx.strokeStyle = '#0052CC'; ctx.lineWidth = 1.5 / scale;
    ctx.strokeRect(x, y, w, h);

    if (['IMAGE', 'NOTE', 'TEXT'].includes(el.type) && !readOnly) {
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#0052CC';
      const sz = HANDLE_SIZE / scale;
      [{x,y}, {x:x+w,y}, {x,y:y+h}, {x:x+w,y:y+h}].forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, sz / 1.5, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      });
    }
  };

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left - panOffset.x) / scale, y: (e.clientY - rect.top - panOffset.y) / scale };
  };

  const getElementAtPosition = (x, y) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'DRAWING') continue;
      let { x: ex, y: ey, width: w, height: h } = el.properties;
      w = w || (el.type === 'NOTE' ? 150 : 200);
      h = h || (el.type === 'NOTE' ? 150 : (el.properties.text?.split('\n').length || 1) * (el.properties.fontSize || 16) * LINE_HEIGHT_RATIO);
      if (isPointInRect(x, y, ex, ey, w, h)) return el;
    }
    return null;
  };

  const getResizeHandleAtPosition = (x, y, el) => {
    if (!el || !['IMAGE', 'NOTE', 'TEXT'].includes(el.type) || readOnly) return null;
    const p = el.properties;
    const w = p.width || (el.type === 'NOTE' ? 150 : 200);
    const h = p.height || (el.type === 'NOTE' ? 150 : 50);
    const sz = (HANDLE_SIZE + 4) / scale;
    const inBox = (px, py) => isPointInRect(x, y, px - sz / 2, py - sz / 2, sz, sz);
    
    if (inBox(p.x, p.y)) return 'tl';
    if (inBox(p.x + w, p.y)) return 'tr';
    if (inBox(p.x, p.y + h)) return 'bl';
    if (inBox(p.x + w, p.y + h)) return 'br';
    return null;
  };

  const handleMouseDown = (e) => {
    if (ignoreClickRef.current || interactionState === 'WRITING') return;
    const { x, y } = getMousePos(e);

    if (e.button === 1 || activeTool === 'Hand') {
      setInteractionState('PANNING'); setStartPan({ x: e.clientX, y: e.clientY }); return;
    }

    if (readOnly) {
      setInteractionState('PANNING'); setStartPan({ x: e.clientX, y: e.clientY }); return;
    }

    if (activeTool === 'Eraser') {
      const hit = getElementAtPosition(x, y);
      if (hit) {
        setElements(prev => prev.filter(el => el.id !== hit.id));
        broadcastChange('DELETE', { elementId: hit.id });
        setHoveredElementId(null);
      } else {
        setInteractionState('ERASING'); erasePointsInRadius(x, y);
      }
      return;
    }

    if (activeTool === 'Drawing') {
      setInteractionState('DRAWING');
      setElements(prev => [...prev, { id: crypto.randomUUID(), type: 'DRAWING', zIndex: prev.length, properties: { points: [{ x, y }], color: pencilColor, width: pencilRadius } }]);
      return;
    }

    if (activeTool === 'Text' || activeTool === 'Note') {
      e.preventDefault();
      setInteractionState('WRITING');
      setTextInput({ 
        x, y, text: '', 
        type: activeTool === 'Text' ? 'TEXT' : 'NOTE', 
        fontSize: defaultTextSize, 
        color: defaultTextColor, 
        backgroundColor: activeTool === 'Note' ? NOTE_COLORS[0] : null, 
        width: activeTool === 'Note' ? 150 : 300, 
        height: activeTool === 'Note' ? 150 : 50 
      });
      return;
    }

    if (activeTool === 'Image') {
      setPendingImagePosition({ x, y }); setIsAddImagePopupOpen(true); return;
    }

    if (selectedElementId) {
      const handle = getResizeHandleAtPosition(x, y, elements.find(e => e.id === selectedElementId));
      if (handle) { setInteractionState('RESIZING'); setResizeHandle(handle); setDragStart({ x, y }); return; }
    }

    const hitElement = getElementAtPosition(x, y);
    if (hitElement) {
      setSelectedElementId(hitElement.id); setInteractionState('MOVING'); setDragStart({ x, y });
    } else {
      setSelectedElementId(null); setInteractionState('PANNING'); setStartPan({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getMousePos(e);
    broadcastChange('MOUSE_MOVE', { x, y, userName });

    if (activeTool === 'Eraser' && interactionState === 'IDLE' && !readOnly) {
      setHoveredElementId(getElementAtPosition(x, y)?.id || null);
    }
    
    if (interactionState === 'PANNING') {
      setPanOffset(prev => ({ x: prev.x + (e.clientX - startPan.x), y: prev.y + (e.clientY - startPan.y) }));
      setStartPan({ x: e.clientX, y: e.clientY });
    } else if (interactionState === 'DRAWING' && !readOnly) {
      setElements(prev => {
        const copy = [...prev];
        const lastEl = copy[copy.length - 1];
        if (lastEl?.type === 'DRAWING') lastEl.properties.points.push({ x, y });
        return copy;
      });
    } else if (interactionState === 'ERASING' && !readOnly) {
      erasePointsInRadius(x, y);
    } else if (interactionState === 'MOVING' && selectedElementId && !readOnly) {
      const dx = x - dragStart.x, dy = y - dragStart.y;
      setDragStart({ x, y });
      setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, properties: { ...el.properties, x: el.properties.x + dx, y: el.properties.y + dy } } : el));
    } else if (interactionState === 'RESIZING' && selectedElementId && !readOnly) {
      const dx = x - dragStart.x, dy = y - dragStart.y;
      setDragStart({ x, y });
      setElements(prev => prev.map(elem => {
        if (elem.id !== selectedElementId) return elem;
        let { x: ex, y: ey, width: w = elem.type === 'NOTE' ? 150 : 200, height: h = elem.type === 'NOTE' ? 150 : 50 } = elem.properties;
        const isImage = elem.type === 'IMAGE';
        const ratio = isImage ? w / h : null;

        if (resizeHandle.includes('r')) w += dx; else { w -= dx; ex += dx; }
        if (isImage) h = w / ratio;
        else if (resizeHandle.includes('b')) h += dy; else { h -= dy; ey += dy; }
        
        w = Math.max(w, 20); h = Math.max(h, 20);
        if (isImage && !resizeHandle.includes('b')) ey = (elem.properties.y + elem.properties.height) - h;
        
        return { ...elem, properties: { ...elem.properties, x: ex, y: ey, width: w, height: h } };
      }));
    }
  };

  const handleMouseUp = () => {
    if (interactionState === 'WRITING' || readOnly) return;
    if (['DRAWING', 'MOVING', 'RESIZING', 'ERASING'].includes(interactionState)) {
      const el = elements.find(e => e.id === selectedElementId) || elements[elements.length - 1];
      if (interactionState === 'DRAWING' && el) broadcastChange('CREATE', { element: el });
      else if (interactionState === 'ERASING') {
        Array.from(pendingDeletions).forEach(modId => {
          const modEl = elements.find(e => e.id === modId);
          if (modEl) broadcastChange('UPDATE', { element: modEl });
        });
        setPendingDeletions(new Set());
      } else if (el?.id) broadcastChange('UPDATE', { element: el });
    }
    setInteractionState('IDLE'); setResizeHandle(null);
  };

  const handleDoubleClick = (e) => {
    if (activeTool === 'Eraser' || readOnly) return;
    const { x, y } = getMousePos(e);
    const el = getElementAtPosition(x, y);
    if (el && ['TEXT', 'NOTE'].includes(el.type)) {
      setInteractionState('WRITING');
      setTextInput({ ...el.properties, type: el.type, id: el.id, backgroundColor: el.properties.backgroundColor || (el.type === 'NOTE' ? NOTE_COLORS[0] : null) });
      setSelectedElementId(el.id);
    }
  };

  const measureTextDimensions = (text, fontSize, maxWidth, isNote) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.font = `${fontSize}px -apple-system, sans-serif`;
    let calcWidth = 0, totalLines = 0;

    text.split('\n').forEach(p => {
      if (!p) { totalLines++; return; }
      let line = '';
      p.split(' ').forEach((w, n) => {
        const testLine = line + w + ' ';
        if (isNote && ctx.measureText(testLine).width > maxWidth - (PADDING * 2) && n > 0) {
          totalLines++; line = w + ' ';
        } else {
          line = testLine;
          if (!isNote) calcWidth = Math.max(calcWidth, ctx.measureText(line).width);
        }
      });
      totalLines++;
    });

    return {
      width: Math.max(20, isNote ? maxWidth : calcWidth + 10),
      height: Math.max(20, (totalLines * fontSize * LINE_HEIGHT_RATIO) + (isNote ? PADDING * 2 : 0))
    };
  };

  const finalizeTextInput = () => {
    ignoreClickRef.current = true;
    setTimeout(() => ignoreClickRef.current = false, 200);
    if (!textInput) return;

    let currentW = textInput.type === 'NOTE' && textAreaRef.current ? parseInt(textAreaRef.current.style.width) / scale : textInput.width;
    const dims = measureTextDimensions(textInput.text, textInput.fontSize || defaultTextSize, currentW, textInput.type === 'NOTE');

    if (!textInput.text.trim()) {
      if (textInput.id) {
        setElements(prev => prev.filter(el => el.id !== textInput.id));
        broadcastChange('DELETE', { elementId: textInput.id });
      }
      setTextInput(null); setInteractionState('IDLE'); return;
    }

    const p = { ...textInput, width: dims.width, height: dims.height, fontSize: textInput.fontSize || defaultTextSize, color: textInput.color || defaultTextColor };
    
    if (textInput.id) {
      let updated = null;
      setElements(prev => prev.map(el => {
        if (el.id === textInput.id) { updated = { ...el, properties: p }; return updated; }
        return el;
      }));
      if (updated) broadcastChange('UPDATE', { element: updated });
    } else {
      const element = { id: crypto.randomUUID(), type: textInput.type, zIndex: elements.length, properties: p };
      setElements(prev => [...prev, element]);
      broadcastChange('CREATE', { element });
    }
    setTextInput(null); setInteractionState('IDLE');
    setActiveTool(null);
  };

  const updateSelectedProperty = (key, value) => {
    if (!selectedElementId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedElementId) {
        const updated = { ...el, properties: { ...el.properties, [key]: value } };
        broadcastChange('UPDATE', { element: updated }); return updated;
      }
      return el;
    }));
  };

  const erasePointsInRadius = (mx, my) => {
    const radius = eraserRadius / scale;
    setElements(prev => prev.map(el => {
      if (el.type === 'DRAWING') {
        let modified = false;
        const newPoints = el.properties.points.map(p => {
          if (!p) return null;
          if (Math.hypot(p.x - mx, p.y - my) <= radius) { modified = true; return null; }
          return p;
        });
        if (modified) {
          if (el.id) setPendingDeletions(s => new Set(s).add(el.id));
          return { ...el, properties: { ...el.properties, points: newPoints } };
        }
      }
      return el;
    }));
  };

  const handleAddImagePopupSubmit = (e) => {
    e.preventDefault();
    if (!addImagePopupFormData.url) return;
    const img = new Image();
    img.src = addImagePopupFormData.url;
    img.onload = () => {
      const element = { id: crypto.randomUUID(), type: "IMAGE", zIndex: elements.length, properties: { url: addImagePopupFormData.url, x: pendingImagePosition?.x || 100, y: pendingImagePosition?.y || 100, width: 200, height: 200 * (img.height / img.width) } };
      setElements(p => [...p, element]);
      broadcastChange('CREATE', { element }); loadImage(addImagePopupFormData.url);
      
      setIsAddImagePopupOpen(false); 
      setAddImagePopupFormData({ url: '' });
      setActiveTool(null); 
    };
    img.onerror = () => alert("Could not load image. Please check the URL.");
  };

  const getCursorStyle = () => {
    if (interactionState === 'PANNING') return 'grabbing';
    if (activeTool === 'Eraser') return hoveredElementId ? 'pointer' : 'cell';
    if (activeTool === 'Drawing') return 'crosshair';
    if (['Text', 'Note'].includes(activeTool)) return 'text';
    if (interactionState === 'RESIZING') return 'nwse-resize';
    if (interactionState === 'MOVING' || selectedElementId) return 'move';
    return 'default';
  };

  const getOverlayStyle = (baseX, baseY, w, h) => {
    const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    return { position: 'fixed', left: rect.left + (baseX * scale) + panOffset.x, top: rect.top + (baseY * scale) + panOffset.y, width: w * scale, height: h * scale };
  };

  const handleToolClick = (tool) => {
    setActiveTool(activeTool === tool ? null : tool);
    setSelectedElementId(null);
  };

  const selectedElement = elements.find(e => e.id === selectedElementId);
  const showProperties = activeTool === 'Drawing' || activeTool === 'Eraser' || (!activeTool && selectedElementId && selectedElement && ['TEXT', 'NOTE'].includes(selectedElement.type));

  return (
    <div 
      className="canvas-container"
      style={{
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        backgroundSize: `${20 * scale}px ${20 * scale}px`
      }}
    >
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onDoubleClick={handleDoubleClick} 
        style={{ cursor: getCursorStyle(), display: 'block', touchAction: 'none' }} 
      />

      {!readOnly && (
        <div className="canvas-unified-toolbar">
          <div className="toolbar-tools">
            {['Text', 'Image', 'Note', 'Drawing', 'Eraser'].map(type => (
              <button 
                key={type}
                onClick={() => handleToolClick(type)}
                className={`tool-button ${activeTool === type ? "active" : ""}`}
                title={activeTool === type ? "Click to deselect" : `Select ${type}`}
              >
                {type}
              </button>
            ))}
          </div>

          {showProperties && (
            <>
              <div className="toolbar-divider" />
              <div className="toolbar-properties">
                {activeTool === 'Drawing' && (
                  <>
                    <input className="toolbar-color-picker" type="color" value={pencilColor} onChange={e => setPencilColor(e.target.value)} />
                    <input className="toolbar-slider" type="range" min="1" max="20" value={pencilRadius} onChange={e => setPencilRadius(Number(e.target.value))} />
                  </>
                )}
                
                {activeTool === 'Eraser' && (
                  <>
                    <span className="toolbar-label">Size</span>
                    <input className="toolbar-slider" type="range" min="5" max="50" value={eraserRadius} onChange={e => setEraserRadius(Number(e.target.value))} />
                  </>
                )}
                
                {!activeTool && selectedElement && (
                  <>
                    {selectedElement.type === 'NOTE' && (
                      <div className="toolbar-swatches">
                        {NOTE_COLORS.map(color => (
                          <button
                            key={color}
                            className={`color-swatch ${selectedElement.properties.backgroundColor === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateSelectedProperty('backgroundColor', color)}
                            title="Change color"
                          />
                        ))}
                      </div>
                    )}
                    <input className="toolbar-color-picker" type="color" value={selectedElement.properties.color || '#172B4D'} onChange={e => updateSelectedProperty('color', e.target.value)} />
                    <input className="toolbar-input-number" type="number" value={selectedElement.properties.fontSize || 16} onChange={e => updateSelectedProperty('fontSize', Number(e.target.value))} />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="zoom-panel">
        {Math.round(scale * 100)}%
      </div>

      {textInput && (
        <textarea
          ref={textAreaRef} 
          value={textInput.text}
          onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
          onBlur={finalizeTextInput}
          onMouseDown={e => e.stopPropagation()}
          className={`canvas-textarea ${textInput.type === 'NOTE' ? 'is-note' : 'is-text'}`}
          style={{
            ...getOverlayStyle(textInput.x, textInput.y, textInput.width, textInput.height),
            fontSize: `${(textInput.fontSize || 16) * scale}px`, 
            lineHeight: LINE_HEIGHT_RATIO,
            color: textInput.color || '#172B4D',
            backgroundColor: textInput.type === 'NOTE' ? (textInput.backgroundColor || NOTE_COLORS[0]) : undefined,
            padding: textInput.type === 'NOTE' ? `${PADDING * scale}px` : '4px',
          }}
          placeholder="Start typing..."
        />
      )}

      {isAddImagePopupOpen && (
        <div className="popup-overlay" onClick={() => {
          setIsAddImagePopupOpen(false);
          setActiveTool(null);
        }}>
          <form className="popup-content" onClick={e => e.stopPropagation()} onSubmit={handleAddImagePopupSubmit}>
            <h3 className="popup-title">Add Image</h3>
            <input className="popup-input" autoFocus value={addImagePopupFormData.url} onChange={(e) => setAddImagePopupFormData({ url: e.target.value })} placeholder="Enter Image URL (https://...)" />
            <div className="popup-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { 
                  setIsAddImagePopupOpen(false); 
                  setActiveTool(null); 
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">Insert Image</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Canvas;