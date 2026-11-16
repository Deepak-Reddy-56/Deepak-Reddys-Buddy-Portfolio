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
      # Pace is set here, at the source (the site plays recordings at 1x — slowing
      # audio in the browser stretches it and makes the voice sound robotic):
      #   --rate        intro lines ("Hey, I'm Buddy!")      default 0.9
      #   --joke-rate   jokes, Deepak lines, quips          default 0.8
      # Real pauses (SSML <break>) are put after sentences and commas.
      # Each line is then measured and re-generated until it lands near a natural
      # pace (--target-wpm, default 150 words per minute; 0 turns this off).

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
parser.add_argument('--rate', type=float, default=0.9, help='speaking rate for the intro lines')
parser.add_argument('--joke-rate', type=float, default=0.8, help='speaking rate for jokes, Deepak lines and quips')
parser.add_argument('--pause', type=int, default=420, help='ms of silence after a sentence (commas get a third)')
parser.add_argument('--model', default='simba-3.5', help='speechify model id')
parser.add_argument('--models', default=str(Path(__file__).resolve().parent), help='kokoro model folder')
parser.add_argument('--only', nargs='*', default=None, help='regenerate only these line ids')
parser.add_argument('--preview', nargs='?', const='deepak-best', default=None,
                    help='audition one line (id or text) in several voices/rates into voice-previews/; site files untouched')
parser.add_argument('--voices', nargs='*', default=None, help='with --preview: voice ids to compare')
parser.add_argument('--rates', nargs='*', type=float, default=None, help='with --preview: rates to compare (e.g. 0.7 0.8 0.9)')
parser.add_argument('--target-wpm', type=float, default=150,
                    help='auto-pace each line to this many words per minute (natural speech ~150); 0 = use the rates as given')
parser.add_argument('--list-voices', action='store_true', help='speechify: list available English voices and exit')
args = parser.parse_args()

# A natural, easy-to-follow conversational pace is about 140-160 words per minute.
NATURAL_WPM = (130, 165)


def wpm(text: str, seconds: float) -> int:
    return round(len(text.split()) / max(seconds, 0.01) * 60)


def pace_note(value: int) -> str:
    lo, hi = NATURAL_WPM
    return 'too fast' if value > hi else 'slow' if value < lo else 'natural'


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


def rate_for(group: str) -> float:
    return args.rate if group == 'intro' else args.joke_rate


def ssml_body(text: str) -> str:
    """Escape for SSML and add real pauses after sentences (and short ones after commas)."""
    import re
    # Mark pauses on the raw text first (so escapes like &amp; aren't mistaken for punctuation).
    marked = re.sub(r'([.!?\u2026]+)\s+', '\\1 \x01 ', text)
    marked = re.sub(r'([,;:])\s+', '\\1 \x02 ', marked)
    escaped = (marked.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
               .replace('"', '&quot;').replace("'", '&apos;'))
    escaped = escaped.replace('\x01', f'<break time="{args.pause}ms"/>').replace('\x02', f'<break time="{args.pause // 3}ms"/>')
    return escaped


def speak_speechify(text: str, out: Path, group: str) -> None:
    key = os.environ.get('SPEECHIFY_API_KEY')
    if not key:
        sys.exit('Set SPEECHIFY_API_KEY first.')
    if not args.voice:
        sys.exit('Pass --voice <voice_id> (list them via GET https://api.speechify.ai/v1/voices).')
    ssml = f'<speak><prosody rate="{round(rate_for(group) * 100)}%">{ssml_body(text)}</prosody></speak>'
    body = json.dumps({'input': ssml, 'voice_id': args.voice, 'model': args.model, 'audio_format': 'mp3'}).encode()
    request = urllib.request.Request('https://api.speechify.ai/v1/audio/speech', data=body, method='POST',
                                     headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read())
    out.write_bytes(base64.b64decode(payload['audio_data']))


kokoro = None


def speak_kokoro(text: str, out: Path, group: str) -> None:
    global kokoro
    import soundfile as sf
    from kokoro_onnx import Kokoro
    if kokoro is None:
        models = Path(args.models)
        kokoro = Kokoro(str(models / 'kokoro-v1.0.onnx'), str(models / 'voices-v1.0.bin'))
    audio, sr = kokoro.create(text, voice=args.voice or 'am_puck', speed=rate_for(group), lang='en-us')
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


def speak(text: str, out: Path, group: str) -> None:
    (speak_speechify if args.provider == 'speechify' else speak_kokoro)(text, out, group)


if args.list_voices:
    key = os.environ.get('SPEECHIFY_API_KEY') or sys.exit('Set SPEECHIFY_API_KEY first.')
    request = urllib.request.Request('https://api.speechify.ai/v1/voices', headers={'Authorization': f'Bearer {key}'})
    with urllib.request.urlopen(request, timeout=60) as response:
        voices = json.loads(response.read())
    for v in voices if isinstance(voices, list) else voices.get('voices', []):
        locale = v.get('locale') or ','.join(m.get('locale', '') for m in v.get('models', [{}])[0].get('languages', []) if isinstance(m, dict))
        if 'en' not in str(locale).lower() and 'en' not in json.dumps(v).lower()[:400]:
            continue
        print(f"{v.get('id', '?'):24} {v.get('display_name', v.get('name', '')):20} {v.get('gender', ''):8} {locale}")
    sys.exit(0)

if args.preview:
    # Audition: same line, several voices and rates. Listen, pick, then generate for real.
    text = LINES[args.preview]['text'] if args.preview in LINES else args.preview
    group = LINES[args.preview]['group'] if args.preview in LINES else 'deepak'
    folder = ROOT / 'voice-previews'
    folder.mkdir(exist_ok=True)
    voices = args.voices or [args.voice]
    rates = args.rates or [rate_for(group)]
    for voice in voices:
        for rate in rates:
            args.voice, args.rate, args.joke_rate = voice, rate, rate
            out = folder / f'{voice}_{rate:.2f}.mp3'
            speak(text, out, group)
            pcm = trim(out)
            value = wpm(text, len(pcm) / SR)
            print(f'{out.name:32} {value:4d} wpm  ({pace_note(value)})')
    print(f'\nListen in {folder} — natural speech is about {NATURAL_WPM[0]}-{NATURAL_WPM[1]} words per minute.')
    sys.exit(0)

def generate_paced(text: str, mp3: Path, group: str) -> tuple[np.ndarray, float]:
    """Generate a line; with --target-wpm, re-generate at an adjusted rate until it lands near that pace.

    TTS voices read quickly; the right rate differs per voice and per line, so it is
    measured rather than guessed (at most three takes per line)."""
    rate = rate_for(group)
    target = args.target_wpm if group != 'intro' else args.target_wpm * 1.07
    for attempt in range(3):
        args.rate = args.joke_rate = rate
        speak(text, mp3, group)
        pcm = trim(mp3)
        value = wpm(text, len(pcm) / SR)
        if not args.target_wpm or abs(value - target) <= target * 0.06:
            break
        rate = min(1.3, max(0.45, rate * target / value))
    return pcm, rate


OUT.mkdir(parents=True, exist_ok=True)
base_rate, base_joke_rate = args.rate, args.joke_rate
for key, line in LINES.items():
    mp3 = OUT / f'{key}.mp3'
    if args.only and key not in args.only and mp3.exists():
        continue
    args.rate, args.joke_rate = base_rate, base_joke_rate
    pcm, used = generate_paced(line['text'], mp3, line['group'])
    value = wpm(line['text'], len(pcm) / SR)
    print(f'{key:20} {value:4d} wpm  rate {used:.2f}  ({pace_note(value)})')

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
