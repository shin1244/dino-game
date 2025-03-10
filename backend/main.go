package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"

	"github.com/gorilla/websocket"
)

type Player struct {
	isHunter bool    `json:"is_hunter"`
	x        float64 `json:"x"`
	y        float64 `json:"y"`
}

type Message struct {
	Type string  `json:"type"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
	Data bool    `json:"data"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var clients = make(map[*websocket.Conn]int)

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
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
	if num == 1 {
		gameStart()
	}
	fmt.Println("Client joined:", num)
	defer delete(clients, conn)
	defer conn.Close()

	for {
		var message Message
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		broadcastMessage(message)
	}
}

func joinClient(conn *websocket.Conn) int {
	for i := 0; i <= 2; i++ {
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

func broadcastMessage(message Message) {
	for conn := range clients {
		conn.WriteJSON(message)
	}
}

func gameStart() {
	isHunter := rand.Intn(2)

	for conn, num := range clients {
		if num == isHunter {
			conn.WriteJSON(Message{
				Type: "gameStart",
				Data: true,
			})
		} else {
			conn.WriteJSON(Message{
				Type: "gameStart",
				Data: false,
			})
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)

	log.Println("Server starting at :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
