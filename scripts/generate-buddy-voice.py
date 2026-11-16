"""
Generate Buddy's spoken lines (and the jokes pool) from scripts/buddy-lines.json.

Writes public/buddy/voice/<id>.mp3 and src/content/buddyLines.ts: caption,
group, audio file, duration and a 60 Hz loudness envelope that drives Buddy's
mouth (also when sound is off). Edit buddy-lines.json and re-run.

Two voices, same output:

  Speechify (what Adam Perlis used for his Buddy; needs your API key from
  https://platform.speechify.ai/api-keys — never commit the key):
      set SPEECHIFY_API_KEY=sk_...            (PowerShell: $env:SPEECHIFY_API_KEY="sk_...")
      python scripts/generate-buddy-voice.py --provider speechify --voice <voice_id>
      # list voices: curl -H "Authorization: Bearer %SPEECHIFY_API_KEY%" https://api.speechify.ai/v1/voices
      # Adam's notes: a flat, deadpan take, spoken "a bit faster" -> try --rate 1.1

  Kokoro (open source, Apache-2.0, offline; the default):
      pip install kokoro-onnx soundfile numpy
      # model files from https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
      python scripts/generate-buddy-voice.py --provider kokoro --models <folder with kokoro-v1.0.onnx + voices-v1.0.bin>

Needs ffmpeg: either on PATH, or simply `pip install imageio-ffmpeg` (bundles it; used automatically).
Only the listed --only ids are regenerated if given.
"""
import argparse
import base64
import json
import os
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
LINES = json.loads((ROOT / 'scripts' / 'buddy-lines.json').read_text(encoding='utf-8'))
OUT = ROOT / 'public' / 'buddy' / 'voice'
TS = ROOT / 'src' / 'content' / 'buddyLines.ts'
SR = 24000

parser = argparse.ArgumentParser()
parser.add_argument('--provider', choices=['kokoro', 'speechify'], default='kokoro')
parser.add_argument('--voice', default=None, help='kokoro: am_puck (default); speechify: a voice_id from /v1/voices')
parser.add_argument('--rate', type=float, default=1.1, help='speaking rate (Adam: "a bit faster")')
parser.add_argument('--model', default='simba-3.5', help='speechify model id')
parser.add_argument('--models', default=str(Path(__file__).resolve().parent), help='kokoro model folder')
parser.add_argument('--only', nargs='*', default=None, help='regenerate only these line ids')
args = parser.parse_args()


def find_ffmpeg() -> str:
    found = shutil.which('ffmpeg')
    if found:
        return found
    try:
        import imageio_ffmpeg  # pip install imageio-ffmpeg (ships an ffmpeg binary)
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit('ffmpeg not found. Run:  pip install imageio-ffmpeg   (or install ffmpeg and add it to PATH)')


FFMPEG = find_ffmpeg()


def decode_to_pcm(mp3: Path) -> np.ndarray:
    raw = subprocess.run([FFMPEG, '-loglevel', 'error', '-i', str(mp3), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def speak_speechify(text: str, out: Path) -> None:
    key = os.environ.get('SPEECHIFY_API_KEY')
    if not key:
        sys.exit('Set SPEECHIFY_API_KEY first.')
    if not args.voice:
        sys.exit('Pass --voice <voice_id> (list them via GET https://api.speechify.ai/v1/voices).')
    ssml = f'<speak><prosody rate="{round(args.rate * 100)}%">{text}</prosody></speak>'
    body = json.dumps({'input': ssml, 'voice_id': args.voice, 'model': args.model, 'audio_format': 'mp3'}).encode()
    request = urllib.request.Request('https://api.speechify.ai/v1/audio/speech', data=body, method='POST',
                                     headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read())
    out.write_bytes(base64.b64decode(payload['audio_data']))


kokoro = None


def speak_kokoro(text: str, out: Path) -> None:
    global kokoro
    import soundfile as sf
    from kokoro_onnx import Kokoro
    if kokoro is None:
        models = Path(args.models)
        kokoro = Kokoro(str(models / 'kokoro-v1.0.onnx'), str(models / 'voices-v1.0.bin'))
    audio, sr = kokoro.create(text, voice=args.voice or 'am_puck', speed=args.rate, lang='en-us')
    wav = out.with_suffix('.wav')
    sf.write(wav, np.asarray(audio, dtype=np.float32), sr)
    subprocess.run([FFMPEG, '-loglevel', 'error', '-y', '-i', str(wav), '-ac', '1', '-b:a', '64k', str(out)], check=True)
    wav.unlink()


def trim(mp3: Path) -> np.ndarray:
    """Trim silence (re-encoding the MP3) and return the trimmed PCM."""
    pcm = decode_to_pcm(mp3)
    voiced = np.where(np.abs(pcm) > 0.01)[0]
    start = max(0, voiced[0] - int(0.03 * SR))
    end = min(len(pcm), voiced[-1] + int(0.12 * SR))
    trimmed = pcm[start:end]
    tmp = mp3.with_suffix('.trim.mp3')
    subprocess.run([FFMPEG, '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '64k', str(tmp)],
                   input=(trimmed * 32767).astype(np.int16).tobytes(), check=True)
    tmp.replace(mp3)
    return trimmed


OUT.mkdir(parents=True, exist_ok=True)
for key, line in LINES.items():
    mp3 = OUT / f'{key}.mp3'
    if args.only and key not in args.only and mp3.exists():
        continue
    (speak_speechify if args.provider == 'speechify' else speak_kokoro)(line['text'], mp3)
    trim(mp3)
    print(key, 'ok')

# Rebuild the TypeScript index from every MP3 (so a partial --only run stays consistent).
entries = []
for key, line in LINES.items():
    pcm = decode_to_pcm(OUT / f'{key}.mp3')
    hop = SR // 60
    env = [float(np.sqrt(np.mean(pcm[i:i + hop] ** 2))) for i in range(0, len(pcm), hop)]
    peak = max(env) or 1.0
    envelope = [round(min(1.0, e / peak * 1.15), 2) for e in env]
    entries.append(
        f"  {json.dumps(key)}: {{ id: {json.dumps(key)}, group: {json.dumps(line['group'])}, text: {json.dumps(line['text'])}, "
        f"caption: {json.dumps(line['caption'], ensure_ascii=False)}, src: '/buddy/voice/{key}.mp3', "
        f"duration: {round(len(pcm) / SR, 3)}, envelope: {json.dumps(envelope)} }},"
    )

TS.write_text(
    f'// Generated by scripts/generate-buddy-voice.py ({args.provider}). Do not edit by hand; edit scripts/buddy-lines.json.\n'
    '// Each line: caption, group, audio file, duration (s) and a 60 Hz loudness envelope for the mouth.\n'
    'export type BuddyLine = {\n'
    '  id: string;\n  group: string;\n  text: string;\n  caption: { lead: string; rest?: string };\n'
    '  src: string;\n  duration: number;\n  envelope: readonly number[];\n};\n\n'
    'export const buddyLines: Record<string, BuddyLine> = {\n' + '\n'.join(entries) + '\n};\n',
    encoding='utf-8',
)
print('wrote', TS.relative_to(ROOT))
