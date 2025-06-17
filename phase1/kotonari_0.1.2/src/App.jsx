<<<<<<< HEAD

import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [savedFiles, setSavedFiles] = useState([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(300000); // デフォルト5分
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // 自動録音開始のシグナルを受信（録音間隔も含む）
    window.electronAPI.onAutoStartRecording((event, intervalMs) => {
      setRecordingInterval(intervalMs);
      startAutoRecording(intervalMs);
    });

    // 録音間隔の更新を受信
    window.electronAPI.onUpdateRecordingInterval((event, intervalMs) => {
      setRecordingInterval(intervalMs);
      // 録音中の場合は再起動
      if (isRecording) {
        stopAndSaveRecording();
        setTimeout(() => startAutoRecording(intervalMs), 1000);
      }
    });

    // アプリ終了前の録音停止シグナルを受信
    window.electronAPI.onStopRecordingBeforeQuit(() => {
      stopAndSaveRecording(true);
    });

    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    // 録音時間のカウンター
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setRecordingDuration(0);
    }
  }, [isRecording]);

  const startAutoRecording = async (intervalMs) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // 指定時間ごとの自動保存
          if (chunksRef.current.length > 0 && event.type === 'dataavailable') {
            await saveCurrentRecording();
            chunksRef.current = []; // チャンクをリセット
          }
        }
      };

      // 指定された間隔でdataavailableイベントを発火
      mediaRecorder.start(intervalMs);
      
      setIsRecording(true);
      const intervalSeconds = Math.floor(intervalMs / 1000);
      setStatus(`Auto recording (save every ${intervalSeconds} seconds)`);
      window.electronAPI.updateRecordingStatus(`Auto recording (${intervalSeconds}s interval)`);
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const saveCurrentRecording = async () => {
    if (chunksRef.current.length === 0) return;

    const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
    const arrayBuffer = await blob.arrayBuffer();
    
    const result = await window.electronAPI.saveAudio(arrayBuffer);
    
    if (result.success) {
      setSavedFiles((prev) => [...prev.slice(-4), result.filename]); // 最新5件を保持
      setStatus(`Auto saved: ${result.filename}`);
    } else {
      setStatus(`Save error: ${result.error}`);
    }
  };

  const stopAndSaveRecording = async (isFinal = false) => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // 録音停止
        mediaRecorderRef.current.stop();
        
        // 最後のチャンクを保存（少し待つ）
        await new Promise(resolve => {
          setTimeout(async () => {
            if (chunksRef.current.length > 0) {
              await saveCurrentRecording();
            }
            resolve();
          }, 500);
        });
        
        // ストリームをクリーンアップ
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        setIsRecording(false);
        setStatus(isFinal ? 'Recording completely stopped' : 'Recording stopped');
        window.electronAPI.updateRecordingStatus('Stopped');
        
        // 最終保存の場合、メインプロセスに通知
        if (isFinal) {
          window.electronAPI.notifyFinalSaveCompleted();
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatInterval = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Kotonari</h1>
      <p style={styles.subtitle}>Auto Voice Recording System</p>
      
      <div style={styles.statusCard}>
        <div style={styles.statusHeader}>
          <span style={styles.statusLabel}>Status:</span>
          <span style={styles.statusText}>{status}</span>
        </div>
        
        {isRecording && (
          <div style={styles.recordingInfo}>
            <div style={styles.recordingIndicator} />
            <span style={styles.durationText}>
              Recording time: {formatDuration(recordingDuration)} / {formatInterval(recordingInterval)}
            </span>
          </div>
        )}
        
        <div style={styles.intervalInfo}>
          <span style={styles.intervalLabel}>Recording interval:</span>
          <span style={styles.intervalValue}>{formatInterval(recordingInterval)}</span>
        </div>
      </div>
      
      {savedFiles.length > 0 && (
        <div style={styles.filesCard}>
          <h3 style={styles.filesTitle}>Recent saved files:</h3>
          <ul style={styles.filesList}>
            {savedFiles.map((file, index) => (
              <li key={index} style={styles.fileItem}>{file}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={styles.hint}>
        <p style={styles.hintText}>
          Recording interval can be changed in recording-config.json.
          Click "Reload Config" from tray menu to apply changes.
        </p>
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
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 32px 0',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  statusLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  statusText: {
    color: '#059669',
    fontWeight: '500',
  },
  recordingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  recordingIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#EF4444',
    animation: 'pulse 1.5s infinite',
  },
  durationText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  intervalInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  intervalLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  intervalValue: {
    fontSize: '14px',
    color: '#6366f1',
    fontWeight: '600',
  },
  filesCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  filesTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0',
  },
  filesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  fileItem: {
    fontSize: '12px',
    color: '#6b7280',
    padding: '4px 0',
  },
  hint: {
    marginTop: '24px',
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
  },
  hintText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
    textAlign: 'center',
  },
};

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
`;
document.head.appendChild(styleSheet);

export default App;
=======

import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [savedFiles, setSavedFiles] = useState([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(300000); // デフォルト5分
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // 自動録音開始のシグナルを受信（録音間隔も含む）
    window.electronAPI.onAutoStartRecording((event, intervalMs) => {
      setRecordingInterval(intervalMs);
      startAutoRecording(intervalMs);
    });

    // 録音間隔の更新を受信
    window.electronAPI.onUpdateRecordingInterval((event, intervalMs) => {
      setRecordingInterval(intervalMs);
      // 録音中の場合は再起動
      if (isRecording) {
        stopAndSaveRecording();
        setTimeout(() => startAutoRecording(intervalMs), 1000);
      }
    });

    // アプリ終了前の録音停止シグナルを受信
    window.electronAPI.onStopRecordingBeforeQuit(() => {
      stopAndSaveRecording(true);
    });

    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    // 録音時間のカウンター
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setRecordingDuration(0);
    }
  }, [isRecording]);

  const startAutoRecording = async (intervalMs) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // 指定時間ごとの自動保存
          if (chunksRef.current.length > 0 && event.type === 'dataavailable') {
            await saveCurrentRecording();
            chunksRef.current = []; // チャンクをリセット
          }
        }
      };

      // 指定された間隔でdataavailableイベントを発火
      mediaRecorder.start(intervalMs);
      
      setIsRecording(true);
      const intervalSeconds = Math.floor(intervalMs / 1000);
      setStatus(`Auto recording (save every ${intervalSeconds} seconds)`);
      window.electronAPI.updateRecordingStatus(`Auto recording (${intervalSeconds}s interval)`);
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const saveCurrentRecording = async () => {
    if (chunksRef.current.length === 0) return;

    const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
    const arrayBuffer = await blob.arrayBuffer();
    
    const result = await window.electronAPI.saveAudio(arrayBuffer);
    
    if (result.success) {
      setSavedFiles((prev) => [...prev.slice(-4), result.filename]); // 最新5件を保持
      setStatus(`Auto saved: ${result.filename}`);
    } else {
      setStatus(`Save error: ${result.error}`);
    }
  };

  const stopAndSaveRecording = async (isFinal = false) => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // 録音停止
        mediaRecorderRef.current.stop();
        
        // 最後のチャンクを保存（少し待つ）
        await new Promise(resolve => {
          setTimeout(async () => {
            if (chunksRef.current.length > 0) {
              await saveCurrentRecording();
            }
            resolve();
          }, 500);
        });
        
        // ストリームをクリーンアップ
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        setIsRecording(false);
        setStatus(isFinal ? 'Recording completely stopped' : 'Recording stopped');
        window.electronAPI.updateRecordingStatus('Stopped');
        
        // 最終保存の場合、メインプロセスに通知
        if (isFinal) {
          window.electronAPI.notifyFinalSaveCompleted();
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatInterval = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Kotonari</h1>
      <p style={styles.subtitle}>Auto Voice Recording System</p>
      
      <div style={styles.statusCard}>
        <div style={styles.statusHeader}>
          <span style={styles.statusLabel}>Status:</span>
          <span style={styles.statusText}>{status}</span>
        </div>
        
        {isRecording && (
          <div style={styles.recordingInfo}>
            <div style={styles.recordingIndicator} />
            <span style={styles.durationText}>
              Recording time: {formatDuration(recordingDuration)} / {formatInterval(recordingInterval)}
            </span>
          </div>
        )}
        
        <div style={styles.intervalInfo}>
          <span style={styles.intervalLabel}>Recording interval:</span>
          <span style={styles.intervalValue}>{formatInterval(recordingInterval)}</span>
        </div>
      </div>
      
      {savedFiles.length > 0 && (
        <div style={styles.filesCard}>
          <h3 style={styles.filesTitle}>Recent saved files:</h3>
          <ul style={styles.filesList}>
            {savedFiles.map((file, index) => (
              <li key={index} style={styles.fileItem}>{file}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={styles.hint}>
        <p style={styles.hintText}>
          Recording interval can be changed in recording-config.json.
          Click "Reload Config" from tray menu to apply changes.
        </p>
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
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 32px 0',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  statusLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  statusText: {
    color: '#059669',
    fontWeight: '500',
  },
  recordingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  recordingIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#EF4444',
    animation: 'pulse 1.5s infinite',
  },
  durationText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  intervalInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  intervalLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  intervalValue: {
    fontSize: '14px',
    color: '#6366f1',
    fontWeight: '600',
  },
  filesCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  filesTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0',
  },
  filesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  fileItem: {
    fontSize: '12px',
    color: '#6b7280',
    padding: '4px 0',
  },
  hint: {
    marginTop: '24px',
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
  },
  hintText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
    textAlign: 'center',
  },
};

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
`;
document.head.appendChild(styleSheet);

export default App;
>>>>>>> 0c12d86 (first commit from Mac)
