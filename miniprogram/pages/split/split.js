Page({
  data: {
    originalImage: "",        // 用户上传的原图
    gridImages: [],          // 切割后的9张图片URL
    uploading: false,        // 上传状态
    progress: 0,           // 上传进度
    baseUrl: "http://localhost:8000",  // 后端接口地址 - 需要修改
    gameStarted: false,      // 游戏是否开始
    puzzlePieces: [],        // 拼图块数组
    steps: 0,              // 游戏步数
    timer: null,            // 计时器
    seconds: 0,             // 游戏秒数
    formatTime: '00:00',    // 格式化时间
    showNumbers: false,      // 是否显示数字
    showVictory: false       // 是否显示胜利弹窗
  },

  /**
   * 页面加载
   */
  onLoad: function (options) {
    console.log('图片切割页面加载');
  },

  /**
   * 选择图片
   */
  chooseImage: function() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        console.log('选择图片成功:', tempFilePath);
        
        that.setData({
          originalImage: tempFilePath,
          gridImages: [],
          gameStarted: false
        });
        
        // 自动上传切割
        that.uploadAndSplit(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 上传图片到后端并切割
   */
  uploadAndSplit: function(filePath) {
    const that = this;
    
    this.setData({
      uploading: true,
      progress: 0
    });

    wx.showLoading({
      title: '上传中...',
      mask: true
    });

    wx.uploadFile({
      url: `${this.data.baseUrl}/upload`,
      filePath: filePath,
      name: 'file',
      formData: {
        'timestamp': Date.now().toString()
      },
      success: (res) => {
        console.log('上传成功:', res);
        
        try {
          const data = JSON.parse(res.data);
          
          if (data.code === 200) {
            // 构建完整的图片URL
            const fullUrls = data.data.grid_urls.map(url => 
              `${that.data.baseUrl}${url}`
            );
            
            console.log('切割后的图片URL:', fullUrls);
            
            that.setData({
              gridImages: fullUrls
            });
            
            wx.hideLoading();
            wx.showToast({
              title: '切割成功！',
              icon: 'success'
            });
          } else {
            throw new Error(data.message || '切割失败');
          }
        } catch (parseErr) {
          console.error('解析响应失败:', parseErr);
          wx.hideLoading();
          wx.showToast({
            title: '数据解析失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('上传失败:', err);
        wx.hideLoading();
        
        // 更详细的错误提示
        let errorMsg = '上传失败';
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMsg = '上传超时，请重试';
          } else if (err.errMsg.includes('network')) {
            errorMsg = '网络连接失败';
          } else if (err.errMsg.includes('permission')) {
            errorMsg = '没有上传权限';
          }
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none'
        });
        
        that.setData({
          uploading: false,
          progress: 0
        });
      }
    });
  },

  /**
   * 开始拼图游戏
   */
  startGame: function() {
    if (this.data.gridImages.length !== 9) {
      wx.showToast({
        title: '请先上传图片',
        icon: 'none'
      });
      return;
    }

    // 初始化拼图块
    const puzzlePieces = this.createPuzzlePieces();
    
    // 打乱拼图
    this.shufflePuzzle(puzzlePieces);
    
    this.setData({
      puzzlePieces: puzzlePieces,
      gameStarted: true,
      steps: 0,
      seconds: 0,
      formatTime: '00:00'
    });

    // 开始计时
    this.startTimer();
    
    wx.showToast({
      title: '游戏开始！',
      icon: 'success'
    });
  },

  /**
   * 创建拼图块数组
   */
  createPuzzlePieces: function() {
    const puzzlePieces = [];
    
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      
      puzzlePieces.push({
        id: i,
        currentPosition: i,      // 当前位置
        originalPosition: i,     // 原始正确位置
        row: row,
        col: col,
        imageUrl: this.data.gridImages[i],
        isEmpty: i === 8        // 第9块为空
      });
    }
    
    return puzzlePieces;
  },

  /**
   * 打乱拼图
   */
  shufflePuzzle: function(puzzlePieces) {
    const moveCount = 50;
    let emptyIndex = 8; // 空位在第9个位置
    
    for (let i = 0; i < moveCount; i++) {
      const validMoves = this.getValidMoves(emptyIndex);
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        
        // 交换空格和随机相邻块
        const temp = puzzlePieces[emptyIndex];
        puzzlePieces[emptyIndex] = puzzlePieces[randomMove];
        puzzlePieces[randomMove] = temp;
        
        // 更新当前位置
        puzzlePieces[emptyIndex].currentPosition = emptyIndex;
        puzzlePieces[randomMove].currentPosition = randomMove;
        
        emptyIndex = randomMove;
      }
    }
  },

  /**
   * 获取有效的移动位置
   */
  getValidMoves: function(emptyIndex) {
    const validMoves = [];
    const row = Math.floor(emptyIndex / 3);
    const col = emptyIndex % 3;
    
    // 上
    if (row > 0) validMoves.push(emptyIndex - 3);
    // 下
    if (row < 2) validMoves.push(emptyIndex + 3);
    // 左
    if (col > 0) validMoves.push(emptyIndex - 1);
    // 右
    if (col < 2) validMoves.push(emptyIndex + 1);
    
    return validMoves;
  },

  /**
   * 移动拼图块
   */
  movePiece: function(e) {
    const clickedIndex = e.currentTarget.dataset.index;
    const puzzlePieces = this.data.puzzlePieces;
    
    // 找到空格位置
    let emptyIndex = -1;
    for (let i = 0; i < puzzlePieces.length; i++) {
      if (puzzlePieces[i].isEmpty) {
        emptyIndex = i;
        break;
      }
    }
    
    // 检查是否可以移动
    if (this.canMove(clickedIndex, emptyIndex)) {
      // 交换拼图块
      const temp = puzzlePieces[clickedIndex];
      puzzlePieces[clickedIndex] = puzzlePieces[emptyIndex];
      puzzlePieces[emptyIndex] = temp;
      
      // 更新当前位置
      puzzlePieces[clickedIndex].currentPosition = clickedIndex;
      puzzlePieces[emptyIndex].currentPosition = emptyIndex;
      
      // 增加步数
      const newSteps = this.data.steps + 1;
      
      this.setData({
        puzzlePieces: puzzlePieces,
        steps: newSteps
      });
      
      // 震动反馈
      wx.vibrateShort({
        type: 'light'
      });
      
      // 检查是否完成
      setTimeout(() => {
        this.checkWin();
      }, 300);
    }
  },

  /**
   * 检查是否可以移动
   */
  canMove: function(pieceIndex, emptyIndex) {
    const pieceRow = Math.floor(pieceIndex / 3);
    const pieceCol = pieceIndex % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;
    
    // 检查是否相邻
    const rowDiff = Math.abs(pieceRow - emptyRow);
    const colDiff = Math.abs(pieceCol - emptyCol);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  },

  /**
   * 检查游戏是否完成
   */
  checkWin: function() {
    const puzzlePieces = this.data.puzzlePieces;
    let isWin = true;
    
    for (let i = 0; i < puzzlePieces.length; i++) {
      const piece = puzzlePieces[i];
      if (piece.currentPosition !== piece.originalPosition) {
        isWin = false;
        break;
      }
    }
    
    if (isWin) {
      this.handleWin();
    }
  },

  /**
   * 处理游戏胜利
   */
  handleWin: function() {
    this.stopTimer();
    
    this.setData({ showVictory: true });
    
    wx.vibrateShort({
      type: 'medium'
    });
    
    wx.showToast({
      title: '恭喜完成！',
      icon: 'success'
    });
  },

  /**
   * 开始计时
   */
  startTimer: function() {
    this.data.timer = setInterval(() => {
      const seconds = this.data.seconds + 1;
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      
      this.setData({
        seconds: seconds,
        formatTime: `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      });
    }, 1000);
  },

  /**
   * 停止计时
   */
  stopTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  /**
   * 切换数字显示
   */
  toggleNumbers: function() {
    this.setData({
      showNumbers: !this.data.showNumbers
    });
  },

  /**
   * 重新开始游戏
   */
  restartGame: function() {
    this.setData({ showVictory: false });
    this.stopTimer();
    this.startGame();
  },

  /**
   * 重置页面
   */
  reset: function() {
    this.stopTimer();
    this.setData({
      originalImage: "",
      gridImages: [],
      uploading: false,
      progress: 0,
      gameStarted: false,
      puzzlePieces: [],
      steps: 0,
      seconds: 0,
      formatTime: '00:00',
      showNumbers: false,
      showVictory: false
    });
  },

  /**
   * 页面卸载时清理
   */
  onUnload: function() {
    this.stopTimer();
  }
});