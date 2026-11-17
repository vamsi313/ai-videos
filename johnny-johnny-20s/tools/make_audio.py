"""Builds all audio for the 20 s Johnny Johnny test:
voices (SAPI + pitch shift via Remotion's bundled ffmpeg), original music, SFX,
lip-sync envelopes and caption timings. Outputs go to public/audio and src/."""
import json, os, subprocess, wave, glob
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "audio", "raw_tts")
VOICE = os.path.join(ROOT, "public", "audio", "voice")
AUD = os.path.join(ROOT, "public", "audio")
SR = 44100
DUR = 20.0
FPS = 30
N = int(SR * DUR)
FFMPEG = glob.glob(os.path.join(ROOT, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe"))[0]
for d in (RAW, VOICE):
    os.makedirs(d, exist_ok=True)

# id, character, start, slot (max seconds), pitch factor, caption
LINES = [
    ("l1", "papa", 8.00, 1.05, 1.0, "Johnny, Johnny?"),
    ("l2", "johnny", 9.15, 1.2, 1.0, "Yes, Papa!"),
    ("l3", "papa", 10.35, 1.15, 1.0, "Eating sugar?"),
    ("l4", "johnny", 11.65, 1.2, 1.0, "No, Papa!"),
    ("l5", "papa", 12.85, 1.10, 1.0, "Telling lies?"),
    ("l6", "johnny", 14.05, 0.95, 1.0, "No, Papa!"),
    ("l7", "papa", 15.05, 1.25, 1.0, "Open your mouth!"),
    ("l8", "papa", 17.45, 1.60, 1.0, "Ha ha ha ha!"),
    ("l9", "johnny", 17.65, 1.55, 1.0, "Hee hee hee!"),
]


def read_wav(p):
    with wave.open(p) as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    if ch > 1:
        a = a.reshape(-1, ch).mean(1)
    return sr, a


def write_wav(p, a):
    a = np.clip(a, -1, 1)
    with wave.open(p, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((a * 32767).astype(np.int16).tobytes())


# ---------------------------------------------------------------- voices
subprocess.run(["python", os.path.join(ROOT, "tools", "tts_neural.py"), RAW, FFMPEG], check=True)

papa_track = np.zeros(N, np.float32)
johnny_track = np.zeros(N, np.float32)
captions = []
for lid, who, start, slot, pitch, text in LINES:
    sr, a = read_wav(os.path.join(RAW, lid + ".wav"))
    # trim silence
    idx = np.where(np.abs(a) > 0.006)[0]
    a = a[idx[0]:idx[-1] + 1]
    tmp = os.path.join(RAW, lid + "_t.wav")
    write_raw = wave.open(tmp, "wb"); write_raw.setnchannels(1); write_raw.setsampwidth(2); write_raw.setframerate(sr)
    write_raw.writeframes((a * 32767).astype(np.int16).tobytes()); write_raw.close()
    out = os.path.join(VOICE, lid + ".wav")
    dur = len(a) / sr / pitch * pitch  # pitch shift keeps tempo
    tempo = max(1.0, dur / slot)
    tempo = min(tempo, 1.35)
    filt = f"asetrate={int(sr * pitch)},aresample={SR},atempo={1 / pitch:.5f}"
    if tempo > 1.01:
        filt += f",atempo={tempo:.4f}"
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", tmp, "-af", filt, "-ar", str(SR), "-ac", "1",
                    "-c:a", "pcm_s16le", out], check=True)
    _, v = read_wav(out)
    v = v / (np.abs(v).max() + 1e-9) * 0.85
    if lid in ("l8", "l9"):  # extend the laugh with a second burst
        v = np.concatenate([v, np.zeros(int(0.1 * SR), np.float32), v * 0.9])
    s0 = int(start * SR)
    v = v[: N - s0]
    (papa_track if who == "papa" else johnny_track)[s0:s0 + len(v)] += v
    captions.append({"id": lid, "who": who, "text": text, "start": round(start, 3), "end": round(start + len(v) / SR, 3)})
    print(lid, who, f"{len(v) / SR:.2f}s", "start", start, "tempo", round(tempo, 2))


# ---------------------------------------------------------------- lipsync
def lip_env(track):
    win = int(SR / FPS)
    out = []
    for f in range(int(DUR * FPS)):
        c = int((f + 0.5) / FPS * SR)
        seg = track[max(0, c - win // 2): c + win // 2]
        out.append(float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0)
    r = np.array(out)
    ref = np.percentile(r[r > 0.01], 85) if (r > 0.01).any() else 1
    o = np.clip(r / ref, 0, 1) ** 0.75
    o[r < 0.012] = 0
    o = np.convolve(o, [0.25, 0.5, 0.25], mode="same")
    return [round(float(x), 3) for x in o]


lip = {"papa": lip_env(papa_track), "johnny": lip_env(johnny_track)}
json.dump(lip, open(os.path.join(ROOT, "src", "lipsync.json"), "w"))
json.dump(captions, open(os.path.join(ROOT, "src", "captions.json"), "w"), indent=1)

# ---------------------------------------------------------------- synth helpers
rng = np.random.default_rng(7)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def place(buf, t0, sig, gain=1.0):
    s = int(t0 * SR)
    if s >= len(buf):
        return
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[: e - s] * gain


def env_ad(t, a=0.004, d=6.0):
    return np.minimum(1, t / a) * np.exp(-t * d)


def pluck(f, d=0.5):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 14) + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 20)
    return s * env_ad(t, 0.003, 7.0) * 0.5


def glock(f, d=0.9):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 16)
    return s * env_ad(t, 0.002, 4.0) * 0.45


def bass(f, d=0.4):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * env_ad(t, 0.006, 5.5) * 0.9


def kick(d=0.18):
    t = tt(d)
    f = 50 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 20) * 0.8


def shaker(d=0.07):
    t = tt(d)
    n = np.diff(rng.standard_normal(len(t) + 1))
    return n * np.exp(-t * 55) * 0.25


def stab(freqs, d=0.35, harm=6):
    t = tt(d)
    s = np.zeros_like(t)
    for f in freqs:
        for h in range(1, harm + 1):
            s += np.sin(2 * np.pi * f * h * t) / h
    return s * env_ad(t, 0.005, 7) * 0.22


def lowpass(x, a):
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


def whoosh(d=0.5, up=True):
    t = tt(d)
    n = rng.standard_normal(len(t))
    sweep = np.sin(np.pi * t / d) ** 2
    a = (0.02 + 0.3 * sweep) if up else (0.3 * sweep + 0.02)
    y = np.zeros_like(n); acc = 0.0
    for i in range(len(n)):
        acc += a[i] * (n[i] - acc); y[i] = acc
    return y * sweep * 1.8


def glide(f0, f1, d, decay=3.0, vib=0.0):
    t = tt(d)
    f = f0 + (f1 - f0) * (t / d)
    ph = 2 * np.pi * np.cumsum(f + vib * np.sin(2 * np.pi * 7 * t) * f * 0.02) / SR
    return np.sin(ph) * np.minimum(1, t / 0.01) * np.exp(-t * decay)


def tick(f=1100, d=0.06):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 70) * 0.7


def thud(d=0.12):
    t = tt(d)
    return (np.sin(2 * np.pi * 85 * t) * np.exp(-t * 35) + 0.25 * np.diff(rng.standard_normal(len(t) + 1)) * np.exp(-t * 80)) * 0.8


def crunch():
    out = np.zeros(int(0.22 * SR))
    for k in range(3):
        t = tt(0.05)
        out[int(k * 0.06 * SR): int(k * 0.06 * SR) + len(t)] += rng.standard_normal(len(t)) * np.exp(-t * 90) * 0.6
    return out


def gulp():
    return glide(320, 110, 0.22, 9.0) * 0.8 + np.concatenate([rng.standard_normal(200) * 0.08, np.zeros(int(0.22 * SR) - 200)])


def creak(d=0.6):
    t = tt(d)
    f = 180 + 120 * np.sin(np.pi * t / d) + 18 * np.sin(2 * np.pi * 11 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(ph * h) / h for h in range(1, 7))
    return s * np.sin(np.pi * t / d) * 0.18


def whistle(f0, f1, d):
    t = tt(d)
    f = f0 + (f1 - f0) * (t / d) + 25 * np.sin(2 * np.pi * 6 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.5 * 0.35


# ---------------------------------------------------------------- music
music = np.zeros(N, np.float32)
B = 0.5  # beat = 0.5 s (120 bpm)
bt = lambda b: b * B

# A: sneaky (0-4 s)
for b in range(0, 8):
    place(music, bt(b), bass(midi(48 if b % 2 == 0 else 55), 0.18), 0.55)
for b, m in zip([1.5, 3.5, 5.5, 7.5, 6.5], [76, 74, 76, 79, 72]):
    place(music, bt(b), glock(midi(m), 0.5), 0.35)
for b in np.arange(0.5, 8, 1):
    place(music, bt(b), shaker(), 0.5)
# B: Papa arrives (4-8 s)
for k, b in enumerate(np.arange(8, 16, 1)):
    place(music, bt(b), bass(midi([45, 45, 43, 43, 45, 40, 38, 38][k]), 0.35), 0.8)
for b in np.arange(8.5, 12, 1):
    place(music, bt(b), pluck(midi(57), 0.25), 0.4)
place(music, bt(12), stab([midi(54), midi(60), midi(66)], 0.5), 1.0)   # surprise stinger at 6.0 s
place(music, bt(12.75), stab([midi(53), midi(59), midi(65)], 0.55), 0.8)
for b in np.arange(14, 16, 0.5):
    place(music, bt(b), shaker(), 0.5)
# C: dialogue oom-pah (8-16 s)
chords = {"C": ([48, 36], [60, 64, 67]), "F": ([53, 41], [60, 65, 69]), "G": ([55, 43], [59, 62, 67])}
prog = ["C", "F", "G", "C"]
for bar, ch in enumerate(prog):
    root, triad = chords[ch]
    b0 = 16 + bar * 4
    place(music, bt(b0), bass(midi(root[1]), 0.4), 0.9)
    place(music, bt(b0 + 2), bass(midi(root[0] - 12 + 12), 0.4), 0.7)
    for off in (1, 3):
        place(music, bt(b0 + off), pluck(midi(triad[0]), 0.28), 0.45)
        place(music, bt(b0 + off), pluck(midi(triad[1]), 0.28), 0.4)
        place(music, bt(b0 + off), pluck(midi(triad[2]), 0.28), 0.4)
    for off in (0.5, 1.5, 2.5, 3.5):
        place(music, bt(b0 + off), shaker(), 0.5)
    place(music, bt(b0), kick(), 0.6)
    place(music, bt(b0 + 2), kick(), 0.5)
# D: tension + laughing hook (16-19 s)
for b in range(32, 36):
    place(music, bt(b), bass(midi(43 if b % 2 == 0 else 38), 0.3), 0.6)
place(music, bt(33.7), glock(midi(88), 1.0), 0.8)   # reveal ding ~16.85 s
hook = [(34.8, 76), (35.3, 79), (35.8, 81), (36.3, 79), (36.8, 76), (37.3, 79), (37.8, 84)]
for b, m in hook:
    place(music, bt(b), glock(midi(m), 0.6), 0.7)
for b in np.arange(34.8, 38, 1):
    place(music, bt(b), bass(midi(48 if int(b) % 2 else 43), 0.3), 0.8)
    place(music, bt(b + 0.5), pluck(midi(64), 0.2), 0.4)
for b in np.arange(34.8, 38, 0.5):
    place(music, bt(b), shaker(), 0.5)
# E: final accent at 19.0 s
for k, m in enumerate([60, 64, 67, 72, 76]):
    place(music, 19.0 + k * 0.06, glock(midi(m), 1.0), 0.8)
place(music, 19.0, stab([midi(48), midi(52), midi(55), midi(60)], 0.9, 8), 0.9)
place(music, 19.0, bass(midi(36), 0.9), 1.0)
place(music, 19.0, kick(), 0.8)
t = tt(0.9); place(music, 19.0, rng.standard_normal(len(t)) * np.exp(-t * 6) * 0.12, 1.0)

# ---------------------------------------------------------------- sfx
sfx = np.zeros(N, np.float32)
ch = json.load(open(os.path.join(ROOT, "src", "choreo.json")))


def smooth_x(keys, t):
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            u = (t - t0) / (t1 - t0); u = u * u * (3 - 2 * u)
            return v0 + (v1 - v0) * u
    return keys[-1][1]


def footfalls(keys, stride, scale, t_from, t_to, snd, gain):
    step = 2 * stride * scale
    ts = np.arange(t_from, t_to, 1 / 120)
    xs = np.array([smooth_x(keys, t) for t in ts])
    dist = np.abs(xs - xs[0])
    n_prev = 0
    for t, d in zip(ts, dist):
        n = int(d // step)
        if n > n_prev:
            place(sfx, t, snd(), gain); n_prev = n


footfalls(ch["johnnyX"], ch["johnnyStride"], ch["johnnyScale"], 0.0, 2.95, lambda: tick(1250), 0.5)
footfalls(ch["papaX"], ch["papaStride"], ch["papaScale"], 4.0, 6.05, thud, 0.8)
footfalls(ch["papaX"], ch["papaStride"], ch["papaScale"], 14.9, 15.95, thud, 0.8)
place(sfx, 3.7, creak(0.6), 1.0)                 # door
place(sfx, 3.28, whoosh(0.18), 0.35)              # scoop
for tm in (3.95, 4.75, 5.55):
    place(sfx, tm, crunch(), 0.6)
for tm in (4.5, 5.3):
    place(sfx, tm - 0.1, whoosh(0.15), 0.3)
place(sfx, 6.02, glide(500, 1400, 0.2, 5.0), 0.7)  # Papa gasp / "!"
place(sfx, 6.3, gulp(), 0.7)                       # Johnny gulp
place(sfx, 6.0, glide(900, 300, 0.45, 5.0, 1.0), 0.35)
for k, (a, b2) in enumerate([(1500, 1900), (1700, 1350), (1600, 2000)]):
    place(sfx, 6.85 + k * 0.38, whistle(a, b2, 0.32), 0.9)   # innocent whistle
place(sfx, 11.65, glide(300, 420, 0.1, 12), 0.15)
place(sfx, 14.0, glide(900, 400, 0.12, 12), 0.2)
place(sfx, 16.2, gulp(), 0.8)
place(sfx, 16.5, glide(260, 520, 0.25, 6.0, 2.0), 0.35)  # mouth opening boing
place(sfx, 17.3, glide(300, 900, 0.3, 5.0, 1.0), 0.3)
for tm, up in ((4.0, True), (8.0, True), (16.3, True), (17.75, False), (18.9, True)):
    place(sfx, tm - 0.2, whoosh(0.4, up), 0.35)
for k in range(8):
    place(sfx, 19.05 + k * 0.07, glide(2000 + 400 * k, 3200 + 300 * k, 0.12, 25), 0.18)
for tm in (17.55, 17.85, 18.15, 18.45, 18.75):
    place(sfx, tm, glide(260, 460, 0.1, 18), 0.14)

# ---------------------------------------------------------------- duck + mix
voice_sum = np.abs(papa_track) + np.abs(johnny_track)
win = int(0.12 * SR)
voice_env = np.convolve(voice_sum, np.ones(win) / win, mode="same")
duck = np.clip(1 - 0.5 * np.clip(voice_env / 0.12, 0, 1), 0.45, 1)
duck = np.convolve(duck, np.ones(int(0.15 * SR)) / int(0.15 * SR), mode="same")
music_d = music * duck

mix = papa_track * 1.0 + johnny_track * 1.0 + music_d * 0.55 + sfx * 0.9
mix = np.tanh(mix * 1.1)
mix = mix / np.abs(mix).max() * 0.92
fade = np.ones(N); fn = int(0.12 * SR); fade[-fn:] = np.linspace(1, 0, fn)
mix *= fade

write_wav(os.path.join(AUD, "mix.wav"), mix)
write_wav(os.path.join(AUD, "music.wav"), music / np.abs(music).max() * 0.9)
write_wav(os.path.join(AUD, "sfx.wav"), sfx / np.abs(sfx).max() * 0.9)
write_wav(os.path.join(AUD, "voice_papa.wav"), papa_track)
write_wav(os.path.join(AUD, "voice_johnny.wav"), johnny_track)
print("done", len(mix) / SR, "s")
