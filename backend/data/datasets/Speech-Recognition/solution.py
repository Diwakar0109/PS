import numpy as np
import librosa
import pandas as pd

def analyze_audio_framing(audio_path="/home/bit/Desktop/ps/ml2/backend/data/datasets/Speech-Recognition/Audio50 (1).wav", frame_ms=25, hop_ms=10, sample_rate=16000):
    # Load audio
    signal, sr = librosa.load(audio_path, sr=sample_rate)
    print(f"Audio loaded: {audio_path}")

    frame_len = int((frame_ms / 1000) * sr)   # 25 ms → samples
    hop_len = int((hop_ms / 1000) * sr)       # 10 ms → samples

    frames = []
    for start in range(0, len(signal) - frame_len + 1, hop_len):
        frame = signal[start:start + frame_len]
        frames.append(frame)

    frames_array = np.array(frames)
    print(f"Total frames generated: {len(frames_array)}")

    # Save to CSV
    df = pd.DataFrame(frames_array)
    df.to_csv("output.csv", index=False)

    return 

# Run the function
analyze_audio_framing()
