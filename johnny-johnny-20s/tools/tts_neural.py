"""Generates the raw line audio with soft female neural voices (edge-tts)."""
import asyncio, os, subprocess, sys
import edge_tts

OUT = sys.argv[1]
FFMPEG = sys.argv[2]

JOHNNY = dict(voice="en-US-AnaNeural", rate="-8%", pitch="+0Hz")
PAPA = dict(voice="en-US-JennyNeural", rate="-12%", pitch="-8Hz")

LINES = [
    ("l1", PAPA, "Johnny, Johnny?"),
    ("l2", JOHNNY, "Yes, Papa!"),
    ("l3", PAPA, "Eating sugar?"),
    ("l4", JOHNNY, "No, Papa!"),
    ("l5", PAPA, "Telling lies?"),
    ("l6", JOHNNY, "No, Papa!"),
    ("l7", PAPA, "Open your mouth!"),
    ("l8", PAPA, "Ha ha ha ha!"),
    ("l9", JOHNNY, "Hee hee hee!"),
]


async def main():
    for lid, v, text in LINES:
        mp3 = os.path.join(OUT, lid + ".mp3")
        await edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"]).save(mp3)
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", mp3, "-ar", "22050", "-ac", "1",
                        "-c:a", "pcm_s16le", os.path.join(OUT, lid + ".wav")], check=True)

asyncio.run(main())
