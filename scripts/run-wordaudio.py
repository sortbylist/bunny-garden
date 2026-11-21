import json
import os
from pathlib import Path
import runpy
import shutil
import sys
from tempfile import NamedTemporaryFile, TemporaryDirectory


source = Path(sys.argv[1]).resolve(strict=True)
output = Path(sys.argv[2]).resolve()
recordings = {clip["id"]: clip["text"] for clip in json.load(sys.stdin)}
generate = runpy.run_path(str(source))["words_to_speech"]
synthesizer = generate.__globals__["gTTS"]


def synthesize(text, lang):
    return synthesizer(text=recordings[text], lang=lang, tld="co.uk", timeout=(10, 20))


generate.__globals__["gTTS"] = synthesize
output.mkdir(parents=True, exist_ok=True)
missing = []
with TemporaryDirectory(prefix="wordaudio-", dir=output.parent) as workspace:
    original_directory = Path.cwd()
    try:
        os.chdir(workspace)
        Path("ArrayWords.txt").write_text(json.dumps(list(recordings)), encoding="ascii")
        generate()
    finally:
        os.chdir(original_directory)
    for clip_id in recordings:
        audio_file = Path(workspace) / "audio" / f"{clip_id}.mp3"
        if audio_file.exists() and audio_file.stat().st_size > 100:
            with NamedTemporaryFile(dir=output, delete=False) as pending:
                with audio_file.open("rb") as recorded:
                    shutil.copyfileobj(recorded, pending)
            pending_path = Path(pending.name)
            try:
                pending_path.replace(output / audio_file.name)
            finally:
                pending_path.unlink(missing_ok=True)
        else:
            missing.append(clip_id)

if missing:
    sys.exit(f"Missing audio: {', '.join(missing)}")
print(f"Generated {len(recordings)} MP3 files from {source}.")
