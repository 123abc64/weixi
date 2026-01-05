// 修复版index.js
Page({
  data: {
    puzzlePieces: [],
    stepCount: 0,
    startTime: null,
    gameTime: 0,
    formattedTime: '00:00',
    isCompleted: false,
    showNumbers: false,
    timer: null,
    emptyIndex: 8,
    useBase64Images: false // 是否使用base64图片
  },

  onLoad() {
    console.log('=== 修复版页面加载 ===');
    
    // 检测真机还是模拟器
    const systemInfo = wx.getSystemInfoSync();
    const isSimulator = systemInfo.platform === 'devtools';
    
    if (isSimulator) {
      console.log('模拟器环境，使用正常图片');
      this.useBase64Images = false;
    } else {
      console.log('真机环境，使用备用方案');
      this.useBase64Images = true;
    }
    
    this.initGame();
    this.startTimer();
  },

  onUnload() {
    this.stopTimer();
  },

  onHide() {
    this.stopTimer();
  },

  onShow() {
    this.startTimer();
  },

  // 初始化游戏
  initGame() {
    const pieces = [];
    const useBase64 = this.data.useBase64Images;
    
    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      
      pieces.push({
        number: i + 1,
        image: useBase64 ? this.getBase64Image(i + 1) : '/images/puzzle/' + (i+1) + '.jpg',
        isEmpty: false,
        bgPosX: col * 33.33,
        bgPosY: row * 33.33
      });
    }
    
    // 添加空块
    pieces.push({
      number: 9,
      image: '',
      isEmpty: true,
      bgPosX: 0,
      bgPosY: 0
    });

    console.log('初始化拼图，使用base64:', useBase64);

    this.setData({
      puzzlePieces: pieces,
      stepCount: 0,
      gameTime: 0,
      formattedTime: '00:00',
      isCompleted: false,
      emptyIndex: 8,
      startTime: Date.now(),
      useBase64Images: useBase64
    });
    
    // 打乱拼图
    this.shufflePuzzle();
  },

  // 获取base64图片（备用方案）
  getBase64Image(num) {
    // 创建彩色base64占位图
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const color = colors[num - 1] || '#333333';
    
    // 简单的SVG转base64
    const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="300" fill="${color}" />
      <text x="150" y="150" font-family="Arial" font-size="80" fill="white" text-anchor="middle" dy=".3em">${num}</text>
    </svg>`;
    
    return 'data:image/svg+xml;base64,' + btoa(svg);
  },

  // 其他方法保持不变...
  startTimer() {
    if (this.data.timer) return;
    
    this.data.timer = setInterval(() => {
      const currentTime = Math.floor((Date.now() - this.data.startTime) / 1000);
      this.setData({
        gameTime: currentTime,
        formattedTime: this.formatTime(currentTime)
      });
    }, 1000);
  },

  stopTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  // 移动拼图块
  movePiece(e) {
    if (this.data.isCompleted) return;
    
    const clickedIndex = e.currentTarget.dataset.index;
    const emptyIndex = this.data.emptyIndex;
    
    if (this.isAdjacent(clickedIndex, emptyIndex)) {
      const newPieces = [...this.data.puzzlePieces];
      [newPieces[clickedIndex], newPieces[emptyIndex]] = [newPieces[emptyIndex], newPieces[clickedIndex]];
      
      this.setData({
        puzzlePieces: newPieces,
        emptyIndex: clickedIndex,
        stepCount: this.data.stepCount + 1
      });
      
      setTimeout(() => {
        this.checkCompletion();
      }, 150);
    }
  },

  isAdjacent(index1, index2) {
    const row1 = Math.floor(index1 / 3);
    const col1 = index1 % 3;
    const row2 = Math.floor(index2 / 3);
    const col2 = index2 % 3;
    
    return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
           (Math.abs(col1 - col2) === 1 && row1 === row2);
  },

  checkCompletion() {
    const pieces = this.data.puzzlePieces;
    
    for (let i = 0; i < 8; i++) {
      if (pieces[i].number !== i + 1) {
        return false;
      }
    }
    
    if (!pieces[8].isEmpty) return false;
    
    this.setData({ isCompleted: true });
    this.stopTimer();
    
    wx.showToast({
      title: '拼图完成！',
      icon: 'success',
      duration: 2000
    });
    
    return true;
  },

  restartGame() {
    this.stopTimer();
    this.initGame();
    this.startTimer();
  },

  shufflePuzzle() {
    if (this.data.isCompleted) return;
    
    let pieces = [...this.data.puzzlePieces];
    let emptyIndex = this.data.emptyIndex;
    
    for (let i = 0; i < 100; i++) {
      const adjacentPositions = [];
      const row = Math.floor(emptyIndex / 3);
      const col = emptyIndex % 3;
      
      if (row > 0) adjacentPositions.push(emptyIndex - 3);
      if (row < 2) adjacentPositions.push(emptyIndex + 3);
      if (col > 0) adjacentPositions.push(emptyIndex - 1);
      if (col < 2) adjacentPositions.push(emptyIndex + 1);
      
      const randomIndex = adjacentPositions[Math.floor(Math.random() * adjacentPositions.length)];
      [pieces[emptyIndex], pieces[randomIndex]] = [pieces[randomIndex], pieces[emptyIndex]];
      emptyIndex = randomIndex;
    }
    
    this.setData({
      puzzlePieces: pieces,
      emptyIndex: emptyIndex,
      stepCount: 0,
      gameTime: 0,
      formattedTime: '00:00',
      isCompleted: false,
      startTime: Date.now()
    });
  },

  toggleNumbers() {
    this.setData({
      showNumbers: !this.data.showNumbers
    });
  },

  closeModal() {
    this.setData({ isCompleted: false });
  }
});