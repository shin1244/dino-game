import React, { useEffect, useState, useRef } from "react";
import dinoImage from "./images/dino.png";
import pterImage from "./images/pter.png";

// Pterodactyl 컴포넌트 추가
function Obstacle({ type, onReachEnd, onPositionUpdate }) {
  const [posX, setPosX] = useState(960);
  const obstacleRef = useRef(null);

  // 항상 움직이는 단일 useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setPosX(prev => {
        if (prev <= -100) {
          onReachEnd();  // 끝에 도달하면 콜백 호출
          return -100;
        }
        return prev - 10;
      });

      // 위치 업데이트마다 충돌 체크를 위해 위치 정보 전달
      if (obstacleRef.current) {
        const rect = obstacleRef.current.getBoundingClientRect();
        onPositionUpdate({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        });
      }
    }, 16);

    return () => clearInterval(interval);
  }, [onReachEnd, onPositionUpdate]);

  return (
    <img 
      ref={obstacleRef}
      src={pterImage}
      alt="obstacle"
      style={{
        position: "absolute",
        top: "50px",
        left: `${posX}px`,
        width: "50px",
        height: "50px"
      }}
    />
  );
}

// Dino 컴포넌트 추가
function Dino({ position, dinoY, onPositionUpdate }) {
  const dinoRef = useRef(null);

  // 공룡의 위치가 변경될 때마다 부모에게 알림
  useEffect(() => {
    if (dinoRef.current) {
      const rect = dinoRef.current.getBoundingClientRect();
      onPositionUpdate({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      });
    }
  }, [dinoY, onPositionUpdate]);

  return (
    <img 
      ref={dinoRef}
      src={dinoImage} 
      alt="dino" 
      style={{ 
        position: "absolute", 
        top: dinoY - position + 130,
        left: 100,
        transition: "top 0.5s",
        width: "50px",
        height: "50px" 
      }} 
    />
  );
}



// DinoGame 컴포넌트 수정
function DinoGame({ position, color, isMyDino, dinoJump, obstacleSpawn }) {
  const [dinoY, setDinoY] = useState(position);
  const [obstacles, setObstacles] = useState([]);
  const [dinoPos, setDinoPos] = useState(null);
  const [isColliding, setIsColliding] = useState(false);

  // 공룡 점프 효과
  useEffect(() => {
    if (dinoJump) {
      setDinoY(position - 100);
      setTimeout(() => {
        setDinoY(position);
      }, 500);
    }
  }, [dinoJump, position]);

  // 새 장애물 추가
  const addObstacle = () => {
    const newObstacle = {
      id: Date.now(),  // 고유 ID
      type: 'pter'     // 장애물 타입
    };
    setObstacles(prev => [...prev, newObstacle]);
  };

  // pterSpawn이 true가 되면 새 장애물 추가
  useEffect(() => {
    if (obstacleSpawn) {
      addObstacle();
    }
  }, [obstacleSpawn]);

  // 충돌 감지 함수
  const checkCollision = (dinoRect, obstacleRect) => {
    if (!dinoRect || !obstacleRect) return false;
    
    return !(
      dinoRect.x + dinoRect.width < obstacleRect.x || 
      dinoRect.x > obstacleRect.x + obstacleRect.width ||
      dinoRect.y + dinoRect.height < obstacleRect.y ||
      dinoRect.y > obstacleRect.y + obstacleRect.height
    );
  };

  // 장애물 위치 업데이트 핸들러
  const handleObstaclePosition = (id, position) => {
    if (dinoPos && !isColliding) {
      const collision = checkCollision(dinoPos, position);
      if (collision) {
        setIsColliding(true);
        console.log("충돌 발생!");
        // 3초 후 충돌 상태 초기화
        setTimeout(() => setIsColliding(false), 3000);
      }
    }
  };

  return (
    <div style={{
      position: "relative",
      width: "960px",
      height: "180px",
      border: "4px solid " + color,
      margin: "20px",
      backgroundColor: "#f0f0f0",
      boxShadow: `0 0 10px ${color}`
    }}>
      {isMyDino && (
        <div style={{
          position: "absolute",
          top: -30,
          left: 10,
          color: color,
          fontWeight: "bold",
          fontSize: "20px"
        }}>
          MY DINO
        </div>
      )}
      <Dino 
        position={position} 
        dinoY={dinoY} 
        onPositionUpdate={setDinoPos}
      />
      {obstacles.map(obstacle => (
        <Obstacle 
          key={obstacle.id}
          type={obstacle.type}
          onReachEnd={() => {
            setObstacles(prev => prev.filter(obs => obs.id !== obstacle.id));
          }}
          onPositionUpdate={(pos) => handleObstaclePosition(obstacle.id, pos)}
        />
      ))}
    </div>
  );
}

// App 컴포넌트
function App() {
  const [ws, setWs] = useState(null);
  const [myDino, setMyDino] = useState(null);
  const [dinoJump, setDinoJump] = useState([false, false, false, false]);
  const [obstacleSpawn, setObstacleSpawn] = useState([false, false, false, false]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws");

    socket.onopen = () => console.log("Connected to server");

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "join") {
        setMyDino(message.caster);
      }

      if (message.type === "jump") {
        setDinoJump((prev) => prev.map((val, i) => (i === message.caster ? true : val)));
        setTimeout(() => {
          setDinoJump((prev) => prev.map((val, i) => (i === message.caster ? false : val)));
        }, 500);
      }

      if (message.type === "spawn") {
        setObstacleSpawn((prev) => prev.map((val, i) => (i === message.caster ? true : val)));
        setTimeout(() => {
          setObstacleSpawn((prev) => prev.map((val, i) => (i === message.caster ? false : val)));
        }, 2000);
      }
    };

    setWs(socket);

    return () => socket.close();
  }, []);

  const sendMessage = (type, caster, target) => {
    if (ws) {
      const message = {
        type: type,
        caster: caster,
        target: target
      };
      ws.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === " ") {
        sendMessage("jump", myDino, -1);
      }
      if (event.key === "ArrowRight") {
        sendMessage("spawn", myDino, myDino);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [myDino]);

  return (
    <div>
      <DinoGame 
        position={200} 
        color="#ff3333"
        isMyDino={myDino === 0}
        dinoJump={dinoJump[0]}
        obstacleSpawn={obstacleSpawn[0]}
      />
      <DinoGame 
        position={400} 
        color="#3333ff"
        isMyDino={myDino === 1}
        dinoJump={dinoJump[1]}
        obstacleSpawn={obstacleSpawn[1]}
      />
      <DinoGame 
        position={600} 
        color="#33ff33"
        isMyDino={myDino === 2}
        dinoJump={dinoJump[2]}
        obstacleSpawn={obstacleSpawn[2]}
      />
      <DinoGame 
        position={800} 
        color="#ffff33"
        isMyDino={myDino === 3}
        dinoJump={dinoJump[3]}
        obstacleSpawn={obstacleSpawn[3]}
      />
    </div>
  );
}

export default App;