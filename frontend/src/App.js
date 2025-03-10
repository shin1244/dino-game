import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

function Game() {
  const canvasRef = useRef(null);
  const { sendMessage, message } = useWebSocket('ws://localhost:8080/ws');
  const [isHunter, setIsHunter] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (message) {
      switch (message.type) {
        case 'gameStart':
          setIsHunter(message.data);
          break;
        case 'mouseMove':
          setMousePos({ x: message.x, y: message.y });
          break;
      }
    }
  }, [message]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 960;
    canvas.height = 960;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      sendMessage({ type: 'mouseMove', x, y });
    };

    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") {
        sendMessage({ type: 'move', direction: 'up' });
      } else if (e.key === "ArrowDown") {
        sendMessage({ type: 'move', direction: 'down' });
      } else if (e.key === "ArrowLeft") {
        sendMessage({ type: 'move', direction: 'left' });
      } else if (e.key === "ArrowRight") {
        sendMessage({ type: 'move', direction: 'right' });
      }
    } 

    // 헌터일 경우 마우스 움직임 처리
    if (isHunter) {
      canvas.addEventListener('mousemove', handleMouseMove);
    } else {
      canvas.addEventListener('keydown', handleKeyDown);
    }

    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'red';
      ctx.fill();

      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('keydown', handleKeyDown);
    };
  }, [mousePos, sendMessage]);

  return (
    <canvas 
      ref={canvasRef}
      style={{
        border: '1px solid black',
        cursor: 'none'
      }}
    />
  );
}

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh'
    }}>
      <Game />
    </div>
  );
}

export default App;