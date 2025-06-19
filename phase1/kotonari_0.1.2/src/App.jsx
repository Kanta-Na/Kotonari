import React, { useState, useRef, useEffect } from 'react';
import WavEncoder from 'wav-encoder';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('初期化中...');
  const [savedFiles, setSavedFiles] = useState([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(300000); // デフォルト5分
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const isRecordingRef = useRef(false); // 状態の参照用

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
      if (isRecordingRef.current) {
        stopRecording();
        setTimeout(() => startAutoRecording(intervalMs), 1000);
      }
    });

    // アプリ終了前の録音停止シグナルを受信
    window.electronAPI.onStopRecordingBeforeQuit(() => {
      stopRecording(true);
    });

    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      isRecordingRef.current = false;
    };
  }, []); // 依存配列を空にする

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
      
      // AudioContextを初期化
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // 録音フラグを設定
      isRecordingRef.current = true;
      setIsRecording(true);
      
      // 定期的な録音サイクルを開始
      startRecordingCycle(intervalMs);
      
      const intervalSeconds = Math.floor(intervalMs / 1000);
      setStatus(`自動録音中（${intervalSeconds}秒ごとに保存）`);
      window.electronAPI.updateRecordingStatus(`自動録音中（${intervalSeconds}秒間隔）`);
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus(`エラー: ${error.message}`);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const startRecordingCycle = (intervalMs) => {
    if (!isRecordingRef.current) return;
    
    // 新しいMediaRecorderインスタンスを作成
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'audio/webm'
    });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // 録音データを保存
      if (chunksRef.current.length > 0) {
        await saveCurrentRecording();
      }
      
      // 録音継続中なら次のサイクルを開始
      if (isRecordingRef.current) {
        startRecordingCycle(intervalMs);
      }
    };

    // 録音開始（タイムスライスを設定して定期的にデータを取得）
    mediaRecorder.start(1000); // 1秒ごとにデータを取得
    
    // 指定時間後に停止
    recordingTimerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, intervalMs);
  };

  const saveCurrentRecording = async () => {
    if (chunksRef.current.length === 0) return;

    try {
      // WebM BlobをArrayBufferに変換
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      
      // AudioContextでデコード
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      // WAVエンコード用のデータを準備
      const numberOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const channelData = [];
      
      for (let i = 0; i < numberOfChannels; i++) {
        channelData.push(audioBuffer.getChannelData(i));
      }
      
      // WAVにエンコード
      const wavBuffer = await WavEncoder.encode({
        sampleRate: sampleRate,
        channelData: channelData
      });
      
      // 保存
      const result = await window.electronAPI.saveAudio(wavBuffer);
      
      if (result.success) {
        setSavedFiles((prev) => [...prev.slice(-4), result.filename]); // 最新5件を保持
        setStatus(`自動保存完了: ${result.filename}`);
      } else {
        setStatus(`保存エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setStatus(`処理エラー: ${error.message}`);
    }
  };

  const stopRecording = async (isFinal = false) => {
    if (isRecordingRef.current) {
      try {
        // 録音フラグを即座にfalseに設定
        isRecordingRef.current = false;
        
        // タイマーをクリア
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        // 録音停止
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        
        // 少し待ってから後処理
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ストリームをクリーンアップ
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // AudioContextをクローズ
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        setIsRecording(false);
        setStatus(isFinal ? '録音を完全に停止しました' : '録音を停止しました');
        window.electronAPI.updateRecordingStatus('停止');
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
      <p style={styles.subtitle}>Phase1-3（自動音声録音）</p>
      
      <div style={styles.statusCard}>
        <div style={styles.statusHeader}>
          <span style={styles.statusLabel}>ステータス:</span>
          <span style={styles.statusText}>{status}</span>
        </div>
        
        {isRecording && (
          <div style={styles.recordingInfo}>
            <div style={styles.recordingIndicator} />
            <span style={styles.durationText}>
              録音時間: {formatDuration(recordingDuration)} / {formatInterval(recordingInterval)}
            </span>
          </div>
        )}
        
        <div style={styles.intervalInfo}>
          <span style={styles.intervalLabel}>録音間隔:</span>
          <span style={styles.intervalValue}>{formatInterval(recordingInterval)}</span>
        </div>
      </div>
      
      {savedFiles.length > 0 && (
        <div style={styles.filesCard}>
          <h3 style={styles.filesTitle}>保存された録音ファイル:</h3>
          <ul style={styles.filesList}>
            {savedFiles.map((file, index) => (
              <li key={index} style={styles.fileItem}>{file}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={styles.hint}>
        <p style={styles.hintText}>
          録音間隔はrecording-config.jsonで変更できます。
          トレイメニューから「録音間隔を更新」で反映されます。
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