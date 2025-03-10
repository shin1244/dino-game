export class SheepSprite {
  constructor() {
    this.direction = 'down';
    this.spriteIndex = 0;
    this.image = new Image();
    this.image.src = '/images/sheep-sprite.png';  // 스프라이트 시트
    
    // 스프라이트 한 칸의 크기
    this.frameWidth = 128;  // 512/4
    this.frameHeight = 128; // 512/4
    
    // 방향별 시작 y좌표 (스프라이트 시트에서의 행)
    this.directions = {
      down: 0,
      left: 1,
      right: 2,
      up: 3
    };
  }

  setDirection(dir) {
    this.direction = dir;
    this.spriteIndex = (this.spriteIndex + 1) % 4;
  }

  draw(ctx, x, y) {
    // 스프라이트 시트에서 현재 프레임의 위치 계산
    const srcX = this.spriteIndex * this.frameWidth;
    const srcY = this.directions[this.direction] * this.frameHeight;

    ctx.drawImage(
      this.image,
      srcX,              // 소스 x 위치
      srcY,              // 소스 y 위치
      this.frameWidth,   // 소스 너비
      this.frameHeight,  // 소스 높이
      x - 25,           // 캔버스 x 위치
      y - 25,           // 캔버스 y 위치
      50,               // 그릴 너비
      50                // 그릴 높이
    );
  }
} 