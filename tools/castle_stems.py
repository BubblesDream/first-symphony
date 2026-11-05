"""把公會歌的 MIDI 拆成每個聲部一個 MP3，給城堡演奏室的合奏用（手動執行）。

需要（不放進專案）：
  FluidSynth   https://github.com/FluidSynth/fluidsynth/releases
  GeneralUser GS 音色庫  https://github.com/mrbumpy409/GeneralUser-GS
  ffmpeg

用法：
  python tools/castle_stems.py --fluidsynth <fluidsynth.exe> --soundfont <GeneralUser-GS.sf2>

讀 docs/素材/公會歌/guild_song_<n>.mid（第 0 軌是速度，第 1～6 軌是聲部），
輸出 assets/audio/castle/ensemble/guild_song_<n>/part<k>.mp3（k = 1～6）。
每個聲部都補靜音到整首的長度，網頁同時開始播放就會對齊。
"""
import argparse
import shutil
import struct
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / '素材' / '公會歌'
OUT = ROOT / 'assets' / 'audio' / 'castle' / 'ensemble'
SONGS = ['guild_song_1', 'guild_song_2']
BITRATE = '48k'  # 單聲道 48 kbps：一首 2 分鐘的聲部約 0.7 MB


def split_tracks(data):
    """回傳 (header 欄位, [每一軌的完整 bytes（含 MTrk 標頭）])"""
    if data[:4] != b'MThd':
        raise SystemExit('不是 MIDI 檔')
    fmt, ntr, division = struct.unpack('>HHH', data[8:14])
    tracks, pos = [], 8 + struct.unpack('>I', data[4:8])[0]
    for _ in range(ntr):
        length = struct.unpack('>I', data[pos + 4:pos + 8])[0]
        tracks.append(data[pos:pos + 8 + length])
        pos += 8 + length
    return division, tracks


def midi_with(division, tracks):
    return b'MThd' + struct.pack('>IHHH', 6, 1, len(tracks), division) + b''.join(tracks)


def render(fluidsynth, soundfont, mid, wav):
    subprocess.run([fluidsynth, '-ni', '-q', '-g', '0.8', '-r', '44100', '-F', str(wav), str(soundfont), str(mid)],
                   check=True, stdout=subprocess.DEVNULL)


def seconds(wav):
    with wave.open(str(wav)) as w:
        return w.getnframes() / w.getframerate()


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--fluidsynth', required=True)
    parser.add_argument('--soundfont', required=True)
    parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg') or 'ffmpeg')
    parser.add_argument('--mix', metavar='DIR', help='另外把整首合起來的試聽檔輸出到這個資料夾（不放網站）')
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for song in SONGS:
            division, tracks = split_tracks((SRC / f'{song}.mid').read_bytes())
            parts = tracks[1:]
            full = tmp / f'{song}_full.wav'
            (tmp / f'{song}_full.mid').write_bytes(midi_with(division, tracks))
            render(args.fluidsynth, args.soundfont, tmp / f'{song}_full.mid', full)
            total = max(seconds(full), 1)
            out_dir = OUT / song
            out_dir.mkdir(parents=True, exist_ok=True)
            for k, track in enumerate(parts, start=1):
                mid = tmp / f'{song}_p{k}.mid'
                wav = tmp / f'{song}_p{k}.wav'
                mid.write_bytes(midi_with(division, [tracks[0], track]))
                render(args.fluidsynth, args.soundfont, mid, wav)
                mp3 = out_dir / f'part{k}.mp3'
                subprocess.run([args.ffmpeg, '-y', '-loglevel', 'error', '-i', str(wav),
                                '-af', 'apad', '-t', f'{total:.3f}', '-ac', '1', '-b:a', BITRATE, str(mp3)], check=True)
                print(f'{song} part{k}: {mp3.stat().st_size // 1024} KB')
            if args.mix:
                subprocess.run([args.ffmpeg, '-y', '-loglevel', 'error', '-i', str(full), '-b:a', '128k',
                                str(Path(args.mix) / f'{song}_mix.mp3')], check=True)
            print(f'{song}: {total:.1f} 秒，{len(parts)} 個聲部')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
