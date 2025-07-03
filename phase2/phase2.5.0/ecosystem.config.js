module.exports = {
  apps: [
    {
      name: "KotoLab01",
      cwd: "./KotoLab01",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "WhisperTranscriber",
      cwd: "./whisper_transcriber",
      script: "./venv/bin/python",
      args: "transcriber.py",
      interpreter: "none"
    },
    {
      name: "KotonariTranscripts",
      cwd: "./kotonari_transcripts",
      script: "./venv/bin/python",
      args: "main.py",
      interpreter: "none"
    }
  ]
};
