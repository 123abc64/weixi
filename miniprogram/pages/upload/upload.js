Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 上传相关
    uploadedImage: '',
    originalImage: '',
    processing: false,
    gameStarted: false,
    
    // 游戏相关
    puzzlePieces: [],
    steps: 0,
    timer: null,
    seconds: 0,
    formatTime: '00:00',
    showNumbers: false,
    showPreviewModal: false,
    showVictory: false,
    
    // 处理进度相关
    processingText: '正在处理图片...',
    showProgress: false,
    progressPercent: 0,
    
    // 交互相关
    touchStartPos: {},
    isDragging: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 预加载权限
    this.preloadPermissions();
  },

  /**
   * 预加载相机和相册权限
   */
  preloadPermissions: function() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.camera']) {
          wx.authorize({
            scope: 'scope.camera',
            fail: () => {
              console.log('相机权限获取失败');
            }
          });
        }
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            fail: () => {
              console.log('相册权限获取失败');
            }
          });
        }
      }
    });
  },

  /**
   * 生成拼图块 - 优先使用真实切割，失败时使用CSS备用方案
   */
  generatePuzzlePieces: function(imagePath) {
    console.log('开始生成拼图块');
    
    this.setData({
      processingText: '正在读取图片信息...',
      progressPercent: 20
    });
    
    return new Promise((resolve, reject) => {
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('图片信息:', imageInfo);
          
          // 先尝试真实切割
          this.tryRealCutting(imagePath, imageInfo)
            .then((puzzlePieces) => {
              console.log('真实切割成功');
              resolve(puzzlePieces);
            })
            .catch((err) => {
              console.error('真实切割失败，使用CSS备用方案:', err);
              // 备用方案：使用CSS背景定位
              this.generateCSSPuzzlePieces(imagePath)
                .then(resolve)
                .catch(reject);
            });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 尝试真实图片切割
   */
  tryRealCutting: function(imagePath, imageInfo) {
    return new Promise((resolve, reject) => {
      const { width, height } = imageInfo;
      
      // 限制最大尺寸，避免内存问题
      const maxSize = 1000;
      let scale = 1;
      if (width > maxSize || height > maxSize) {
        scale = Math.min(maxSize / width, maxSize / height);
      }
      
      const scaledWidth = Math.floor(width * scale);
      const scaledHeight = Math.floor(height * scale);
      const pieceWidth = Math.floor(scaledWidth / 3);
      const pieceHeight = Math.floor(scaledHeight / 3);
      
      console.log('切割参数:', {
        原图尺寸: `${width}x${height}`,
        缩放后尺寸: `${scaledWidth}x${scaledHeight}`,
        拼图块尺寸: `${pieceWidth}x${pieceHeight}`,
        缩放比: scale
      });
      
      this.setData({
        processingText: '正在切割图片...',
        progressPercent: 40
      });
      
      // 检查尺寸是否合理
      if (pieceWidth < 50 || pieceHeight < 50) {
        reject(new Error('图片尺寸过小，无法进行真实切割'));
        return;
      }
      
      // 开始真实切割
      this.cutImageIntoPieces(imagePath, scaledWidth, scaledHeight, pieceWidth, pieceHeight)
        .then((cutPieces) => {
          console.log('真实切割完成:', cutPieces.length, '块');
          
          // 创建拼图块数组
          const puzzlePieces = [];
          for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isEmpty = (i === 8);
            
            puzzlePieces.push({
              id: i,
              currentPosition: i,
              originalPosition: i,
              row: row,
              col: col,
              isEmpty: isEmpty,
              imageUrl: isEmpty ? '' : cutPieces[i],
              pieceWidth: pieceWidth,
              pieceHeight: pieceHeight
            });
          }
          
          this.setData({
            processingText: '拼图块生成完成',
            progressPercent: 80
          });
          
          setTimeout(() => {
            resolve(puzzlePieces);
          }, 300);
        })
        .catch(reject);
    });
  },

  /**
   * CSS备用方案生成拼图块
   */
  generateCSSPuzzlePieces: function(imagePath) {
    console.log('使用CSS备用方案');
    
    this.setData({
      processingText: '正在使用备用方案...',
      progressPercent: 50
    });
    
    return new Promise((resolve) => {
      const puzzlePieces = [];
      
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const bgPosX = col * 33.33;
        const bgPosY = row * 33.33;
        const isEmpty = (i === 8);
        
        puzzlePieces.push({
          id: i,
          currentPosition: i,
          originalPosition: i,
          row: row,
          col: col,
          isEmpty: isEmpty,
          imageUrl: isEmpty ? '' : imagePath,
          bgPosX: bgPosX,
          bgPosY: bgPosY,
          pieceWidth: 33.33,
          pieceHeight: 33.33
        });
      }
      
      this.setData({
        processingText: '备用方案完成',
        progressPercent: 80
      });
      
      setTimeout(() => {
        resolve(puzzlePieces);
      }, 300);
    });
  },

  /**
   * 选择图片
   */
  chooseImage: function() {
    const that = this;
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: function(res) {
        if (res.tapIndex === 0) {
          // 从相册选择
          that.selectFromAlbum();
        } else if (res.tapIndex === 1) {
          // 拍照
          that.takePhoto();
        }
      }
    });
  },

  /**
   * 生成拼图块 - 优先使用真实切割，失败时使用CSS备用方案
   */
  generatePuzzlePieces: function(imagePath) {
    console.log('开始生成拼图块');
    
    this.setData({
      processingText: '正在读取图片信息...',
      progressPercent: 20
    });
    
    return new Promise((resolve, reject) => {
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('图片信息:', imageInfo);
          
          // 先尝试真实切割
          this.tryRealCutting(imagePath, imageInfo)
            .then((puzzlePieces) => {
              console.log('真实切割成功');
              resolve(puzzlePieces);
            })
            .catch((err) => {
              console.error('真实切割失败，使用CSS备用方案:', err);
              // 备用方案：使用CSS背景定位
              this.generateCSSPuzzlePieces(imagePath)
                .then(resolve)
                .catch(reject);
            });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 尝试真实图片切割
   */
  tryRealCutting: function(imagePath, imageInfo) {
    return new Promise((resolve, reject) => {
      const { width, height } = imageInfo;
      
      // 限制最大尺寸，避免内存问题
      const maxSize = 1000;
      let scale = 1;
      if (width > maxSize || height > maxSize) {
        scale = Math.min(maxSize / width, maxSize / height);
      }
      
      const scaledWidth = Math.floor(width * scale);
      const scaledHeight = Math.floor(height * scale);
      const pieceWidth = Math.floor(scaledWidth / 3);
      const pieceHeight = Math.floor(scaledHeight / 3);
      
      console.log('切割参数:', {
        原图尺寸: `${width}x${height}`,
        缩放后尺寸: `${scaledWidth}x${scaledHeight}`,
        拼图块尺寸: `${pieceWidth}x${pieceHeight}`,
        缩放比: scale
      });
      
      this.setData({
        processingText: '正在切割图片...',
        progressPercent: 40
      });
      
      // 检查尺寸是否合理
      if (pieceWidth < 50 || pieceHeight < 50) {
        reject(new Error('图片尺寸过小，无法进行真实切割'));
        return;
      }
      
      // 开始真实切割
      this.cutImageIntoPieces(imagePath, scaledWidth, scaledHeight, pieceWidth, pieceHeight)
        .then((cutPieces) => {
          console.log('真实切割完成:', cutPieces.length, '块');
          
          // 创建拼图块数组
          const puzzlePieces = [];
          for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isEmpty = (i === 8);
            
            puzzlePieces.push({
              id: i,
              currentPosition: i,
              originalPosition: i,
              row: row,
              col: col,
              isEmpty: isEmpty,
              imageUrl: isEmpty ? '' : cutPieces[i],
              pieceWidth: pieceWidth,
              pieceHeight: pieceHeight
            });
          }
          
          this.setData({
            processingText: '拼图块生成完成',
            progressPercent: 80
          });
          
          setTimeout(() => {
            resolve(puzzlePieces);
          }, 300);
        })
        .catch(reject);
    });
  },

  /**
   * CSS备用方案生成拼图块
   */
  generateCSSPuzzlePieces: function(imagePath) {
    console.log('使用CSS备用方案');
    
    this.setData({
      processingText: '正在使用备用方案...',
      progressPercent: 50
    });
    
    return new Promise((resolve) => {
      const puzzlePieces = [];
      
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const bgPosX = col * 33.33;
        const bgPosY = row * 33.33;
        const isEmpty = (i === 8);
        
        puzzlePieces.push({
          id: i,
          currentPosition: i,
          originalPosition: i,
          row: row,
          col: col,
          isEmpty: isEmpty,
          imageUrl: isEmpty ? '' : imagePath,
          bgPosX: bgPosX,
          bgPosY: bgPosY,
          pieceWidth: 33.33,
          pieceHeight: 33.33
        });
      }
      
      this.setData({
        processingText: '备用方案完成',
        progressPercent: 80
      });
      
      setTimeout(() => {
        resolve(puzzlePieces);
      }, 300);
    });
  },

  /**
   * 从相册选择图片
   */
  selectFromAlbum: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.handleImageSelection(res.tempFilePaths[0]);
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
        console.error('选择图片失败:', err);
      }
    });
  },

  /**
   * 生成拼图块 - 优先使用真实切割，失败时使用CSS备用方案
   */
  generatePuzzlePieces: function(imagePath) {
    console.log('开始生成拼图块');
    
    this.setData({
      processingText: '正在读取图片信息...',
      progressPercent: 20
    });
    
    return new Promise((resolve, reject) => {
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('图片信息:', imageInfo);
          
          // 先尝试真实切割
          this.tryRealCutting(imagePath, imageInfo)
            .then((puzzlePieces) => {
              console.log('真实切割成功');
              resolve(puzzlePieces);
            })
            .catch((err) => {
              console.error('真实切割失败，使用CSS备用方案:', err);
              // 备用方案：使用CSS背景定位
              this.generateCSSPuzzlePieces(imagePath)
                .then(resolve)
                .catch(reject);
            });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 尝试真实图片切割
   */
  tryRealCutting: function(imagePath, imageInfo) {
    return new Promise((resolve, reject) => {
      const { width, height } = imageInfo;
      
      // 限制最大尺寸，避免内存问题
      const maxSize = 1000;
      let scale = 1;
      if (width > maxSize || height > maxSize) {
        scale = Math.min(maxSize / width, maxSize / height);
      }
      
      const scaledWidth = Math.floor(width * scale);
      const scaledHeight = Math.floor(height * scale);
      const pieceWidth = Math.floor(scaledWidth / 3);
      const pieceHeight = Math.floor(scaledHeight / 3);
      
      console.log('切割参数:', {
        原图尺寸: `${width}x${height}`,
        缩放后尺寸: `${scaledWidth}x${scaledHeight}`,
        拼图块尺寸: `${pieceWidth}x${pieceHeight}`,
        缩放比: scale
      });
      
      this.setData({
        processingText: '正在切割图片...',
        progressPercent: 40
      });
      
      // 检查尺寸是否合理
      if (pieceWidth < 50 || pieceHeight < 50) {
        reject(new Error('图片尺寸过小，无法进行真实切割'));
        return;
      }
      
      // 开始真实切割
      this.cutImageIntoPieces(imagePath, scaledWidth, scaledHeight, pieceWidth, pieceHeight)
        .then((cutPieces) => {
          console.log('真实切割完成:', cutPieces.length, '块');
          
          // 创建拼图块数组
          const puzzlePieces = [];
          for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isEmpty = (i === 8);
            
            puzzlePieces.push({
              id: i,
              currentPosition: i,
              originalPosition: i,
              row: row,
              col: col,
              isEmpty: isEmpty,
              imageUrl: isEmpty ? '' : cutPieces[i],
              pieceWidth: pieceWidth,
              pieceHeight: pieceHeight
            });
          }
          
          this.setData({
            processingText: '拼图块生成完成',
            progressPercent: 80
          });
          
          setTimeout(() => {
            resolve(puzzlePieces);
          }, 300);
        })
        .catch(reject);
    });
  },

  /**
   * CSS备用方案生成拼图块
   */
  generateCSSPuzzlePieces: function(imagePath) {
    console.log('使用CSS备用方案');
    
    this.setData({
      processingText: '正在使用备用方案...',
      progressPercent: 50
    });
    
    return new Promise((resolve) => {
      const puzzlePieces = [];
      
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const bgPosX = col * 33.33;
        const bgPosY = row * 33.33;
        const isEmpty = (i === 8);
        
        puzzlePieces.push({
          id: i,
          currentPosition: i,
          originalPosition: i,
          row: row,
          col: col,
          isEmpty: isEmpty,
          imageUrl: isEmpty ? '' : imagePath,
          bgPosX: bgPosX,
          bgPosY: bgPosY,
          pieceWidth: 33.33,
          pieceHeight: 33.33
        });
      }
      
      this.setData({
        processingText: '备用方案完成',
        progressPercent: 80
      });
      
      setTimeout(() => {
        resolve(puzzlePieces);
      }, 300);
    });
  },

  /**
   * 拍照
   */
  takePhoto: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        this.handleImageSelection(res.tempFilePaths[0]);
      },
      fail: (err) => {
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
        console.error('拍照失败:', err);
      }
    });
  },

  /**
   * 生成拼图块 - 优先使用真实切割，失败时使用CSS备用方案
   */
  generatePuzzlePieces: function(imagePath) {
    console.log('开始生成拼图块');
    
    this.setData({
      processingText: '正在读取图片信息...',
      progressPercent: 20
    });
    
    return new Promise((resolve, reject) => {
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('图片信息:', imageInfo);
          
          // 先尝试真实切割
          this.tryRealCutting(imagePath, imageInfo)
            .then((puzzlePieces) => {
              console.log('真实切割成功');
              resolve(puzzlePieces);
            })
            .catch((err) => {
              console.error('真实切割失败，使用CSS备用方案:', err);
              // 备用方案：使用CSS背景定位
              this.generateCSSPuzzlePieces(imagePath)
                .then(resolve)
                .catch(reject);
            });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 尝试真实图片切割
   */
  tryRealCutting: function(imagePath, imageInfo) {
    return new Promise((resolve, reject) => {
      const { width, height } = imageInfo;
      
      // 限制最大尺寸，避免内存问题
      const maxSize = 1000;
      let scale = 1;
      if (width > maxSize || height > maxSize) {
        scale = Math.min(maxSize / width, maxSize / height);
      }
      
      const scaledWidth = Math.floor(width * scale);
      const scaledHeight = Math.floor(height * scale);
      const pieceWidth = Math.floor(scaledWidth / 3);
      const pieceHeight = Math.floor(scaledHeight / 3);
      
      console.log('切割参数:', {
        原图尺寸: `${width}x${height}`,
        缩放后尺寸: `${scaledWidth}x${scaledHeight}`,
        拼图块尺寸: `${pieceWidth}x${pieceHeight}`,
        缩放比: scale
      });
      
      this.setData({
        processingText: '正在切割图片...',
        progressPercent: 40
      });
      
      // 检查尺寸是否合理
      if (pieceWidth < 50 || pieceHeight < 50) {
        reject(new Error('图片尺寸过小，无法进行真实切割'));
        return;
      }
      
      // 开始真实切割
      this.cutImageIntoPieces(imagePath, scaledWidth, scaledHeight, pieceWidth, pieceHeight)
        .then((cutPieces) => {
          console.log('真实切割完成:', cutPieces.length, '块');
          
          // 创建拼图块数组
          const puzzlePieces = [];
          for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isEmpty = (i === 8);
            
            puzzlePieces.push({
              id: i,
              currentPosition: i,
              originalPosition: i,
              row: row,
              col: col,
              isEmpty: isEmpty,
              imageUrl: isEmpty ? '' : cutPieces[i],
              pieceWidth: pieceWidth,
              pieceHeight: pieceHeight
            });
          }
          
          this.setData({
            processingText: '拼图块生成完成',
            progressPercent: 80
          });
          
          setTimeout(() => {
            resolve(puzzlePieces);
          }, 300);
        })
        .catch(reject);
    });
  },

  /**
   * CSS备用方案生成拼图块
   */
  generateCSSPuzzlePieces: function(imagePath) {
    console.log('使用CSS备用方案');
    
    this.setData({
      processingText: '正在使用备用方案...',
      progressPercent: 50
    });
    
    return new Promise((resolve) => {
      const puzzlePieces = [];
      
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const bgPosX = col * 33.33;
        const bgPosY = row * 33.33;
        const isEmpty = (i === 8);
        
        puzzlePieces.push({
          id: i,
          currentPosition: i,
          originalPosition: i,
          row: row,
          col: col,
          isEmpty: isEmpty,
          imageUrl: isEmpty ? '' : imagePath,
          bgPosX: bgPosX,
          bgPosY: bgPosY,
          pieceWidth: 33.33,
          pieceHeight: 33.33
        });
      }
      
      this.setData({
        processingText: '备用方案完成',
        progressPercent: 80
      });
      
      setTimeout(() => {
        resolve(puzzlePieces);
      }, 300);
    });
  },

  /**
   * 处理选择的图片
   */
  handleImageSelection: function(imagePath) {
    this.setData({
      uploadedImage: imagePath,
      originalImage: imagePath
    });
    
    // 快速验证图片
    this.quickValidateImage(imagePath);
  },

  /**
   * 快速验证图片
   */
  quickValidateImage: function(imagePath) {
    wx.getImageInfo({
      src: imagePath,
      success: (res) => {
        console.log('图片信息:', res);
        
        // 基本检查
        if (res.width < 200 || res.height < 200) {
          wx.showModal({
            title: '图片提示',
            content: '图片较小，建议使用尺寸大于200x200的图片以获得更好效果',
            confirmText: '继续使用',
            showCancel: false
          });
        }
      },
      fail: (err) => {
        console.error('图片信息获取失败:', err);
        // 不阻止继续使用图片
      }
    });
  },

  /**
   * 生成拼图块 - 优先使用真实切割，失败时使用CSS备用方案
   */
  generatePuzzlePieces: function(imagePath) {
    console.log('开始生成拼图块');
    
    this.setData({
      processingText: '正在读取图片信息...',
      progressPercent: 20
    });
    
    return new Promise((resolve, reject) => {
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('图片信息:', imageInfo);
          
          // 先尝试真实切割
          this.tryRealCutting(imagePath, imageInfo)
            .then((puzzlePieces) => {
              console.log('真实切割成功');
              resolve(puzzlePieces);
            })
            .catch((err) => {
              console.error('真实切割失败，使用CSS备用方案:', err);
              // 备用方案：使用CSS背景定位
              this.generateCSSPuzzlePieces(imagePath)
                .then(resolve)
                .catch(reject);
            });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 尝试真实图片切割
   */
  tryRealCutting: function(imagePath, imageInfo) {
    return new Promise((resolve, reject) => {
      const { width, height } = imageInfo;
      
      // 限制最大尺寸，避免内存问题
      const maxSize = 1000;
      let scale = 1;
      if (width > maxSize || height > maxSize) {
        scale = Math.min(maxSize / width, maxSize / height);
      }
      
      const scaledWidth = Math.floor(width * scale);
      const scaledHeight = Math.floor(height * scale);
      const pieceWidth = Math.floor(scaledWidth / 3);
      const pieceHeight = Math.floor(scaledHeight / 3);
      
      console.log('切割参数:', {
        原图尺寸: `${width}x${height}`,
        缩放后尺寸: `${scaledWidth}x${scaledHeight}`,
        拼图块尺寸: `${pieceWidth}x${pieceHeight}`,
        缩放比: scale
      });
      
      this.setData({
        processingText: '正在切割图片...',
        progressPercent: 40
      });
      
      // 检查尺寸是否合理
      if (pieceWidth < 50 || pieceHeight < 50) {
        reject(new Error('图片尺寸过小，无法进行真实切割'));
        return;
      }
      
      // 开始真实切割
      this.cutImageIntoPieces(imagePath, scaledWidth, scaledHeight, pieceWidth, pieceHeight)
        .then((cutPieces) => {
          console.log('真实切割完成:', cutPieces.length, '块');
          
          // 创建拼图块数组
          const puzzlePieces = [];
          for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isEmpty = (i === 8);
            
            puzzlePieces.push({
              id: i,
              currentPosition: i,
              originalPosition: i,
              row: row,
              col: col,
              isEmpty: isEmpty,
              imageUrl: isEmpty ? '' : cutPieces[i],
              pieceWidth: pieceWidth,
              pieceHeight: pieceHeight
            });
          }
          
          this.setData({
            processingText: '拼图块生成完成',
            progressPercent: 80
          });
          
          setTimeout(() => {
            resolve(puzzlePieces);
          }, 300);
        })
        .catch(reject);
    });
  },

  /**
   * CSS备用方案生成拼图块
   */
  generateCSSPuzzlePieces: function(imagePath) {
    console.log('使用CSS备用方案');
    
    this.setData({
      processingText: '正在使用备用方案...',
      progressPercent: 50
    });
    
    return new Promise((resolve) => {
      const puzzlePieces = [];
      
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const bgPosX = col * 33.33;
        const bgPosY = row * 33.33;
        const isEmpty = (i === 8);
        
        puzzlePieces.push({
          id: i,
          currentPosition: i,
          originalPosition: i,
          row: row,
          col: col,
          isEmpty: isEmpty,
          imageUrl: isEmpty ? '' : imagePath,
          bgPosX: bgPosX,
          bgPosY: bgPosY,
          pieceWidth: 33.33,
          pieceHeight: 33.33
        });
      }
      
      this.setData({
        processingText: '备用方案完成',
        progressPercent: 80
      });
      
      setTimeout(() => {
        resolve(puzzlePieces);
      }, 300);
    });
  },

  /**
   * 开始游戏
   */
  startGame: function() {
    this.setData({ 
      processing: true,
      processingText: '正在分析图片...',
      showProgress: true,
      progressPercent: 0
    });
    
    // 精确图片处理
    this.quickProcessImage()
      .then((splitImages) => {
        this.setData({
          processingText: '初始化游戏...',
          progressPercent: 100
        });
        
        // 延迟一下让用户看到100%
        setTimeout(() => {
          // 初始化拼图游戏
          this.initPuzzleGame(splitImages);
          this.setData({ 
            processing: false,
            gameStarted: true,
            showProgress: false,
            progressPercent: 0
          });
          
          // 开始计时
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
        
        // 显示详细错误信息
        let errorMsg = '处理失败';
        if (err.errMsg) {
          if (err.errMsg.includes('canvas')) {
            errorMsg = 'Canvas处理失败';
          } else if (err.errMsg.includes('tempFilePath')) {
            errorMsg = '图片导出失败';
          } else if (err.errMsg.includes('getImageInfo')) {
            errorMsg = '图片信息获取失败';
          }
        }
        
        wx.showModal({
          title: '处理失败',
          content: errorMsg + '，请重试或更换图片',
          confirmText: '重试',
          cancelText: '更换图片',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 重试
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
   * 处理图片并生成九宫格拼图
   */
  quickProcessImage: function() {
    return new Promise((resolve, reject) => {
      const imagePath = this.data.uploadedImage;
      
      if (!imagePath) {
        reject(new Error('图片路径为空'));
        return;
      }
      
      console.log('开始生成九宫格拼图:', imagePath);
      
      this.setData({
        processingText: '正在读取图片信息...',
        progressPercent: 10
      });
      
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('图片信息:', imageInfo);
          
          this.setData({
            processingText: '正在生成拼图...',
            progressPercent: 30
          });
          
          // 使用Canvas真实切割方式生成拼图块
          this.generatePuzzlePieces(imagePath)
            .then((puzzlePieces) => {
              console.log('拼图块生成成功:', puzzlePieces.length, '块');
              
              this.setData({
                processingText: '拼图准备完成',
                progressPercent: 90
              });
              
              setTimeout(() => {
                resolve(puzzlePieces);
              }, 200);
            })
            .catch((err) => {
              console.error('生成拼图块失败:', err);
              reject(err);
            });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },



  /**
   * 生成拼图块 - 优先使用真实切割，失败时使用CSS备用方案
   */
  generatePuzzlePieces: function(imagePath) {
    console.log('开始生成拼图块');
    
    this.setData({
      processingText: '正在读取图片信息...',
      progressPercent: 20
    });
    
    return new Promise((resolve, reject) => {
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('图片信息:', imageInfo);
          
          // 先尝试真实切割
          this.tryRealCutting(imagePath, imageInfo)
            .then((puzzlePieces) => {
              console.log('真实切割成功');
              resolve(puzzlePieces);
            })
            .catch((err) => {
              console.error('真实切割失败，使用CSS备用方案:', err);
              // 备用方案：使用CSS背景定位
              this.generateCSSPuzzlePieces(imagePath)
                .then(resolve)
                .catch(reject);
            });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 尝试真实图片切割
   */
  tryRealCutting: function(imagePath, imageInfo) {
    return new Promise((resolve, reject) => {
      const { width, height } = imageInfo;
      
      // 限制最大尺寸，避免内存问题
      const maxSize = 1000;
      let scale = 1;
      if (width > maxSize || height > maxSize) {
        scale = Math.min(maxSize / width, maxSize / height);
      }
      
      const scaledWidth = Math.floor(width * scale);
      const scaledHeight = Math.floor(height * scale);
      const pieceWidth = Math.floor(scaledWidth / 3);
      const pieceHeight = Math.floor(scaledHeight / 3);
      
      console.log('切割参数:', {
        原图尺寸: `${width}x${height}`,
        缩放后尺寸: `${scaledWidth}x${scaledHeight}`,
        拼图块尺寸: `${pieceWidth}x${pieceHeight}`,
        缩放比: scale
      });
      
      this.setData({
        processingText: '正在切割图片...',
        progressPercent: 40
      });
      
      // 检查尺寸是否合理
      if (pieceWidth < 50 || pieceHeight < 50) {
        reject(new Error('图片尺寸过小，无法进行真实切割'));
        return;
      }
      
      // 开始真实切割
      this.cutImageIntoPieces(imagePath, scaledWidth, scaledHeight, pieceWidth, pieceHeight)
        .then((cutPieces) => {
          console.log('真实切割完成:', cutPieces.length, '块');
          
          // 创建拼图块数组
          const puzzlePieces = [];
          for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isEmpty = (i === 8);
            
            puzzlePieces.push({
              id: i,
              currentPosition: i,
              originalPosition: i,
              row: row,
              col: col,
              isEmpty: isEmpty,
              imageUrl: isEmpty ? '' : cutPieces[i],
              pieceWidth: pieceWidth,
              pieceHeight: pieceHeight
            });
          }
          
          this.setData({
            processingText: '拼图块生成完成',
            progressPercent: 80
          });
          
          setTimeout(() => {
            resolve(puzzlePieces);
          }, 300);
        })
        .catch(reject);
    });
  },

  /**
   * CSS备用方案生成拼图块
   */
  generateCSSPuzzlePieces: function(imagePath) {
    console.log('使用CSS备用方案');
    
    this.setData({
      processingText: '正在使用备用方案...',
      progressPercent: 50
    });
    
    return new Promise((resolve) => {
      const puzzlePieces = [];
      
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const bgPosX = col * 33.33;
        const bgPosY = row * 33.33;
        const isEmpty = (i === 8);
        
        puzzlePieces.push({
          id: i,
          currentPosition: i,
          originalPosition: i,
          row: row,
          col: col,
          isEmpty: isEmpty,
          imageUrl: isEmpty ? '' : imagePath,
          bgPosX: bgPosX,
          bgPosY: bgPosY,
          pieceWidth: 33.33,
          pieceHeight: 33.33
        });
      }
      
      this.setData({
        processingText: '备用方案完成',
        progressPercent: 80
      });
      
      setTimeout(() => {
        resolve(puzzlePieces);
      }, 300);
    });
  },



  /**
   * 生成拼图块 - 优先使用真实切割，失败时使用CSS备用方案
   */
  generatePuzzlePieces: function(imagePath) {
    console.log('开始生成拼图块');
    
    this.setData({
      processingText: '正在读取图片信息...',
      progressPercent: 20
    });
    
    return new Promise((resolve, reject) => {
      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          console.log('图片信息:', imageInfo);
          
          // 先尝试真实切割
          this.tryRealCutting(imagePath, imageInfo)
            .then((puzzlePieces) => {
              console.log('真实切割成功');
              resolve(puzzlePieces);
            })
            .catch((err) => {
              console.error('真实切割失败，使用CSS备用方案:', err);
              // 备用方案：使用CSS背景定位
              this.generateCSSPuzzlePieces(imagePath)
                .then(resolve)
                .catch(reject);
            });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 尝试真实图片切割
   */
  tryRealCutting: function(imagePath, imageInfo) {
    return new Promise((resolve, reject) => {
      const { width, height } = imageInfo;
      
      // 限制最大尺寸，避免内存问题
      const maxSize = 1000;
      let scale = 1;
      if (width > maxSize || height > maxSize) {
        scale = Math.min(maxSize / width, maxSize / height);
      }
      
      const scaledWidth = Math.floor(width * scale);
      const scaledHeight = Math.floor(height * scale);
      const pieceWidth = Math.floor(scaledWidth / 3);
      const pieceHeight = Math.floor(scaledHeight / 3);
      
      console.log('切割参数:', {
        原图尺寸: `${width}x${height}`,
        缩放后尺寸: `${scaledWidth}x${scaledHeight}`,
        拼图块尺寸: `${pieceWidth}x${pieceHeight}`,
        缩放比: scale
      });
      
      this.setData({
        processingText: '正在切割图片...',
        progressPercent: 40
      });
      
      // 检查尺寸是否合理
      if (pieceWidth < 50 || pieceHeight < 50) {
        reject(new Error('图片尺寸过小，无法进行真实切割'));
        return;
      }
      
      // 开始真实切割
      this.cutImageIntoPieces(imagePath, scaledWidth, scaledHeight, pieceWidth, pieceHeight)
        .then((cutPieces) => {
          console.log('真实切割完成:', cutPieces.length, '块');
          
          // 创建拼图块数组
          const puzzlePieces = [];
          for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isEmpty = (i === 8);
            
            puzzlePieces.push({
              id: i,
              currentPosition: i,
              originalPosition: i,
              row: row,
              col: col,
              isEmpty: isEmpty,
              imageUrl: isEmpty ? '' : cutPieces[i],
              pieceWidth: pieceWidth,
              pieceHeight: pieceHeight
            });
          }
          
          this.setData({
            processingText: '拼图块生成完成',
            progressPercent: 80
          });
          
          setTimeout(() => {
            resolve(puzzlePieces);
          }, 300);
        })
        .catch(reject);
    });
  },

  /**
   * CSS备用方案生成拼图块
   */
  generateCSSPuzzlePieces: function(imagePath) {
    console.log('使用CSS备用方案');
    
    this.setData({
      processingText: '正在使用备用方案...',
      progressPercent: 50
    });
    
    return new Promise((resolve) => {
      const puzzlePieces = [];
      
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const bgPosX = col * 33.33;
        const bgPosY = row * 33.33;
        const isEmpty = (i === 8);
        
        puzzlePieces.push({
          id: i,
          currentPosition: i,
          originalPosition: i,
          row: row,
          col: col,
          isEmpty: isEmpty,
          imageUrl: isEmpty ? '' : imagePath,
          bgPosX: bgPosX,
          bgPosY: bgPosY,
          pieceWidth: 33.33,
          pieceHeight: 33.33
        });
      }
      
      this.setData({
        processingText: '备用方案完成',
        progressPercent: 80
      });
      
      setTimeout(() => {
        resolve(puzzlePieces);
      }, 300);
    });
  },

  /**
   * 初始化拼图游戏
   */
  initPuzzleGame: function(puzzlePieces) {
    console.log('初始化拼图游戏');
    
    // 打乱拼图块位置
    this.shufflePuzzle(puzzlePieces);
    
    this.setData({
      puzzlePieces: puzzlePieces,
      steps: 0
    });
  },

  /**
   * 真实切割图片成九宫格小块 - 改进版本
   */
  cutImageIntoPieces: function(imagePath, imageWidth, imageHeight, pieceWidth, pieceHeight) {
    return new Promise((resolve, reject) => {
      console.log('开始切割图片，尺寸检查:', {
        imageWidth, imageHeight,
        pieceWidth, pieceHeight,
        totalSize: imageWidth * imageHeight,
        pieceSize: pieceWidth * pieceHeight
      });
      
      // 检查参数有效性
      if (!imagePath || imageWidth <= 0 || imageHeight <= 0 || pieceWidth <= 0 || pieceHeight <= 0) {
        reject(new Error('切割参数无效'));
        return;
      }
      
      // 检查总尺寸是否过大
      const totalPixels = imageWidth * imageHeight;
      if (totalPixels > 2000000) { // 2M像素限制
        reject(new Error('图片尺寸过大，可能导致内存不足'));
        return;
      }
      
      const cutPieces = [];
      let completed = 0;
      const total = 9;
      let hasError = false;
      
      // 逐个切割，避免并发问题
      const cutNext = () => {
        if (hasError) return;
        
        if (completed >= total) {
          console.log('所有图片块切割完成');
          resolve(cutPieces);
          return;
        }
        
        const row = Math.floor(completed / 3);
        const col = completed % 3;
        const index = completed;
        
        // 计算在原图中的切割位置
        const sourceX = col * pieceWidth;
        const sourceY = row * pieceHeight;
        
        console.log(`切割第${index + 1}块(第${row + 1}行第${col + 1}列):`, {
          sourceX, sourceY,
          pieceWidth, pieceHeight
        });
        
        // 切割单个图片块
        this.cutSinglePieceImproved(imagePath, sourceX, sourceY, pieceWidth, pieceHeight, index)
          .then((pieceImagePath) => {
            cutPieces[index] = pieceImagePath;
            completed++;
            
            // 更新进度
            const progress = 40 + Math.floor((completed / total) * 40);
            this.setData({
              processingText: `已切割 ${completed}/${total} 块`,
              progressPercent: progress
            });
            
            // 继续下一个
            setTimeout(cutNext, 50);
          })
          .catch((err) => {
            console.error(`切割第${index + 1}块失败:`, err);
            hasError = true;
            reject(err);
          });
      };
      
      // 开始切割
      cutNext();
    });
  },

  /**
   * 改进的单块切割方法
   */
  cutSinglePieceImproved: function(imagePath, sourceX, sourceY, pieceWidth, pieceHeight, index) {
    return new Promise((resolve, reject) => {
      try {
        // 创建新的Canvas上下文
        const ctx = wx.createCanvasContext('splitCanvas');
        
        // 清空画布
        ctx.clearRect(0, 0, pieceWidth, pieceHeight);
        
        // 绘制原图的指定部分到Canvas
        ctx.drawImage(
          imagePath,           // 原图路径
          sourceX, sourceY,    // 从原图的(sourceX, sourceY)位置开始
          pieceWidth, pieceHeight, // 截取(pieceWidth, pieceHeight)大小
          0, 0,               // 绘制到Canvas的(0,0)位置
          pieceWidth, pieceHeight  // 在Canvas上绘制(pieceWidth, pieceHeight)大小
        );
        
        // 执行绘制
        ctx.draw(false, () => {
          // 增加延迟时间确保绘制完成
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'splitCanvas',
              x: 0,
              y: 0,
              width: pieceWidth,
              height: pieceHeight,
              destWidth: pieceWidth,
              destHeight: pieceHeight,
              quality: 0.8, // 降低质量以提高成功率
              success: (res) => {
                if (res.tempFilePath) {
                  console.log(`第${index + 1}块切割成功`);
                  resolve(res.tempFilePath);
                } else {
                  reject(new Error(`第${index + 1}块: 临时文件路径为空`));
                }
              },
              fail: (err) => {
                console.error(`第${index + 1}块导出失败:`, err);
                reject(err);
              }
            });
          }, 200); // 增加延迟
        });
        
      } catch (error) {
        console.error(`第${index + 1}块切割异常:`, error);
        reject(error);
      }
    });
  },

  /**
   * 切割单个图片块
   */
  cutSinglePiece: function(ctx, imagePath, sourceX, sourceY, pieceWidth, pieceHeight, index) {
    return new Promise((resolve, reject) => {
      try {
        // 清空画布
        ctx.clearRect(0, 0, pieceWidth, pieceHeight);
        
        // 绘制原图的指定部分到Canvas
        // drawImage参数：(图片源, 源图x, 源图y, 源图宽, 源图高, 目标x, 目标y, 目标宽, 目标高)
        ctx.drawImage(
          imagePath,           // 原图路径
          sourceX, sourceY,    // 从原图的(sourceX, sourceY)位置开始
          pieceWidth, pieceHeight, // 截取(pieceWidth, pieceHeight)大小
          0, 0,               // 绘制到Canvas的(0,0)位置
          pieceWidth, pieceHeight  // 在Canvas上绘制(pieceWidth, pieceHeight)大小
        );
        
        // 执行绘制
        ctx.draw(false, () => {
          // 等待绘制完成，然后导出为临时文件
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'splitCanvas',
              x: 0,
              y: 0,
              width: pieceWidth,
              height: pieceHeight,
              destWidth: pieceWidth,
              destHeight: pieceHeight,
              quality: 0.9,
              success: (res) => {
                if (res.tempFilePath) {
                  console.log(`第${index + 1}块切割成功:`, res.tempFilePath);
                  resolve(res.tempFilePath);
                } else {
                  reject(new Error(`第${index + 1}块: 临时文件路径为空`));
                }
              },
              fail: (err) => {
                console.error(`第${index + 1}块导出失败:`, err);
                reject(err);
              }
            });
          }, 100);
        });
        
      } catch (error) {
        console.error(`第${index + 1}块切割异常:`, error);
        reject(error);
      }
    });
  },

  /**
   * 智能拼图打乱算法
   */
  shufflePuzzle: function(puzzlePieces) {
    // 通过模拟有效移动来打乱，确保有解
    const moveCount = 100; // 增加移动次数以充分打乱
    
    for (let i = 0; i < moveCount; i++) {
      // 找到空位当前索引
      let emptyIndex = -1;
      for (let j = 0; j < puzzlePieces.length; j++) {
        if (puzzlePieces[j].isEmpty) {
          emptyIndex = j;
          break;
        }
      }
      
      if (emptyIndex === -1) continue;
      
      const validMoves = this.getValidMoves(emptyIndex);
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        
        // 交换空格和随机相邻块的位置和属性
        const temp = puzzlePieces[emptyIndex];
        puzzlePieces[emptyIndex] = puzzlePieces[randomMove];
        puzzlePieces[randomMove] = temp;
        
        // 更新当前位置
        puzzlePieces[emptyIndex].currentPosition = emptyIndex;
        puzzlePieces[randomMove].currentPosition = randomMove;
      }
    }
    
    console.log('拼图打乱完成');
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
    if (this.data.isDragging) return;
    
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
    
    if (emptyIndex === -1) return;
    
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
    } else {
      // 无法移动时给出反馈
      wx.vibrateShort({
        type: 'medium'
      });
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
    
    // 检查每个拼图块是否在正确位置
    for (let i = 0; i < puzzlePieces.length; i++) {
      const piece = puzzlePieces[i];
      
      // 检查当前位置是否等于原始位置
      if (piece.currentPosition !== piece.originalPosition) {
        isWin = false;
        break;
      }
    }
    
    // 额外检查：确保最后一个是空位
    const lastPiece = puzzlePieces[puzzlePieces.length - 1];
    if (!lastPiece.isEmpty) {
      isWin = false;
    }
    
    console.log('检查游戏完成:', { isWin, lastIsEmpty: lastPiece.isEmpty });
    
    if (isWin) {
      this.handleWin();
    }
  },

  /**
   * 处理游戏胜利
   */
  handleWin: function() {
    // 停止计时
    this.stopTimer();
    
    // 显示胜利弹窗
    this.setData({ showVictory: true });
    
    // 震动反馈
    wx.vibrateShort({
      type: 'medium'
    });
  },

  /**
   * 触摸开始
   */
  touchStart: function(e) {
    const touch = e.touches[0];
    this.setData({
      touchStartPos: {
        x: touch.clientX,
        y: touch.clientY,
        index: e.currentTarget.dataset.index
      },
      isDragging: false
    });
  },

  /**
   * 触摸移动
   */
  touchMove: function(e) {
    const touch = e.touches[0];
    const startPos = this.data.touchStartPos;
    
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 10) {
      this.setData({ isDragging: true });
    }
  },

  /**
   * 触摸结束
   */
  touchEnd: function(e) {
    if (this.data.isDragging) {
      this.setData({ isDragging: false });
    }
  },

  /**
   * 开始计时
   */
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
   * 显示预览
   */
  showPreview: function() {
    this.setData({ showPreviewModal: true });
  },

  /**
   * 隐藏预览
   */
  hidePreview: function() {
    this.setData({ showPreviewModal: false });
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
   * 返回上传页面
   */
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

  /**
   * 页面卸载时清理
   */
  onUnload: function() {
    this.stopTimer();
  },

  /**
   * 分享功能
   */
  onShareAppMessage: function() {
    return {
      title: '自定义拼图游戏',
      path: '/pages/upload/upload',
      imageUrl: this.data.uploadedImage || ''
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline: function() {
    return {
      title: '正在玩自定义拼图游戏',
      query: '',
      imageUrl: this.data.uploadedImage || ''
    };
  }
});