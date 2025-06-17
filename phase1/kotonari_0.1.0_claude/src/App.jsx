<<<<<<< HEAD

import React, { useState, useRef } from 'react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('待機中');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const duration = Date.now() - startTimeRef.current;
        
        // 1秒未満の録音はスキップ
        if (duration < 1000) {
          setStatus('録音が短すぎます（1秒未満）');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const arrayBuffer = await blob.arrayBuffer();
        
        // Electronに保存を依頼
        const result = await window.electronAPI.saveAudio(arrayBuffer);
        
        if (result.success) {
          setStatus(`保存完了: ${result.filename}`);
        } else {
          setStatus(`保存エラー: ${result.error}`);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('録音中...');
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus(`エラー: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setStatus('処理中...');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Kotonari</h1>
      <p style={styles.subtitle}>音声録音プロトタイプ</p>
      
      <div style={styles.buttonContainer}>
        {!isRecording ? (
          <button onClick={startRecording} style={styles.button}>
            録音開始
          </button>
        ) : (
          <button onClick={stopRecording} style={{ ...styles.button, ...styles.stopButton }}>
            録音停止
          </button>
        )}
      </div>
      
      <div style={styles.statusContainer}>
        <p style={styles.status}>{status}</p>
        {isRecording && <div style={styles.recordingIndicator} />}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#333',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 32px 0',
  },
  buttonContainer: {
    marginBottom: '24px',
  },
  button: {
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  statusContainer: {
    minHeight: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  status: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  recordingIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#EF4444',
    animation: 'pulse 1.5s infinite',
  },
};

// アニメーション用のスタイルを追加
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  button:active {
    transform: translateY(0);
  }
`;
document.head.appendChild(styleSheet);

export default App;
=======

import React, { useState, useRef } from 'react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('待機中');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const duration = Date.now() - startTimeRef.current;
        
        // 1秒未満の録音はスキップ
        if (duration < 1000) {
          setStatus('録音が短すぎます（1秒未満）');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const arrayBuffer = await blob.arrayBuffer();
        
        // Electronに保存を依頼
        const result = await window.electronAPI.saveAudio(arrayBuffer);
        
        if (result.success) {
          setStatus(`保存完了: ${result.filename}`);
        } else {
          setStatus(`保存エラー: ${result.error}`);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('録音中...');
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus(`エラー: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setStatus('処理中...');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Kotonari</h1>
      <p style={styles.subtitle}>音声録音プロトタイプ</p>
      
      <div style={styles.buttonContainer}>
        {!isRecording ? (
          <button onClick={startRecording} style={styles.button}>
            録音開始
          </button>
        ) : (
          <button onClick={stopRecording} style={{ ...styles.button, ...styles.stopButton }}>
            録音停止
          </button>
        )}
      </div>
      
      <div style={styles.statusContainer}>
        <p style={styles.status}>{status}</p>
        {isRecording && <div style={styles.recordingIndicator} />}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#333',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 32px 0',
  },
  buttonContainer: {
    marginBottom: '24px',
  },
  button: {
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  statusContainer: {
    minHeight: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  status: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  recordingIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#EF4444',
    animation: 'pulse 1.5s infinite',
  },
};

// アニメーション用のスタイルを追加
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  button:active {
    transform: translateY(0);
  }
`;
document.head.appendChild(styleSheet);

export default App;
>>>>>>> 0c12d86 (first commit from Mac)
