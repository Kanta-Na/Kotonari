
// React のコア機能を読み込む。
/* React     ==> JSX を使うために必須
   useState  ==> コンポーネント内で状態（変数）を持たせるため。また、状態（変数）が変更したら、UI が再度レンダリングされる。
   useRef    ==> DOM要素や録音状態などの更新はしないが再レンタリング不要な値を保持
   useEffect ==> コンポーネントの「副作用」処理（録音開始、イベントリスナー登録など） */
import React, { useState, useRef, useEffect } from 'react';


// React の関数コンポーネントの本体。アプリの UI ロジックと表示処理の中心
function App() {
  const [isRecording, setIsRecording] = useState(false);      // <-- 録音中かどうか
  const [status, setStatus] = useState('待機中');              // <-- 現在の状態
  const mediaRecorderRef = useRef(null);                      // <-- MediaRecorder オブジェクト（録音処理の中心）
  const chunksRef = useRef([]);                               // <-- 録音されたデータ（バッファ）をためておく配列
  const startTimeRef = useRef(null);

  useEffect(() => {
    // トレイからの録音開始/停止コマンドを受信
    window.electronAPI.onStartRecording(() => {
      if (!isRecording) {
        startRecording();
      }
    });

    window.electronAPI.onStopRecording(() => {
      if (isRecording) {
        stopRecording();
      }
    });
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });      // <-- Web API（標準JS）: マイクやカメラの使用許可とストリームを取得 
      const mediaRecorder = new MediaRecorder(stream);          // <-- Web API: ストリームを録音し、音声データを生成
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      // 録音データを処理する方法を登録（ondataavailable）
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // 録音が止まった時の処理を登録（onstop）
      mediaRecorder.onstop = async () => {
        const duration = Date.now() - startTimeRef.current;
        
        if (duration < 1000) {
          setStatus('録音が短すぎます（1秒未満）');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });      // <-- Web API: バイナリデータをまとめるコンテナ
        const arrayBuffer = await blob.arrayBuffer();         // <-- Web API: BlobデータをArrayBuffer(バイナリ)として取得
        
        const result = await window.electronAPI.saveAudio(arrayBuffer);
        
        if (result.success) {
          setStatus(`保存完了: ${result.filename}`);
        } else {
          setStatus(`保存エラー: ${result.error}`);
        }
      };

      // ようやく録音スタート（start）
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
      
      // 録音を停止（stop）
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());     // <-- マイクを開放（録音終了）
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
      
      <div style={styles.hint}>
        <p style={styles.hintText}>
          ヒント: ウィンドウを閉じてもアプリは動作し続けます。
          タスクトレイ/メニューバーのアイコンから操作できます。
        </p>
      </div>
    </div>
  );
}


// JS オブジェクトとして定義された、インライン CSS スタイル群
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
  },
};


// HTML の <style> タグ（<style>...</style>）を、JacaScript で直接生成
const styleSheet = document.createElement('style');

// <style>タグの中に実際の CSS を文字列で代入する 
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

// ブラウザ DOM の <head> タグの中に、<style> タグを挿入する
document.head.appendChild(styleSheet);


// 上記 App コンポーネントを外部からインポートできるようにする
export default App;
