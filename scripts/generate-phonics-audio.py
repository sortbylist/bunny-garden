import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import runpy
import sys
import time
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor


def digest(data):
    return hashlib.sha256(data).hexdigest()


def valid_mp3(data):
    return len(data) >= 512 and (
        data[:3] == b"ID3" or data[0] == 255 and data[1] & 224 == 224
    )


def atomic_json(path, value, temporary_directory=None):
    temporary = (temporary_directory or path.parent) / f"{path.name}.{os.getpid()}.tmp"
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for attempt in range(8):
        try:
            temporary.replace(path)
            return
        except PermissionError:
            if attempt == 7:
                raise
            time.sleep(0.05 * (attempt + 1))


def british_cache(path, item):
    try:
        data = path.read_bytes()
        metadata = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
        if (
            valid_mp3(data)
            and metadata.get("locale") == "en-GB"
            and metadata.get("lang") == "en"
            and metadata.get("tld") == "co.uk"
            and metadata.get("text") == item["text"]
            and metadata.get("sha256") == digest(data)
        ):
            return data, metadata
    except (OSError, ValueError):
        pass
    return None


def prepare(args, factory=None, wait=time.sleep):
    workspace = Path(args.workspace).resolve()
    wordaudio = Path(args.wordaudio).resolve()
    output = Path(args.output).resolve()
    audio_directory = workspace / "public/audio/phonics"
    report_directory = workspace / "artifacts/phonics-gtts"
    audio_directory.mkdir(parents=True, exist_ok=True)
    report_directory.mkdir(parents=True, exist_ok=True)
    tasks = json.loads(Path(args.tasks).read_text(encoding="utf-8"))
    if tasks.get("locale") != "en-GB":
        raise ValueError("Only en-GB tasks are supported")
    items = tasks["items"]
    for item in items:
        if not re.fullmatch(r"(word-[a-z]+|story-\d+)", item["id"]) or not item["text"].strip():
            raise ValueError(f"Invalid audio task: {item}")
    if not args.offline:
        output.mkdir(parents=True, exist_ok=True)
        if factory is None:
            upstream = wordaudio / "Scripts/Audio.py"
            if not upstream.is_file():
                raise FileNotFoundError(f"WordAudio Python script not found: {upstream}")
            factory = runpy.run_path(str(upstream), run_name="wordaudio_library")["gTTS"]
    manifest_path = audio_directory / "manifest.json"
    manifest = {"version": 2, "locale": "en-GB", "provider": "gtts", "files": {}}
    if manifest_path.is_file():
        previous = json.loads(manifest_path.read_text(encoding="utf-8"))
        for identifier, entry in previous.get("files", {}).items():
            if (
                entry.get("provider") == "gtts"
                and entry.get("locale") == "en-GB"
                and entry.get("lang") == "en"
                and entry.get("tld") == "co.uk"
                and entry.get("status") == "ready"
                and entry.get("path") == f"/audio/phonics/{identifier}.mp3"
                and re.fullmatch(r"(word-[a-z]+|story-\d+)", identifier)
            ):
                path = audio_directory / f"{identifier}.mp3"
                if path.is_file():
                    data = path.read_bytes()
                    if valid_mp3(data) and digest(data) == entry.get("sha256"):
                        manifest["files"][identifier] = entry
    failures = []
    counters = {"reused": 0, "generated": 0, "unverifiedExisting": 0}
    completed = 0

    def save_progress():
        manifest["updatedAt"] = datetime.now(timezone.utc).isoformat()
        atomic_json(manifest_path, manifest, report_directory)
        atomic_json(report_directory / "result.json", {
            **counters, "selected": len(items), "completed": completed,
            "available": len(manifest["files"]), "failures": failures,
        })
        (report_directory / "failed-texts.txt").write_text(
            "".join(f'{item["text"]}\n' for item in failures), encoding="utf-8"
        )

    def synthesize(item, index):
        destination = output / f'en-gb-{item["id"]}.mp3'
        temporary = destination.with_suffix(".mp3.part")
        for attempt in range(args.retries + 1):
            try:
                print(f"[GENERATE {index}/{len(items)} attempt {attempt + 1}] {item['text']} | en / co.uk", flush=True)
                speech = factory(text=item["text"], lang="en", tld="co.uk", lang_check=False, timeout=(args.timeout, args.timeout))
                speech.save(str(temporary))
                data = temporary.read_bytes()
                if not valid_mp3(data):
                    raise ValueError("gTTS returned an invalid or truncated MP3")
                metadata = {
                    "provider": "gtts", "locale": "en-GB", "lang": "en", "tld": "co.uk",
                    "text": item["text"], "sha256": digest(data),
                    "generatedAt": datetime.now(timezone.utc).isoformat(),
                }
                temporary.replace(destination)
                atomic_json(destination.with_suffix(".json"), metadata)
                return data, metadata
            except Exception as error:
                temporary.unlink(missing_ok=True)
                print(f"[FAILED] {item['text']} attempt {attempt + 1}: {error}", flush=True)
                if attempt < args.retries:
                    wait(min(2 ** attempt, 10))
                else:
                    raise

    prepared = []
    for index, item in enumerate(items, 1):
        identifier = item["id"]
        cached = None
        existing_path = audio_directory / f"{identifier}.mp3"
        existing_entry = manifest["files"].get(identifier)
        if existing_entry and existing_entry.get("text") == item["text"]:
            cached = existing_path.read_bytes(), existing_entry
        elif existing_entry:
            del manifest["files"][identifier]
        names = [f'en-gb-{identifier}.mp3']
        if item["kind"] == "word":
            names.extend(dict.fromkeys([f'{item["text"].lower()}.mp3', f'{item["text"]}.mp3']))
        for directory in [wordaudio / "Audio", output, workspace / "scripts/audio"]:
            if cached:
                break
            for name in names:
                source = directory / name
                if source.is_file():
                    cached = british_cache(source, item)
                    if cached:
                        print(f"[CACHE {index}/{len(items)}] {item['text']} <- {source}", flush=True)
                        break
                    counters["unverifiedExisting"] += 1
        prepared.append((index, item, cached))
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        pending = {
            item["id"]: executor.submit(synthesize, item, index)
            for index, item, cached in prepared if not cached and not args.offline
        }
        for index, item, cached in prepared:
            identifier = item["id"]
            existing_path = audio_directory / f"{identifier}.mp3"
            if cached:
                data, metadata = cached
                counters["reused"] += 1
            elif args.offline:
                failures.append({**item, "reason": "No matching British MP3 cache; offline mode"})
                save_progress()
                continue
            else:
                try:
                    data, metadata = pending[identifier].result()
                    counters["generated"] += 1
                except Exception as error:
                    failures.append({**item, "reason": str(error)})
                    save_progress()
                    continue
            if not existing_path.is_file() or digest(existing_path.read_bytes()) != digest(data):
                temporary = report_directory / f"{identifier}.mp3.part"
                temporary.write_bytes(data)
                temporary.replace(existing_path)
            manifest["files"][identifier] = {
                **metadata, "provider": "gtts", "kind": item["kind"], "path": f"/audio/phonics/{identifier}.mp3",
                "status": "ready", "source": "WordAudio / Google Text-to-Speech",
            }
            completed += 1
            save_progress()
            print(f"[READY {index}/{len(items)}] {identifier}", flush=True)
    save_progress()
    print(json.dumps({**counters, "selected": len(items), "completed": completed, "available": len(manifest["files"]), "failed": len(failures)}), flush=True)
    return 1 if failures else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--wordaudio", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--tasks", required=True)
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()
    if not 0 <= args.retries <= 5 or not 1 <= args.timeout <= 120 or not 1 <= args.workers <= 4:
        parser.error("retries must be 0..5, timeout 1..120 seconds and workers 1..4")
    return prepare(args)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, ImportError) as error:
        print(f"Audio preparation failed: {error}", file=sys.stderr)
        sys.exit(1)
