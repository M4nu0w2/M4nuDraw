import React, { useRef, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, DrawData } from '@skribbl/shared';
import { Trash2, Edit2, Eraser } from 'lucide-react';

interface DrawingCanvasProps {
  isDrawer: boolean;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

const COLORS = [
  '#000000', // Nero
  '#f87171', // Rosso
  '#fb923c', // Arancione
  '#facc15', // Giallo
  '#4ade80', // Verde
  '#22d3ee', // Celeste
  '#60a5fa', // Blu
  '#c084fc', // Viola
  '#f472b6', // Rosa
  '#78350f', // Marrone
  '#ffffff'  // Bianco
];

const BRUSH_SIZES = [
  { size: 3, label: 'Sottile' },
  { size: 8, label: 'Medio' },
  { size: 15, label: 'Spesso' },
  { size: 25, label: 'Extra' }
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ isDrawer, socket }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(8);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  
  // Traccia le coordinate precedenti
  const prevCoordsRef = useRef<{ x: number; y: number } | null>(null);

  // Inizializza il canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Imposta sfondo bianco iniziale
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Gestisce gli eventi in tempo reale per gli spettatori
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleDrawData = (data: DrawData) => {
      // Disegna sulla lavagna dello spettatore
      ctx.beginPath();
      ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
      ctx.lineWidth = data.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // I punti contengono [prevX, prevY, currX, currY]
      ctx.moveTo(data.points[0], data.points[1]);
      ctx.lineTo(data.points[2], data.points[3]);
      ctx.stroke();
    };

    const handleDrawHistory = (history: DrawData[]) => {
      // Disegna la cronologia intera dei tratti per i giocatori che entrano a partita in corso
      history.forEach((data) => {
        ctx.beginPath();
        ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
        ctx.lineWidth = data.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(data.points[0], data.points[1]);
        ctx.lineTo(data.points[2], data.points[3]);
        ctx.stroke();
      });
    };

    const handleClearCanvas = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('drawData', handleDrawData);
    socket.on('drawHistory', handleDrawHistory);
    socket.on('clearCanvas', handleClearCanvas);

    return () => {
      socket.off('drawData', handleDrawData);
      socket.off('drawHistory', handleDrawHistory);
      socket.off('clearCanvas', handleClearCanvas);
    };
  }, [socket]);

  // Ritorna le coordinate corrette basate sulla scala fissa del canvas (800x500)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Proporzione tra le dimensioni virtuali (800x500) e quelle reali di rendering client
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    if (e.cancelable) e.preventDefault();
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    prevCoordsRef.current = coords;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;
    if (e.cancelable) e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    const prevCoords = prevCoordsRef.current;

    if (prevCoords) {
      ctx.beginPath();
      // Se si usa la gomma, il colore di disegno diventa bianco (corrispondente allo sfondo)
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(prevCoords.x, prevCoords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      // Invia i dati di disegno al backend in tempo reale
      const drawData: DrawData = {
        tool,
        color: tool === 'eraser' ? '#ffffff' : color,
        size,
        points: [prevCoords.x, prevCoords.y, coords.x, coords.y]
      };
      socket.emit('draw', drawData);
    }

    prevCoordsRef.current = coords;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    prevCoordsRef.current = null;
  };

  const handleClear = () => {
    if (!isDrawer) return;
    socket.emit('clearCanvas');
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Contenitore Canvas con aspect ratio fisso per garantire sincronia coordinate */}
      <div className="relative w-full aspect-[8/5] bg-white rounded-2xl border-2 border-slate-800 shadow-lg overflow-hidden group">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className={`w-full h-full block ${isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
        />
        {!isDrawer && (
          <div className="absolute inset-0 bg-slate-950/5 pointer-events-none group-hover:bg-transparent transition-all duration-200" />
        )}
      </div>

      {/* Pannello Strumenti (Solo per il Disegnatore) */}
      {isDrawer && (
        <div className="p-4 backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          
          {/* Toggles Strumenti (Penna / Gomma) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-xl border active:scale-95 transition-all duration-150 ${
                tool === 'pen'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Penna"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-xl border active:scale-95 transition-all duration-150 ${
                tool === 'eraser'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Gomma"
            >
              <Eraser size={18} />
            </button>
            
            <div className="h-6 w-[1px] bg-slate-850 mx-2" />

            {/* Pulsante Pulisci Lavagna */}
            <button
              onClick={handleClear}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 active:scale-95 transition-all duration-150 flex items-center gap-1.5 text-xs font-bold"
              title="Pulisci Lavagna"
            >
              <Trash2 size={16} />
              Pulisci
            </button>
          </div>

          {/* Selettore Spessore Pennello */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850/60 p-1 rounded-xl">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => setSize(b.size)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all duration-150 ${
                  size === b.size
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Tavolozza Colori */}
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool('pen'); // Commuta automaticamente sulla penna quando selezioni un colore
                }}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border transition-all duration-150 transform hover:scale-115 active:scale-90 ${
                  color === c && tool === 'pen'
                    ? 'border-blue-400 ring-2 ring-blue-500/30 scale-110'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
                title={c}
              />
            ))}
          </div>

        </div>
      )}
    </div>
  );
};
