import React, { useEffect, useState } from "react";

// DinoGame 컴포넌트
function DinoGame({ position, shouldJump }) {
  const [dinoY, setDinoY] = useState(position);

  useEffect(() => {
    if (shouldJump) {
      setDinoY(position - 100);
      setTimeout(() => {
        setDinoY(position);
      }, 500);
    }
  }, [shouldJump, position]);

  return (
    <div style={{
      position: "relative",
      width: "960px",
      height: "200px",
      border: "2px solid black",
      margin: "20px",
      backgroundColor: "#f0f0f0"
    }}>
      <img 
        src={require("./images/dino.png")} 
        alt="dino" 
        style={{ 
          position: "absolute", 
          top: dinoY - position + 100, // 상대적인 위치로 변경
          left: 100,
          transition: "top 0.5s",
          width: "50px",
          height: "50px" 
        }} 
      />
    </div>
  );
}

// App 컴포넌트
function App() {
  const [ws, setWs] = useState(null);
  const [jumpingPlayer, setJumpingPlayer] = useState(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws");

    socket.onopen = () => {
      console.log("Connected to server");
    };

    socket.onmessage = (event) => {
      const receivedNumber = parseInt(event.data);
      console.log("Received number:", receivedNumber);
      setJumpingPlayer(receivedNumber);
      // 점프 후 상태 리셋
      setTimeout(() => {
        setJumpingPlayer(null);
      }, 500);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  // 스페이스바 이벤트 관리
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === "Space") {
        sendMessage();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [ws]);

  const sendMessage = () => {
    if (ws) {
      const message = "Spacebar Pressed!";
      ws.send(message);
    }
  };

  return (
    <div>
      <DinoGame position={200} shouldJump={jumpingPlayer === 0} />
      <DinoGame position={400} shouldJump={jumpingPlayer === 1} />
      <DinoGame position={600} shouldJump={jumpingPlayer === 2} />
      <DinoGame position={800} shouldJump={jumpingPlayer === 3} />
    </div>
  );
}

export default App;