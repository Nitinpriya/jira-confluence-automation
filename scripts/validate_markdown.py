"""Validate Markdown files in the repo for consistent formatting.

Checks (see instructions/validate-markdown.agent.md):
  1. Exactly one top-level '#' H1 title, counted only outside fenced code blocks.
  2. Every relative Markdown link resolves to an existing file on disk.

Usage:
    python scripts/validate_markdown.py [--path DIR]
"""
import argparse
import os
import re
import sys

SKIP_DIRS = {".git", "__pycache__", "node_modules", ".venv", "venv"}
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
INLINE_CODE_RE = re.compile(r"`[^`]*`")


def find_markdown_files(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if name.lower().endswith(".md"):
                yield os.path.join(dirpath, name)


def check_h1_count(lines: list[str]) -> int:
    h1_count = 0
    in_fence = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if re.match(r"^#\s+\S", line):
            h1_count += 1
    return h1_count


def check_broken_links(file_path: str, lines: list[str]) -> list[str]:
    broken = []
    file_dir = os.path.dirname(file_path)
    in_fence = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        # Strip inline code spans so documentation examples like `[text](path)` aren't treated as real links.
        line = INLINE_CODE_RE.sub("", line)
        for target in LINK_RE.findall(line):
            target = target.split(" ", 1)[0].strip()
            if not target or target.startswith(("http://", "https://", "#", "mailto:")):
                continue
            target_path = target.split("#", 1)[0]
            if not target_path:
                continue
            resolved = os.path.normpath(os.path.join(file_dir, target_path))
            if not os.path.exists(resolved):
                broken.append(target)
    return broken


def has_frontmatter(lines: list[str]) -> bool:
    return bool(lines) and lines[0].strip() == "---"


def validate_file(file_path: str) -> list[str]:
    reasons = []
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Files with YAML frontmatter (name/description already act as the title) and short
    # .github/ directive files are exempt from the H1 requirement by repo convention.
    normalized_path = file_path.replace(os.sep, "/")
    h1_exempt = has_frontmatter(lines) or "/.github/" in f"/{normalized_path}"

    if not h1_exempt:
        h1_count = check_h1_count(lines)
        if h1_count == 0:
            reasons.append("no top-level H1 title found")
        elif h1_count > 1:
            reasons.append(f"found {h1_count} top-level H1 titles (expected 1)")

    broken_links = check_broken_links(file_path, lines)
    if broken_links:
        reasons.append(f"broken relative link(s): {', '.join(broken_links)}")

    return reasons


def main():
    parser = argparse.ArgumentParser(description="Validate Markdown files for consistent formatting.")
    parser.add_argument("--path", default=None, help="Directory to scan (default: repo root)")
    args = parser.parse_args()

    repo_root = args.path or os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))

    any_failures = False
    for file_path in sorted(find_markdown_files(repo_root)):
        rel_path = os.path.relpath(file_path, repo_root)
        reasons = validate_file(file_path)
        if reasons:
            any_failures = True
            print(f"FAIL {rel_path}: {'; '.join(reasons)}")
        else:
            print(f"OK {rel_path}")

    sys.exit(1 if any_failures else 0)


if __name__ == "__main__":
    main()
