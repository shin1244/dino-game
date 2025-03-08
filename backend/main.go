package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	// 개발 환경을 위해 모든 도메인 허용
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// 모든 웹소켓 연결을 저장하는 맵
var clients = make(map[*websocket.Conn]int)

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// 웹소켓 연결 수립
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade to WebSocket:", err)
		return
	}

	num := joinClient(conn)
	if num == -1 {
		log.Println("Failed to join client")
		return
	}

	fmt.Println("Client joined:", num)
	defer delete(clients, conn)
	defer conn.Close()

	// 메시지 수신 및 에코
	for {
		// 메시지 읽기
		_, _, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		fmt.Println("Received message:", clients[conn])

		broadcastMessage(clients[conn])
	}
}

func joinClient(conn *websocket.Conn) int {
	for i := 0; i <= 3; i++ {
		used := false
		for _, num := range clients {
			if num == i {
				used = true
				break
			}
		}
		if !used {
			clients[conn] = i
			return i
		}
	}
	return -1
}

func broadcastMessage(message int) {
	for conn := range clients {
		conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d", message)))
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)

	log.Println("Server starting at :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
