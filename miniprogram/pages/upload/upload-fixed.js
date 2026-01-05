Page({
  data: {
    uploadedImage: '',
    processing: false,
    gameStarted: false,
    puzzlePieces: [],
    steps: 0,
    timer: null,
    seconds: 0,
    formatTime: '00:00',
    showNumbers: false,
    showPreviewModal: false,
    showVictory: false,
    processingText: '正在处理图片...',
    showProgress: false,
    progressPercent: 0,
  },

  onLoad: function (options) {
    // 获取设备信息
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          systemInfo: res,
          pixelRatio: res.pixelRatio || 2
        });
      }
    });
  },

  chooseImage: function() {
    const that = this;
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: function(res) {
        if (res.tapIndex === 0) {
          that.selectFromAlbum();
        } else if (res.tapIndex === 1) {
          that.takePhoto();
        }
      }
    });
  },

  selectFromAlbum: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.handleImageSelection(res.tempFilePaths[0]);
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

  takePhoto: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        this.handleImageSelection(res.tempFilePaths[0]);
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },

  handleImageSelection: function(imagePath) {
    this.setData({
      uploadedImage: imagePath,
      originalImage: imagePath
    });
  },

  /**
   * 微信小程序专用的图片切割方法
   */
  startGame: function() {
    this.setData({ 
      processing: true,
      processingText: '正在分析图片...',
      showProgress: true,
      progressPercent: 0
    });

    this.wechatCanvasSplit()
      .then((splitImages) => {
        this.initPuzzleGame(splitImages);
        this.setData({ 
          processing: false,
          gameStarted: true,
          showProgress: false,
          progressPercent: 0
        });
        
        this.startTimer();
        wx.showToast({
          title: '游戏开始！',
          icon: 'success'
        });
      })
      .catch((err) => {
        console.error('图片处理失败:', err);
        wx.showModal({
          title: '处理失败',
          content: '图片切割失败，请重试或更换图片',
          confirmText: '重试',
          cancelText: '更换图片',
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.startGame();
            }
          }
        });
        this.setData({ 
          processing: false,
          showProgress: false,
          progressPercent: 0
        });
      });
  },

  /**
   * 微信小程序Canvas图片切割 - 解决错位问题
   */
  wechatCanvasSplit: function() {
    return new Promise((resolve, reject) => {
      const imagePath = this.data.uploadedImage;
      
      if (!imagePath) {
        reject(new Error('图片路径为空'));
        return;
      }

      this.setData({
        processingText: '获取图片信息...',
        progressPercent: 10
      });

      // 步骤1: 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('图片信息:', imageInfo);
          this.performPreciseSplit(imagePath, imageInfo)
            .then(resolve)
            .catch(reject);
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 精确分割方法 - 解决错位问题
   */
  performPreciseSplit: function(imagePath, imageInfo) {
    return new Promise((resolve, reject) => {
      const { width: imgW, height: imgH } = imageInfo;
      const { pixelRatio = 2 } = this.data.systemInfo || {};

      console.log(`原图尺寸: ${imgW}x${imgH}, 像素比: ${pixelRatio}`);

      this.setData({
        processingText: '准备Canvas...',
        progressPercent: 20
      });

      // 步骤2: 计算正确的Canvas尺寸
      const canvasW = Math.floor(imgW / 3);
      const canvasH = Math.floor(imgH / 3);
      
      console.log(`单块尺寸: ${canvasW}x${canvasH}`);

      // 获取Canvas上下文
      const ctx = wx.createCanvasContext('splitCanvas');
      
      const splitImages = [];
      const total = 8; // 8个拼图块
      let completed = 0;

      this.setData({
        processingText: '切割图片...',
        progressPercent: 30
      });

      // 步骤3: 逐块切割 - 关键：确保图片完全加载
      const cutPromises = [];

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const index = row * 3 + col;
          if (index === 8) continue; // 跳过第9块

          const cutPromise = this.cutSinglePiece(
            ctx, imagePath,
            imgW, imgH,
            canvasW, canvasH,
            row, col,
            index,
            pixelRatio
          ).then((pieceData) => {
            splitImages[index] = pieceData;
            completed++;

            const progress = 30 + Math.floor((completed / total) * 60);
            this.setData({
              progressPercent: progress,
              processingText: `已切割 ${completed}/${total} 块`
            });

            return pieceData;
          }).catch((err) => {
            console.error(`切割第${index + 1}块失败:`, err);
            completed++;

            // 使用默认图片作为备用
            const fallbackPiece = {
              index: index,
              correctNumber: index + 1,
              imageUrl: '/images/puzzle/1.jpg',
              bgPosX: 0,
              bgPosY: 0
            };
            splitImages[index] = fallbackPiece;

            const progress = 30 + Math.floor((completed / total) * 60);
            this.setData({
              progressPercent: progress,
              processingText: `已切割 ${completed}/${total} 块`
            });

            return fallbackPiece;
          });

          cutPromises.push(cutPromise);
        }
      }

      Promise.all(cutPromises)
        .then(() => {
          console.log('所有图片块切割完成');
          this.setData({
            processingText: '整理数据...',
            progressPercent: 95
          });

          setTimeout(() => {
            const result = splitImages.filter(Boolean);
            resolve(result);
          }, 200);
        })
        .catch(reject);
    });
  },

  /**
   * 切割单个拼图块 - 微信小程序专用版本
   */
  cutSinglePiece: function(ctx, imagePath, imgW, imgH, canvasW, canvasH, row, col, index, pixelRatio) {
    return new Promise((resolve, reject) => {
      try {
        // 计算源图片切割坐标
        const sx = col * canvasW;
        const sy = row * canvasH;

        console.log(`切割第${index + 1}块(第${row + 1}行第${col + 1}列):`, {
          原图尺寸: `${imgW}x${imgH}`,
          单块尺寸: `${canvasW}x${canvasH}`,
          切割起始: `(${sx}, ${sy})`,
          切割区域: `${canvasW}x${canvasH}`
        });

        // 关键：先清空Canvas
        ctx.clearRect(0, 0, canvasW, canvasH);

        // 关键：确保图片完全加载后再绘制
        // 微信小程序的drawImage是异步的，需要延迟
        setTimeout(() => {
          // 正确的drawImage调用
          ctx.drawImage(
            imagePath,    // 图片路径
            sx, sy,       // 源图片切割起始坐标
            canvasW, canvasH, // 源图片切割尺寸
            0, 0,         // Canvas绘制起始坐标
            canvasW, canvasH  // Canvas绘制尺寸
          );

          // 关键：draw到Canvas并等待完成
          ctx.draw(false, () => {
            // 关键：再延迟确保绘制完成
            setTimeout(() => {
              wx.canvasToTempFilePath({
                canvasId: 'splitCanvas',
                x: 0,
                y: 0,
                width: canvasW,
                height: canvasH,
                destWidth: canvasW * pixelRatio, // 高清输出
                destHeight: canvasH * pixelRatio,
                quality: 0.9,
                success: (res) => {
                  if (res.tempFilePath) {
                    console.log(`第${index + 1}块切割成功:`, res.tempFilePath);
                    resolve({
                      index: index,
                      correctNumber: index + 1,
                      imageUrl: res.tempFilePath,
                      bgPosX: 0,
                      bgPosY: 0
                    });
                  } else {
                    reject(new Error(`第${index + 1}块: 临时文件路径为空`));
                  }
                },
                fail: (err) => {
                  console.error(`第${index + 1}块导出失败:`, err);
                  reject(err);
                }
              });
            }, 200); // 确保绘制完成的延迟
          });
        }, 50); // 确保图片加载的延迟

      } catch (error) {
        console.error(`第${index + 1}块切割异常:`, error);
        reject(error);
      }
    });
  },

  /**
   * 初始化拼图游戏
   */
  initPuzzleGame: function(splitImages) {
    const puzzlePieces = [];
    
    // 添加8个图片块
    splitImages.forEach((piece, index) => {
      puzzlePieces.push({
        id: index,
        correctNumber: piece.correctNumber,
        currentNumber: piece.correctNumber,
        imageUrl: piece.imageUrl,
        bgPosX: piece.bgPosX,
        bgPosY: piece.bgPosY,
        isEmpty: false
      });
    });
    
    // 添加空格
    puzzlePieces.push({
      id: 8,
      correctNumber: 9,
      currentNumber: 9,
      imageUrl: '',
      bgPosX: 0,
      bgPosY: 0,
      isEmpty: true
    });
    
    // 智能打乱
    this.shufflePuzzle(puzzlePieces);
    
    this.setData({
      puzzlePieces: puzzlePieces,
      steps: 0
    });
  },

  /**
   * 智能拼图打乱
   */
  shufflePuzzle: function(puzzlePieces) {
    const moveCount = 50;
    let emptyIndex = puzzlePieces.findIndex(piece => piece.isEmpty);
    
    for (let i = 0; i < moveCount; i++) {
      const validMoves = this.getValidMoves(emptyIndex);
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const temp = puzzlePieces[emptyIndex];
        puzzlePieces[emptyIndex] = puzzlePieces[randomMove];
        puzzlePieces[randomMove] = temp;
        emptyIndex = randomMove;
      }
    }
  },

  getValidMoves: function(emptyIndex) {
    const validMoves = [];
    const row = Math.floor(emptyIndex / 3);
    const col = emptyIndex % 3;
    
    if (row > 0) validMoves.push(emptyIndex - 3);
    if (row < 2) validMoves.push(emptyIndex + 3);
    if (col > 0) validMoves.push(emptyIndex - 1);
    if (col < 2) validMoves.push(emptyIndex + 1);
    
    return validMoves;
  },

  movePiece: function(e) {
    const clickedIndex = e.currentTarget.dataset.index;
    const puzzlePieces = this.data.puzzlePieces;
    const emptyIndex = puzzlePieces.findIndex(piece => piece.isEmpty);
    
    if (this.canMove(clickedIndex, emptyIndex)) {
      const temp = puzzlePieces[clickedIndex];
      puzzlePieces[clickedIndex] = puzzlePieces[emptyIndex];
      puzzlePieces[emptyIndex] = temp;
      
      const newSteps = this.data.steps + 1;
      
      this.setData({
        puzzlePieces: puzzlePieces,
        steps: newSteps
      });
      
      setTimeout(() => {
        this.checkWin();
      }, 200);
    }
  },

  canMove: function(pieceIndex, emptyIndex) {
    const pieceRow = Math.floor(pieceIndex / 3);
    const pieceCol = pieceIndex % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;
    
    const rowDiff = Math.abs(pieceRow - emptyRow);
    const colDiff = Math.abs(pieceCol - emptyCol);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  },

  checkWin: function() {
    const puzzlePieces = this.data.puzzlePieces;
    let isWin = true;
    
    for (let i = 0; i < puzzlePieces.length - 1; i++) {
      if (puzzlePieces[i].correctNumber !== i + 1) {
        isWin = false;
        break;
      }
    }
    
    if (!puzzlePieces[puzzlePieces.length - 1].isEmpty) {
      isWin = false;
    }
    
    if (isWin) {
      this.handleWin();
    }
  },

  handleWin: function() {
    this.stopTimer();
    this.setData({ showVictory: true });
    wx.vibrateShort();
  },

  startTimer: function() {
    this.setData({
      seconds: 0,
      formatTime: '00:00'
    });
    
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

  stopTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  toggleNumbers: function() {
    this.setData({
      showNumbers: !this.data.showNumbers
    });
  },

  restartGame: function() {
    this.setData({ showVictory: false });
    this.stopTimer();
    this.startGame();
  },

  backToUpload: function() {
    this.stopTimer();
    this.setData({
      gameStarted: false,
      showVictory: false,
      steps: 0,
      seconds: 0,
      formatTime: '00:00'
    });
  },

  onUnload: function() {
    this.stopTimer();
  }
});