package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Message struct {
	Type   string `json:"type"`
	Caster int    `json:"caster"`
	Target int    `json:"target"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var (
	clients = make(map[*websocket.Conn]int)
	jumping sync.Map // sync.Map 사용
	spawn   sync.Map // sync.Map 사용
)

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

	fmt.Println("Client joined:", num)
	defer delete(clients, conn)
	defer conn.Close()

	conn.WriteJSON(Message{
		Type:   "join",
		Caster: num,
	})

	for {
		var message Message
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		if message.Type == "jump" {
			// Load로 현재 점프 상태 확인
			if isJumping, exists := jumping.Load(message.Caster); !exists || !isJumping.(bool) {
				// Store로 점프 상태 저장
				jumping.Store(message.Caster, true)
				broadcastMessage(message)

				go func(playerNum int) {
					time.Sleep(time.Millisecond * 800)
					jumping.Store(playerNum, false)
				}(message.Caster)
				continue
			}
		}
		if message.Type == "spawn" {
			// Load로 현재 생성 상태 확인
			if isSpawned, exists := spawn.Load(message.Caster); !exists || !isSpawned.(bool) {
				// Store로 생성 상태 저장
				spawn.Store(message.Caster, true)
				broadcastMessage(message)

				go func(playerNum int) {
					time.Sleep(time.Millisecond * 100)
					spawn.Store(playerNum, false)
				}(message.Caster)
				continue
			}
		}
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

func broadcastMessage(message Message) {
	for conn := range clients {
		conn.WriteJSON(message)
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)

	log.Println("Server starting at :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
