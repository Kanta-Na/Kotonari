<<<<<<< HEAD

// WAVファイルのヘッダーを作成する関数
function createWavHeader(dataLength, sampleRate = 44100, channels = 1, bitsPerSample = 16) {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // "RIFF" chunk descriptor
    const setString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    setString(0, 'RIFF');
    view.setUint32(4, dataLength + 36, true);
    setString(8, 'WAVE');
    
    // "fmt " sub-chunk
    setString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true);
    view.setUint16(32, channels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" sub-chunk
    setString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    return buffer;
  }
  
  module.exports = { createWavHeader };
=======

// WAVファイルのヘッダーを作成する関数
function createWavHeader(dataLength, sampleRate = 44100, channels = 1, bitsPerSample = 16) {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // "RIFF" chunk descriptor
    const setString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    setString(0, 'RIFF');
    view.setUint32(4, dataLength + 36, true);
    setString(8, 'WAVE');
    
    // "fmt " sub-chunk
    setString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true);
    view.setUint16(32, channels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" sub-chunk
    setString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    return buffer;
  }
  
  module.exports = { createWavHeader };
>>>>>>> 0c12d86 (first commit from Mac)
