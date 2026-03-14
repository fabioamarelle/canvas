import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';

const HANDLE_SIZE = 8;
const LINE_HEIGHT_RATIO = 1.2;
const PADDING = 10;
const ZOOM_SENSITIVITY = 0.001;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

const isPointInRect = (px, py, rectX, rectY, width, height) => {
  return px >= rectX && px <= rectX + width && py >= rectY && py <= rectY + height;
};

const drawMultiLineText = (ctx, text, x, y, width, fontSize, isNote) => {
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';

  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const maxWidth = isNote ? width - (PADDING * 2) : width;
  const startX = isNote ? x + PADDING : x;
  let currentY = isNote ? y + PADDING : y;

  const paragraphs = text.split('\n');

  paragraphs.forEach(paragraph => {
    if (paragraph === '') {
      currentY += lineHeight;
      return;
    }
    const words = paragraph.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, startX, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, startX, currentY);
    currentY += lineHeight;
  });
};

const Canvas = ({ activeTool, setActiveTool, userName = "Usuari" }) => {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const ignoreClickRef = useRef(false);
  const wsRef = useRef(null);
  const { id } = useParams();

  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [hoveredElementId, setHoveredElementId] = useState(null);
  
  const [otherCursors, setOtherCursors] = useState({});

  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const [interactionState, setInteractionState] = useState('IDLE');
  const [resizeHandle, setResizeHandle] = useState(null);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pendingDeletions, setPendingDeletions] = useState(new Set());

  const [pencilRadius, setPencilRadius] = useState(3);
  const [pencilColor, setPencilColor] = useState("#000000");
  const [eraserRadius, setEraserRadius] = useState(10);
  const [defaultTextSize, setDefaultTextSize] = useState(16);
  const [defaultTextColor, setDefaultTextColor] = useState("#000000");

  const [isAddImagePopupOpen, setIsAddImagePopupOpen] = useState(false);
  const [addImagePopupFormData, setAddImagePopupFormData] = useState({ url: '' });
  const [pendingImagePosition, setPendingImagePosition] = useState(null);
  const [textInput, setTextInput] = useState(null);

  const imageCache = useRef(new Map());

  useEffect(() => {
    if (!id) return;

    const wsUrl = import.meta.env.VITE_WS_URL 
      ? `${import.meta.env.VITE_WS_URL}/${id}` 
      : `wss://api-canvas.fabioamarelle.com:8080/ws/whiteboard/${id}`;
      
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.action === 'CREATE' || message.action === 'UPDATE') {
        setElements(prev => {
          const exists = prev.some(e => e.id === message.element.id);
          if (exists) return prev.map(e => e.id === message.element.id ? message.element : e);
          return [...prev, message.element].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        });
        if (message.element.type === 'IMAGE' && message.element.properties.url) {
          loadImage(message.element.properties.url);
        }
      } else if (message.action === 'DELETE') {
        setElements(prev => prev.filter(e => e.id !== message.elementId));
      } 
      else if (message.action === 'MOUSE_MOVE') {
        setOtherCursors(prev => ({
          ...prev,
          [message.sessionId]: { x: message.x, y: message.y, name: message.userName, color: 'black'}
        }));
      } else if (message.action === 'DELETE_CURSOR') {
        setOtherCursors(prev => {
          const copy = { ...prev };
          delete copy[message.sessionId];
          return copy;
        });
      }
    };

    return () => ws.close();
  }, [id]);

  const broadcastChange = (action, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, ...payload }));
    }
  };

  useEffect(() => {
    const loadElements = async () => {
      try {
        const response = await apiClient.get(`/whiteboards/${id}`);
        const loadedElements = response.data.elementList || response.data.elements || [];
        loadedElements.forEach(el => {
          if (el.type === 'IMAGE' && el.properties.url) loadImage(el.properties.url);
        });
        setElements(loadedElements);
      } catch (error) { console.error("Error loading elements:", error); }
    };
    if (id) loadElements();
  }, [id]);

  const loadImage = (url) => {
    if (!imageCache.current.has(url)) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        imageCache.current.set(url, img);
        renderCanvas();
      };
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && !textInput) {
        setElements(prev => prev.filter(el => el.id !== selectedElementId));
        broadcastChange('DELETE', { elementId: selectedElementId });
        setSelectedElementId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, textInput]);

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
        const zoomDelta = -e.deltaY * ZOOM_SENSITIVITY;
        const newScale = Math.min(Math.max(scale + zoomDelta, MIN_ZOOM), MAX_ZOOM);
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = (mouseX - panOffset.x) / scale;
        const worldY = (mouseY - panOffset.y) / scale;
        const newPanX = mouseX - worldX * newScale;
        const newPanY = mouseY - worldY * newScale;
        setScale(newScale);
        setPanOffset({ x: newPanX, y: newPanY });
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
    const context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(panOffset.x, panOffset.y);
    context.scale(scale, scale);

    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    sortedElements.forEach(el => {
      context.save();
      const props = el.properties;

      if (activeTool === 'Eraser' && hoveredElementId === el.id && el.type !== 'DRAWING') {
        context.shadowColor = "red";
        context.shadowBlur = 15;
      }

      switch (el.type) {
        case 'DRAWING':
          if (props.points && props.points.length > 0) {
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = props.width;
            context.strokeStyle = props.color;
            context.beginPath();
            let isDrawing = false;
            for (let i = 0; i < props.points.length; i++) {
              const p = props.points[i];
              if (p === null) {
                if (isDrawing) context.stroke();
                isDrawing = false;
                context.beginPath();
              } else {
                if (!isDrawing) { context.moveTo(p.x, p.y); isDrawing = true; }
                else { context.lineTo(p.x, p.y); }
              }
            }
            if (isDrawing) context.stroke();
          }
          break;
        case 'IMAGE':
          const img = imageCache.current.get(props.url);
          if (img) context.drawImage(img, props.x, props.y, props.width, props.height);
          break;
        case 'TEXT':
          context.fillStyle = props.color || 'black';
          drawMultiLineText(context, props.text, props.x, props.y, props.width || 200, props.fontSize || 16, false);
          break;
        case 'NOTE':
          context.fillStyle = props.backgroundColor || "#fff740";
          if (activeTool !== 'Eraser' || hoveredElementId !== el.id) {
            context.shadowColor = "rgba(0,0,0,0.2)";
            context.shadowBlur = 10 / scale;
          }
          context.fillRect(props.x, props.y, props.width || 150, props.height || 150);
          context.shadowBlur = 0;
          context.fillStyle = props.color || "black";
          drawMultiLineText(context, props.text, props.x, props.y, props.width || 150, props.fontSize || 16, true);
          break;
        default: break;
      }
      context.restore();
    });

    if (selectedElementId && activeTool !== 'Eraser') {
      const el = elements.find(e => e.id === selectedElementId);
      if (el) drawSelectionBox(context, el);
    }

    Object.values(otherCursors).forEach(c => {
      context.save();
      context.fillStyle = c.color;
      context.beginPath();
      
      const cursorSize = 15 / scale; 
      
      context.moveTo(c.x, c.y);
      context.lineTo(c.x + (cursorSize * 0.7), c.y + cursorSize);
      context.lineTo(c.x + (cursorSize * 0.3), c.y + (cursorSize * 0.8));
      context.fill();

      context.font = `${12 / scale}px sans-serif`;
      context.fillText(c.name, c.x + (cursorSize * 0.8), c.y + (cursorSize * 1.5));
      context.restore();
    });

    context.restore();
  };

  const drawSelectionBox = (ctx, el) => {
    let { x, y, width, height } = el.properties;
    if (!width) width = el.type === 'NOTE' ? 150 : 200;
    if (!height) height = el.type === 'NOTE' ? 150 : 50;

    ctx.strokeStyle = '#00a8ff';
    ctx.lineWidth = 1 / scale;
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    if (['IMAGE', 'NOTE', 'TEXT'].includes(el.type)) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#00a8ff';
      const scaledHandleSize = HANDLE_SIZE / scale;
      const handles = [{ x, y }, { x: x + width, y }, { x, y: y + height }, { x: x + width, y: y + height }];
      handles.forEach(h => {
        ctx.beginPath();
        ctx.rect(h.x - scaledHandleSize / 2, h.y - scaledHandleSize / 2, scaledHandleSize, scaledHandleSize);
        ctx.fill(); ctx.stroke();
      });
    }
  };

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / scale,
      y: (e.clientY - rect.top - panOffset.y) / scale,
    };
  };

  const getElementAtPosition = (x, y) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      let { x: ex, y: ey, width, height } = el.properties;
      if (el.type === 'DRAWING') continue;
      if (el.type === 'NOTE') { width = width || 150; height = height || 150; }
      else if (el.type === 'TEXT') {
        width = width || 200;
        if (!height) {
          const lines = el.properties.text.split('\n').length;
          height = lines * (el.properties.fontSize || 16) * LINE_HEIGHT_RATIO;
        }
      }
      if (isPointInRect(x, y, ex, ey, width, height)) return el;
    }
    return null;
  };

  const getResizeHandleAtPosition = (x, y, el) => {
    if (!el || !['IMAGE', 'NOTE', 'TEXT'].includes(el.type)) return null;
    let { x: ex, y: ey, width: w, height: h } = el.properties;
    if (!w) w = el.type === 'NOTE' ? 150 : 200;
    if (!h) h = el.type === 'NOTE' ? 150 : 50;
    const hs = (HANDLE_SIZE + 4) / scale;
    if (isPointInRect(x, y, ex - hs / 2, ey - hs / 2, hs, hs)) return 'tl';
    if (isPointInRect(x, y, ex + w - hs / 2, ey - hs / 2, hs, hs)) return 'tr';
    if (isPointInRect(x, y, ex - hs / 2, ey + h - hs / 2, hs, hs)) return 'bl';
    if (isPointInRect(x, y, ex + w - hs / 2, ey + h - hs / 2, hs, hs)) return 'br';
    return null;
  };

  const handleMouseDown = (e) => {
    if (ignoreClickRef.current) return;
    if (interactionState === 'WRITING') return;

    const { x, y } = getMousePos(e);

    if (activeTool === 'Eraser') {
      const hit = getElementAtPosition(x, y);
      if (hit) {
        setElements(prev => prev.filter(el => el.id !== hit.id));
        broadcastChange('DELETE', { elementId: hit.id });
        setHoveredElementId(null);
      } else {
        setInteractionState('ERASING');
        erasePointsInRadius(x, y);
      }
      return;
    }
    if (e.button === 1 || activeTool === 'Hand') {
      setInteractionState('PANNING');
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }
    if (activeTool === 'Drawing') {
      setInteractionState('DRAWING');
      const newId = crypto.randomUUID();
      setElements(prev => [...prev, {
        id: newId,
        type: 'DRAWING',
        zIndex: prev.length,
        properties: { points: [{ x, y }], color: pencilColor, width: pencilRadius }
      }]);
      return;
    }
    if (activeTool === 'Text' || activeTool === 'Note') {
      e.preventDefault();
      setInteractionState('WRITING');
      setTextInput({
        x, y, text: '', type: activeTool === 'Text' ? 'TEXT' : 'NOTE',
        fontSize: defaultTextSize, color: defaultTextColor,
        backgroundColor: activeTool === 'Note' ? '#fff740' : null,
        width: activeTool === 'Note' ? 150 : 300,
        height: activeTool === 'Note' ? 150 : 50
      });
      return;
    }
    if (activeTool === 'Image') {
      setPendingImagePosition({ x, y });
      setIsAddImagePopupOpen(true);
      return;
    }
    if (selectedElementId) {
      const el = elements.find(e => e.id === selectedElementId);
      const handle = getResizeHandleAtPosition(x, y, el);
      if (handle) {
        setInteractionState('RESIZING');
        setResizeHandle(handle);
        setDragStart({ x, y });
        return;
      }
    }
    const hitElement = getElementAtPosition(x, y);
    if (hitElement) {
      setSelectedElementId(hitElement.id);
      setInteractionState('MOVING');
      setDragStart({ x, y });
    } else {
      setSelectedElementId(null);
      setInteractionState('PANNING');
      setStartPan({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getMousePos(e);

    broadcastChange('MOUSE_MOVE', { x, y, userName });

    if (activeTool === 'Eraser' && interactionState === 'IDLE') {
      const hit = getElementAtPosition(x, y);
      setHoveredElementId(hit ? hit.id : null);
    }
    if (interactionState === 'PANNING') {
      const dx = e.clientX - startPan.x;
      const dy = e.clientY - startPan.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }
    if (interactionState === 'DRAWING') {
      setElements(prev => {
        const copy = [...prev];
        const lastEl = { ...copy[copy.length - 1] };
        if (lastEl.type === 'DRAWING') {
          lastEl.properties.points.push({ x, y });
          copy[copy.length - 1] = lastEl;
        }
        return copy;
      });
      return;
    }
    if (interactionState === 'ERASING') {
      erasePointsInRadius(x, y);
      return;
    }
    if (interactionState === 'MOVING' && selectedElementId) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      setDragStart({ x, y });
      setElements(prev => prev.map(el => {
        if (el.id === selectedElementId) return { ...el, properties: { ...el.properties, x: el.properties.x + dx, y: el.properties.y + dy } };
        return el;
      }));
      return;
    }
    if (interactionState === 'RESIZING' && selectedElementId) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      setDragStart({ x, y });
      setElements(prev => prev.map(elem => {
        if (elem.id !== selectedElementId) return elem;
        let { x: ex, y: ey, width: w, height: h } = elem.properties;
        w = w || (elem.type === 'NOTE' ? 150 : 200);
        h = h || (elem.type === 'NOTE' ? 150 : 50);
        const isImage = elem.type === 'IMAGE';
        const aspectRatio = isImage ? w / h : null;
        if (resizeHandle.includes('r')) w += dx;
        else { w -= dx; ex += dx; }
        if (isImage) { h = w / aspectRatio; }
        else {
          if (resizeHandle.includes('b')) h += dy;
          else { h -= dy; ey += dy; }
        }
        if (w < 20) w = 20; if (h < 20) h = 20;
        if (isImage && !resizeHandle.includes('b')) ey = (elem.properties.y + elem.properties.height) - h;
        return { ...elem, properties: { ...elem.properties, x: ex, y: ey, width: w, height: h } };
      }));
    }
  };

  const handleMouseUp = () => {
    if (interactionState === 'WRITING') return;

    if (['DRAWING', 'MOVING', 'RESIZING', 'ERASING'].includes(interactionState)) {
      const el = elements.find(e => e.id === selectedElementId) || elements[elements.length - 1];

      if (interactionState === 'DRAWING' && el) {
        broadcastChange('CREATE', { element: el });
      } else if (interactionState === 'ERASING') {
        const modified = Array.from(pendingDeletions);
        modified.forEach(modId => {
          const modEl = elements.find(e => e.id === modId);
          if (modEl) broadcastChange('UPDATE', { element: modEl });
        });
        setPendingDeletions(new Set());
      } else if (el && el.id) {
        broadcastChange('UPDATE', { element: el });
      }
    }
    setInteractionState('IDLE');
    setResizeHandle(null);
  };

  const handleDoubleClick = (e) => {
    if (activeTool === 'Eraser') return;
    const { x, y } = getMousePos(e);
    const el = getElementAtPosition(x, y);
    if (el && (el.type === 'TEXT' || el.type === 'NOTE')) {
      setInteractionState('WRITING');
      setTextInput({
        x: el.properties.x,
        y: el.properties.y,
        text: el.properties.text,
        type: el.type,
        id: el.id,
        fontSize: el.properties.fontSize,
        color: el.properties.color,
        backgroundColor: el.properties.backgroundColor || (el.type === 'NOTE' ? '#fff740' : null),
        width: el.properties.width,
        height: el.properties.height
      });
      setSelectedElementId(el.id);
    }
  };

  const measureTextDimensions = (text, fontSize, maxWidth, isNote) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.font = `${fontSize}px sans-serif`;

    const lines = text.split('\n');
    let calculatedWidth = 0;
    let calculatedHeight = 0;
    const lineHeight = fontSize * LINE_HEIGHT_RATIO;
    const padding = isNote ? PADDING : 0;

    if (!isNote) {
      lines.forEach(line => {
        const w = ctx.measureText(line).width;
        if (w > calculatedWidth) calculatedWidth = w;
      });
      calculatedWidth += 10;
      calculatedHeight = lines.length * lineHeight;
    } else {
      const effectiveWidth = maxWidth - (padding * 2);
      let totalLines = 0;
      lines.forEach(paragraph => {
        if (paragraph === '') { totalLines++; return; }
        const words = paragraph.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > effectiveWidth && n > 0) {
            totalLines++;
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        totalLines++;
      });
      calculatedWidth = maxWidth;
      calculatedHeight = (totalLines * lineHeight) + (padding * 2);
    }

    return {
      width: Math.max(20, calculatedWidth),
      height: Math.max(20, calculatedHeight)
    };
  };

  const finalizeTextInput = () => {
    ignoreClickRef.current = true;
    setTimeout(() => { ignoreClickRef.current = false; }, 200);

    if (!textInput) return;

    let currentWidth = textInput.width;
    if (textAreaRef.current && textInput.type === 'NOTE') {
      currentWidth = parseInt(textAreaRef.current.style.width) / scale;
    }

    const dims = measureTextDimensions(
      textInput.text,
      textInput.fontSize || defaultTextSize,
      currentWidth,
      textInput.type === 'NOTE'
    );

    if (!textInput.text.trim()) {
      if (textInput.id) {
        setElements(prev => prev.filter(el => el.id !== textInput.id));
        broadcastChange('DELETE', { elementId: textInput.id });
      }
      setTextInput(null);
      setInteractionState('IDLE');
      return;
    }

    const properties = {
      x: textInput.x,
      y: textInput.y,
      text: textInput.text,
      fontSize: textInput.fontSize || defaultTextSize,
      color: textInput.color || defaultTextColor,
      backgroundColor: textInput.backgroundColor,
      width: dims.width,
      height: dims.height
    };

    if (textInput.id) {
      let updatedElement = null;
      setElements(prev => prev.map(el => {
        if (el.id === textInput.id) {
          updatedElement = { ...el, properties: { ...el.properties, ...properties } };
          return updatedElement;
        }
        return el;
      }));
      if (updatedElement) broadcastChange('UPDATE', { element: updatedElement });
    } else {
      const element = {
        id: crypto.randomUUID(),
        type: textInput.type,
        zIndex: elements.length,
        properties
      };
      setElements(prev => [...prev, element]);
      broadcastChange('CREATE', { element });
    }
    setTextInput(null);
    setInteractionState('IDLE');
    if (setActiveTool) setActiveTool(null);
  };

  const updateSelectedProperty = (key, value) => {
    if (!selectedElementId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedElementId) {
        const updated = { ...el, properties: { ...el.properties, [key]: value } };
        broadcastChange('UPDATE', { element: updated });
        return updated;
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
          if (p === null) return null;
          if (Math.hypot(p.x - mx, p.y - my) <= radius) {
            modified = true;
            return null;
          }
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
    const url = addImagePopupFormData.url;
    if (!url) return;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const element = {
        id: crypto.randomUUID(),
        type: "IMAGE",
        zIndex: elements.length,
        properties: { url, x: pendingImagePosition?.x || 100, y: pendingImagePosition?.y || 100, width: 200, height: 200 * (img.height / img.width) }
      };
      setElements(p => [...p, element]);
      broadcastChange('CREATE', { element });
      loadImage(url);
      setIsAddImagePopupOpen(false);
      setAddImagePopupFormData({ url: '' });
    };
    img.onerror = () => alert("Could not load image. Please check the URL.");
  };

  const getCursorStyle = () => {
    if (interactionState === 'PANNING') return 'grabbing';
    if (activeTool === 'Eraser') return hoveredElementId ? 'pointer' : 'cell';
    if (activeTool === 'Drawing') return 'crosshair';
    if (activeTool === 'Text' || activeTool === 'Note') return 'text';
    if (interactionState === 'RESIZING') return 'nwse-resize';
    if (interactionState === 'MOVING') return 'move';
    if (selectedElementId) return 'move';
    return 'default';
  };

  const getOverlayStyle = (baseX, baseY, w, h) => {
    const screenX = (baseX * scale) + panOffset.x;
    const screenY = (baseY * scale) + panOffset.y;
    const canvasRect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : { left: 0, top: 0 };
    return {
      position: 'fixed',
      left: canvasRect.left + screenX,
      top: canvasRect.top + screenY,
      width: w * scale,
      height: h * scale
    };
  };

  const popupOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(2px)'
  };

  const popupContentStyle = {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    width: '400px',
    maxWidth: '90%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontFamily: 'sans-serif'
  };

  const popupInputStyle = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    outlineColor: '#00a8ff'
  };

  const primaryButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#00a8ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  };

  const secondaryButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '10px'
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: getCursorStyle(), display: 'block', touchAction: 'none' }}
      />

      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: '10px', background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', flexWrap: 'wrap', zIndex: 100 }}>
        {activeTool === 'Drawing' && (
          <>
            <input type="color" value={pencilColor} onChange={e => setPencilColor(e.target.value)} />
            <input type="range" min="1" max="20" value={pencilRadius} onChange={e => setPencilRadius(Number(e.target.value))} />
          </>
        )}
        {activeTool === 'Eraser' && (
          <>
            <span>Eraser Size:</span>
            <input type="range" min="5" max="50" value={eraserRadius} onChange={e => setEraserRadius(Number(e.target.value))} />
          </>
        )}
        {!activeTool && selectedElementId && (() => {
          const el = elements.find(e => e.id === selectedElementId);
          if (!el) return null;
          if (el.type === 'TEXT') return (
            <>
              <input type="color" value={el.properties.color} onChange={e => updateSelectedProperty('color', e.target.value)} />
              <input type="number" style={{ width: 50 }} value={el.properties.fontSize} onChange={e => updateSelectedProperty('fontSize', Number(e.target.value))} />
            </>
          );
          if (el.type === 'NOTE') return (
            <>
              <input type="color" value={el.properties.backgroundColor || '#fff740'} onChange={e => updateSelectedProperty('backgroundColor', e.target.value)} />
              <input type="color" value={el.properties.color} onChange={e => updateSelectedProperty('color', e.target.value)} />
              <input type="number" style={{ width: 50 }} value={el.properties.fontSize} onChange={e => updateSelectedProperty('fontSize', Number(e.target.value))} />
            </>
          );
          return null;
        })()}
        <span style={{ fontSize: '12px', color: '#999', alignSelf: 'center', marginLeft: 10 }}>
          Zoom: {Math.round(scale * 100)}%
        </span>
      </div>

      {textInput && (
        <textarea
          ref={textAreaRef}
          autoFocus
          value={textInput.text}
          onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
          onBlur={finalizeTextInput}
          style={{
            ...getOverlayStyle(textInput.x, textInput.y, textInput.width, textInput.height),
            fontSize: `${(textInput.fontSize || 16) * scale}px`,
            fontFamily: 'sans-serif',
            lineHeight: LINE_HEIGHT_RATIO,
            color: textInput.color || 'black',
            backgroundColor: textInput.type === 'NOTE' ? (textInput.backgroundColor || '#fff740') : 'transparent',
            padding: textInput.type === 'NOTE' ? `${PADDING * scale}px` : '0px',
            border: textInput.type === 'NOTE' ? 'none' : '1px dashed #00a8ff',
            outline: 'none',
            resize: 'both',
            overflow: 'hidden',
            zIndex: 100,
            boxSizing: 'border-box'
          }}
          placeholder="Type here..."
        />
      )}

      {isAddImagePopupOpen && (
        <div style={popupOverlayStyle} onClick={() => setIsAddImagePopupOpen(false)}>
          <form
            style={popupContentStyle}
            onClick={e => e.stopPropagation()}
            onSubmit={handleAddImagePopupSubmit}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Add Image</h3>

            <input
              style={popupInputStyle}
              autoFocus
              value={addImagePopupFormData.url}
              onChange={(e) => setAddImagePopupFormData({ url: e.target.value })}
              placeholder="Enter Image URL (https://...)"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => setIsAddImagePopupOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={primaryButtonStyle}
              >
                Add Image
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Canvas;