import React, { useRef, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, DrawData } from '@skribbl/shared';
import { Trash2, Edit2, Eraser, Undo } from 'lucide-react';
import { soundManager } from '../utils/sound';

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
  const [isRainbow, setIsRainbow] = useState(false);
  const [isSymmetric, setIsSymmetric] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Traccia le coordinate precedenti
  const prevCoordsRef = useRef<{ x: number; y: number } | null>(null);
  
  // Traccia l'ID univoco del tratto corrente
  const strokeIdRef = useRef<number>(0);

  // Gestore scorciatoia Ctrl+Z per annullare
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDrawer && e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        socket.emit('undoStroke');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawer, socket]);

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

    const handleBombCanvas = () => {
      setShake(true);
      soundManager.playBombExplosion();
      setTimeout(() => setShake(false), 600);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('drawData', handleDrawData);
    socket.on('drawHistory', handleDrawHistory);
    socket.on('clearCanvas', handleClearCanvas);
    socket.on('bombCanvas', handleBombCanvas);

    return () => {
      socket.off('drawData', handleDrawData);
      socket.off('drawHistory', handleDrawHistory);
      socket.off('clearCanvas', handleClearCanvas);
      socket.off('bombCanvas', handleBombCanvas);
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
    
    // Inizia un nuovo tratto con ID basato sul timestamp
    strokeIdRef.current = Date.now() + Math.random();
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
      const strokeColor = tool === 'eraser' 
        ? '#ffffff' 
        : (isRainbow ? `hsl(${(Date.now() / 12) % 360}, 100%, 50%)` : color);

      // Tratto standard
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(prevCoords.x, prevCoords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      const drawData: DrawData = {
        tool,
        color: strokeColor,
        size,
        points: [prevCoords.x, prevCoords.y, coords.x, coords.y],
        strokeId: strokeIdRef.current
      };
      socket.emit('draw', drawData);

      // Tratto Simmetrico (Symmetry / Mirror Mode)
      if (isSymmetric) {
        const mx1 = 800 - prevCoords.x;
        const mx2 = 800 - coords.x;

        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(mx1, prevCoords.y);
        ctx.lineTo(mx2, coords.y);
        ctx.stroke();

        const mirrorData: DrawData = {
          tool,
          color: strokeColor,
          size,
          points: [mx1, prevCoords.y, mx2, coords.y],
          strokeId: strokeIdRef.current
        };
        socket.emit('draw', mirrorData);
      }
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

  const handleBomb = () => {
    if (!isDrawer) return;
    socket.emit('bombCanvas');
  };

  const handleUndo = () => {
    if (!isDrawer) return;
    socket.emit('undoStroke');
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Contenitore Canvas con aspect ratio fisso per garantire sincronia coordinate */}
      <div className={`relative w-full aspect-[8/5] bg-white rounded-2xl border-2 border-slate-800 shadow-lg overflow-hidden group transition-all duration-300 ${shake ? 'animate-shake ring-4 ring-rose-500/40 border-rose-500 shadow-rose-500/10' : ''}`}>
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
              onClick={() => {
                setTool('pen');
                setIsRainbow(false);
              }}
              className={`p-2 rounded-xl border active:scale-95 transition-all duration-150 ${
                tool === 'pen' && !isRainbow
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Penna Classica"
            >
              <Edit2 size={18} />
            </button>
            
            <button
              onClick={() => {
                setIsRainbow(!isRainbow);
                setTool('pen');
              }}
              className={`p-2 rounded-xl border active:scale-95 transition-all duration-150 flex items-center justify-center ${
                isRainbow && tool === 'pen'
                  ? 'rainbow-glow border-purple-500 text-slate-950 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              style={{ minWidth: '38px', minHeight: '38px' }}
              title="Pennello Arcobaleno 🌈"
            >
              <span className="text-sm">🌈</span>
            </button>

            <button
              onClick={() => {
                setIsSymmetric(!isSymmetric);
              }}
              className={`p-2 rounded-xl border active:scale-95 transition-all duration-150 flex items-center justify-center ${
                isSymmetric
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              style={{ minWidth: '38px', minHeight: '38px' }}
              title="Disegno Specchio / Simmetrico 🪞"
            >
              <span className="text-sm">🪞</span>
            </button>

            <button
              onClick={() => {
                setTool('eraser');
                setIsRainbow(false);
              }}
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

            {/* Pulsanti Annulla, Pulisci & Bomba */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUndo}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 active:scale-95 transition-all duration-150 flex items-center gap-1 text-xs font-bold"
                title="Annulla ultimo tratto (Ctrl+Z)"
              >
                <Undo size={14} />
                Annulla
              </button>

              <button
                onClick={handleClear}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 active:scale-95 transition-all duration-150 flex items-center gap-1 text-xs font-bold"
                title="Pulisci Classico"
              >
                <Trash2 size={14} />
                Pulisci
              </button>
              
              <button
                onClick={handleBomb}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 active:scale-95 transition-all duration-150 flex items-center gap-1.5 text-xs font-extrabold"
                title="Esplosione Bomba (Svuota con scuotimento e suono!)"
              >
                <span>💣</span>
                Bomba!
              </button>
            </div>
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
                    : 'text-slate-500 hover:text-slate-350'
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
                  setTool('pen');
                  setIsRainbow(false);
                }}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border transition-all duration-150 transform hover:scale-115 active:scale-90 ${
                  color === c && tool === 'pen' && !isRainbow
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
