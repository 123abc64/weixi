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
    systemInfo: {}
  },

  onLoad: function (options) {
    // 获取系统信息，包括设备像素比
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          systemInfo: res,
          pixelRatio: res.pixelRatio || 2
        });
        console.log('系统信息:', res);
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
      sizeType: ['original'], // 使用原图保证质量
      sourceType: ['album'],
      success: (res) => {
        console.log('选择图片成功:', res.tempFilePaths[0]);
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
      sizeType: ['original'], // 使用原图
      sourceType: ['camera'],
      success: (res) => {
        console.log('拍照成功:', res.tempFilePaths[0]);
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
    
    // 验证图片
    this.validateImage(imagePath);
  },

  validateImage: function(imagePath) {
    wx.getImageInfo({
      src: imagePath,
      success: (res) => {
        console.log('图片验证成功:', res);
        
        if (res.width < 300 || res.height < 300) {
          wx.showModal({
            title: '图片提示',
            content: '图片尺寸较小，建议使用大于300x300的图片以获得更好效果',
            confirmText: '继续使用',
            showCancel: false
          });
        }
      },
      fail: (err) => {
        console.error('图片验证失败:', err);
      }
    });
  },

  startGame: function() {
    if (!this.data.uploadedImage) {
      wx.showToast({
        title: '请先上传图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ 
      processing: true,
      processingText: '正在分析图片...',
      showProgress: true,
      progressPercent: 0
    });

    this.correctCanvasSplit()
      .then((splitImages) => {
        this.setData({
          processingText: '初始化游戏...',
          progressPercent: 100
        });
        
        setTimeout(() => {
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
            icon: 'success',
            duration: 1000
          });
        }, 500);
      })
      .catch((err) => {
        console.error('图片处理失败:', err);
        wx.showModal({
          title: '处理失败',
          content: '图片处理失败：' + (err.message || err.errMsg || '未知错误'),
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
   * 正确的Canvas切割方法 - 解决图案重复问题
   */
  correctCanvasSplit: function() {
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

      // 步骤1: 获取图片的真实信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('=== 图片信息 ===');
          console.log('路径:', imagePath);
          console.log('尺寸:', imageInfo.width + 'x' + imageInfo.height);
          console.log('类型:', imageInfo.type);
          console.log('大小:', (imageInfo.size / 1024).toFixed(2) + 'KB');
          
          this.performCorrectSplit(imagePath, imageInfo)
            .then(resolve)
            .catch(reject);
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(new Error('无法读取图片信息'));
        }
      });
    });
  },

  /**
   * 执行正确的分割 - 解决重复和错位
   */
  performCorrectSplit: function(imagePath, imageInfo) {
    return new Promise((resolve, reject) => {
      const { width: imgW, height: imgH } = imageInfo;
      const { pixelRatio = 2 } = this.data.systemInfo;

      // 关键1: 基于原图尺寸计算单块尺寸
      const pieceWidth = Math.floor(imgW / 3);
      const pieceHeight = Math.floor(imgH / 3);
      
      console.log('=== 分割参数 ===');
      console.log('原图尺寸:', `${imgW} x ${imgH}`);
      console.log('单块尺寸:', `${pieceWidth} x ${pieceHeight}`);
      console.log('像素比:', pixelRatio);

      this.setData({
        processingText: '准备Canvas...',
        progressPercent: 20
      });

      // 获取Canvas上下文
      const ctx = wx.createCanvasContext('splitCanvas');
      
      const splitImages = [];
      const total = 8; // 8个拼图块
      let completed = 0;

      this.setData({
        processingText: '切割图片...',
        progressPercent: 30
      });

      // 步骤2: 逐块切割 - 关键是正确的时序和参数
      const cutPromises = [];

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const index = row * 3 + col;
          if (index === 8) continue; // 跳过第9块

          const cutPromise = this.cutPieceCorrectly(
            ctx, imagePath,
            imgW, imgH,
            pieceWidth, pieceHeight,
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

            // 备用：显示错误信息但不中断
            const errorPiece = {
              index: index,
              correctNumber: index + 1,
              imageUrl: '',
              error: true,
              errorMsg: `第${index + 1}块切割失败`
            };
            splitImages[index] = errorPiece;

            const progress = 30 + Math.floor((completed / total) * 60);
            this.setData({
              progressPercent: progress,
              processingText: `已处理 ${completed}/${total} 块`
            });

            return errorPiece;
          });

          cutPromises.push(cutPromise);
        }
      }

      // 等待所有切割完成
      Promise.all(cutPromises)
        .then(() => {
          console.log('=== 切割完成 ===');
          
          this.setData({
            processingText: '整理数据...',
            progressPercent: 95
          });

          setTimeout(() => {
            const result = splitImages.filter(piece => !piece.error);
            if (result.length === 8) {
              console.log('所有拼图块切割成功');
              resolve(result);
            } else {
              console.error('切割结果不完整:', result.length);
              reject(new Error('图片切割不完整'));
            }
          }, 200);
        })
        .catch(reject);
    });
  },

  /**
   * 正确切割单个拼图块 - 解决重复和错位的核心
   */
  cutPieceCorrectly: function(ctx, imagePath, imgW, imgH, pieceWidth, pieceHeight, row, col, index, pixelRatio) {
    return new Promise((resolve, reject) => {
      try {
        // 关键2: 计算源图片的切割区域
        // 这里是重点：必须基于原图的真实尺寸计算
        const sx = col * pieceWidth;
        const sy = row * pieceHeight;
        
        console.log(`=== 切割第${index + 1}块 ===`);
        console.log('位置:', `第${row + 1}行 第${col + 1}列`);
        console.log('源图切割区域:', `${sx}, ${sy}, ${pieceWidth}, ${pieceHeight}`);
        console.log('Canvas绘制尺寸:', `${pieceWidth}, ${pieceHeight}`);

        this.setData({
          processingText: `切割第${index + 1}块...`
        });

        // 关键3: 每次切割前必须清空Canvas
        ctx.clearRect(0, 0, pieceWidth, pieceHeight);

        // 关键4: 设置Canvas尺寸 - 必须与单块尺寸一致
        // 这一步很关键，避免尺寸不匹配导致的错位
        ctx.canvas.width = pieceWidth;
        ctx.canvas.height = pieceHeight;

        // 关键5: 异步加载图片 - 确保图片完全加载
        // 微信小程序的图片加载是异步的，需要延迟
        setTimeout(() => {
          // 关键6: 正确的drawImage参数
          // 语法: drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
          // image: 图片路径
          // sx, sy: 源图片的裁剪起始坐标
          // sw, sh: 源图片的裁剪尺寸
          // dx, dy: Canvas上的绘制起始坐标（这里为0,0）
          // dw, dh: Canvas上的绘制尺寸（这里为单块尺寸）
          ctx.drawImage(
            imagePath,         // 图片路径
            sx, sy,            // 源图裁剪起始
            pieceWidth, pieceHeight, // 源图裁剪尺寸
            0, 0,              // Canvas绘制起始
            pieceWidth, pieceHeight  // Canvas绘制尺寸
          );

          // 关键7: 等待绘制完成再导出
          ctx.draw(false, () => {
            // 再次延迟确保渲染完成
            setTimeout(() => {
              // 关键8: 导出时设置正确的尺寸和质量
              wx.canvasToTempFilePath({
                canvasId: 'splitCanvas',
                x: 0,
                y: 0,
                width: pieceWidth,
                height: pieceHeight,
                destWidth: pieceWidth * pixelRatio,  // 高清输出
                destHeight: pieceHeight * pixelRatio,
                quality: 0.9,
                success: (res) => {
                  if (res.tempFilePath) {
                    console.log(`✅ 第${index + 1}块切割成功:`, res.tempFilePath);
                    
                    resolve({
                      index: index,
                      correctNumber: index + 1,
                      imageUrl: res.tempFilePath,
                      bgPosX: 0,
                      bgPosY: 0,
                      // 保存调试信息
                      debug: {
                        row: row + 1,
                        col: col + 1,
                        sourceArea: `${sx},${sy},${pieceWidth},${pieceHeight}`,
                        canvasSize: `${pieceWidth}x${pieceHeight}`
                      }
                    });
                  } else {
                    console.error(`❌ 第${index + 1}块: 临时文件路径为空`);
                    reject(new Error(`第${index + 1}块: 临时文件路径为空`));
                  }
                },
                fail: (err) => {
                  console.error(`❌ 第${index + 1}块导出失败:`, err);
                  reject(new Error(`第${index + 1}块导出失败: ${err.errMsg}`));
                }
              });
            }, 300); // 延迟300ms确保绘制完全完成
          });
        }, 100); // 延迟100ms确保图片加载

      } catch (error) {
        console.error(`❌ 第${index + 1}块切割异常:`, error);
        reject(new Error(`第${index + 1}块切割异常: ${error.message}`));
      }
    });
  },

  /**
   * 初始化拼图游戏
   */
  initPuzzleGame: function(splitImages) {
    console.log('=== 初始化拼图游戏 ===');
    console.log('拼图块数量:', splitImages.length);
    
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
        isEmpty: false,
        debug: piece.debug
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
   * 智能拼图打乱 - 确保可解
   */
  shufflePuzzle: function(puzzlePieces) {
    const moveCount = 50; // 减少移动次数提高速度
    let emptyIndex = puzzlePieces.findIndex(piece => piece.isEmpty);
    
    for (let i = 0; i < moveCount; i++) {
      const validMoves = this.getValidMoves(emptyIndex);
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        // 交换空格和随机相邻块
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
      // 交换位置
      const temp = puzzlePieces[clickedIndex];
      puzzlePieces[clickedIndex] = puzzlePieces[emptyIndex];
      puzzlePieces[emptyIndex] = temp;
      
      const newSteps = this.data.steps + 1;
      
      this.setData({
        puzzlePieces: puzzlePieces,
        steps: newSteps
      });
      
      // 延迟检查完成状态
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
    wx.vibrateShort({ type: 'medium' });
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

  showPreview: function() {
    this.setData({ showPreviewModal: true });
  },

  hidePreview: function() {
    this.setData({ showPreviewModal: false });
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
      showPreviewModal: false,
      steps: 0,
      seconds: 0,
      formatTime: '00:00'
    });
  },

  onUnload: function() {
    this.stopTimer();
  },

  onShareAppMessage: function() {
    return {
      title: '自定义拼图游戏',
      path: '/pages/upload/upload-correct',
      imageUrl: this.data.uploadedImage || ''
    };
  }
});