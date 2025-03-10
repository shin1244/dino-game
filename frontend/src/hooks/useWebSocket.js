import { useEffect, useRef, useState } from 'react';

export function useWebSocket(url) {
  const ws = useRef(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => {
      console.log('웹소켓 연결됨');
    };
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessage(data);  // 메시지 수신 시 상태 업데이트
    };
    
    ws.current.onclose = () => {
      console.log('웹소켓 연결 끊김');
    };
    
    ws.current.onerror = (error) => {
      console.error('웹소켓 에러:', error);
    };
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);
  
  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };
  
  return { sendMessage, message };  // 수신된 메시지를 반환
} 