// pages/index/index.js
Page({
  data: {
    puzzlePieces: [],          // 拼图块数组
    stepCount: 0,              // 移动步数
    startTime: null,           // 开始时间
    gameTime: 0,               // 游戏时间（秒）
    formattedTime: '00:00',    // 格式化后的时间显示
    isCompleted: false,        // 是否完成
    showNumbers: false,        // 是否显示数字
    timer: null,               // 计时器
    emptyIndex: 8,             // 空格位置
    imageTestSuccess: true,    // 图片测试是否成功
  },

  onLoad() {
    console.log('页面加载开始');
    
    // 测试图片是否能正常加载
    wx.getImageInfo({
      src: '/images/puzzle/1.jpg',
      success: (res) => {
        console.log('图片信息:', res);
        // 设置数据标记，确保图片正确显示
        this.setData({
          imageTestSuccess: true
        });
      },
      fail: (err) => {
        console.error('图片加载失败:', err);
        this.setData({
          imageTestSuccess: false
        });
      }
    });
    
    this.initGame();
    this.startTimer();
  },

  // 预加载分包
  loadSubpackage() {
    wx.loadSubPackage({
      root: 'subpackage',
      success: (res) => {
        console.log('分包加载成功');
      },
      fail: (res) => {
        console.error('分包加载失败', res);
      }
    });
  },

  // 检查图片是否能加载
  checkImageLoad(imageUrl) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: imageUrl,
        success: (res) => {
          console.log('图片加载成功:', imageUrl, res);
          resolve(true);
        },
        fail: (err) => {
          console.error('图片加载失败:', imageUrl, err);
          resolve(false);
        }
      });
    });
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
    
    // 创建拼图块，使用单一完整图片
    for (let i = 0; i < 8; i++) {
      // 计算在3x3网格中的位置
      const row = Math.floor(i / 3);
      const col = i % 3;
      
      const imagePath = '/images/puzzle/' + (i+1) + '.jpg';
      console.log('创建拼图块，图片路径:', imagePath);
      
      pieces.push({
        number: i + 1,
        image: imagePath,
        isEmpty: false,
        bgPosX: col * 33.33, // 图片位置百分比 (100% / 3)
        bgPosY: row * 33.33  // 图片位置百分比 (100% / 3)
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

    // 验证第一个拼图块的样式设置
    const firstPiece = pieces[0];
    console.log('初始化拼图，图片路径:', firstPiece.image);
    console.log('背景位置:', firstPiece.bgPosX + '%', firstPiece.bgPosY + '%');
    
    this.setData({
      puzzlePieces: pieces,
      stepCount: 0,
      gameTime: 0,
      formattedTime: '00:00',
      isCompleted: false,
      emptyIndex: 8,
      startTime: Date.now()
    });
    
    // 打乱拼图
    this.shufflePuzzle();
  },

  // 开始计时器
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

  // 停止计时器
  stopTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  // 移动拼图块
  movePiece(e) {
    if (this.data.isCompleted) return;
    
    const clickedIndex = e.currentTarget.dataset.index;
    const emptyIndex = this.data.emptyIndex;
    
    // 检查点击的块是否可移动（是否与空格相邻）
    if (this.isAdjacent(clickedIndex, emptyIndex)) {
      // 先添加移动动画类
      const pieces = this.data.puzzlePieces;
      const movingPiece = pieces[clickedIndex];
      
      // 创建新的数组来避免闪烁
      const newPieces = [...pieces];
      [newPieces[clickedIndex], newPieces[emptyIndex]] = [newPieces[emptyIndex], newPieces[clickedIndex]];
      
      // 使用setData更新，确保平滑过渡
      this.setData({
        puzzlePieces: newPieces,
        emptyIndex: clickedIndex,
        stepCount: this.data.stepCount + 1
      });
      
      // 延迟检查完成，避免动画冲突
      setTimeout(() => {
        this.checkCompletion();
      }, 150);
    }
  },

  // 检查两个位置是否相邻
  isAdjacent(index1, index2) {
    const row1 = Math.floor(index1 / 3);
    const col1 = index1 % 3;
    const row2 = Math.floor(index2 / 3);
    const col2 = index2 % 3;
    
    // 检查是否在同一行且相邻列，或者同一列且相邻行
    return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
           (Math.abs(col1 - col2) === 1 && row1 === row2);
  },

  // 检查拼图是否完成
  checkCompletion() {
    const pieces = this.data.puzzlePieces;
    
    // 检查除最后一个外的所有块是否按顺序排列
    for (let i = 0; i < 8; i++) {
      if (pieces[i].number !== i + 1) {
        return false;
      }
    }
    
    // 检查最后一个是否为空
    if (!pieces[8].isEmpty) return false;
    
    // 完成游戏
    this.setData({ isCompleted: true });
    this.stopTimer();
    
    // 显示完成动画
    wx.showToast({
      title: '拼图完成！',
      icon: 'success',
      duration: 2000
    });
    
    return true;
  },

  // 重新开始游戏
  restartGame() {
    this.stopTimer();
    this.initGame();
    this.startTimer();
  },

  // 随机打乱拼图
  shufflePuzzle() {
    if (this.data.isCompleted) return;
    
    let pieces = [...this.data.puzzlePieces];
    let emptyIndex = this.data.emptyIndex;
    
    // 随机移动多次以打乱拼图
    for (let i = 0; i < 100; i++) {
      const adjacentPositions = [];
      const row = Math.floor(emptyIndex / 3);
      const col = emptyIndex % 3;
      
      // 找出所有相邻位置
      if (row > 0) adjacentPositions.push(emptyIndex - 3);
      if (row < 2) adjacentPositions.push(emptyIndex + 3);
      if (col > 0) adjacentPositions.push(emptyIndex - 1);
      if (col < 2) adjacentPositions.push(emptyIndex + 1);
      
      // 随机选择一个相邻位置交换
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

  // 切换数字显示
  toggleNumbers() {
    this.setData({
      showNumbers: !this.data.showNumbers
    });
  },

  // 关闭成功模态框
  closeModal() {
    this.setData({ isCompleted: false });
  },



  // 格式化时间显示
  formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
});



