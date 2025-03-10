import sheepSprite from '../images/sheep-sprite.png';  // 상단에 추가

export class SheepManager {
  constructor() {
    this.sheep = new Map();
    this.spriteSheet = new Image();
    this.isImageLoaded = false;


    this.spriteSheet.onload = () => {
      this.isImageLoaded = true;
    };

    this.spriteSheet.src = sheepSprite;  // import한 이미지 사용
    
    this.frameWidth = 128;
    this.frameHeight = 128;
    
    this.directions = {
      down: 0,
      left: 1,
      right: 2,
      up: 3
    };
  }

  // 새로운 양 추가
  addSheep(id, x, y) {
    this.sheep.set(id, {
      x,
      y,
      direction: 'down',
      spriteIndex: 0
    });
  }

  // 특정 양의 위치 업데이트
  updateSheep(id, x, y, direction) {
    const sheep = this.sheep.get(id);
    if (sheep) {
      sheep.x = x;
      sheep.y = y;
      if (direction) {
        sheep.direction = direction;
        sheep.spriteIndex = (sheep.spriteIndex + 1) % 4;
      }
    }
  }

  // 양 제거
  removeSheep(id) {
    this.sheep.delete(id);
  }

  // 모든 양 그리기
  drawAll(ctx) {
    if (!this.isImageLoaded) {
      return;
    }

    this.sheep.forEach((sheep, id) => {
      const srcX = sheep.spriteIndex * this.frameWidth;
      const srcY = this.directions[sheep.direction] * this.frameHeight;

      ctx.drawImage(
        this.spriteSheet,
        srcX,
        srcY,
        this.frameWidth,
        this.frameHeight,
        sheep.x - 25,
        sheep.y - 25,
        50,
        50
      );
    });
  }
} 