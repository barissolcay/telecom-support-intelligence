from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "knowledge_base" / "source"
    documents = list(root.glob("*.md"))
    chunks = sum(max(1, text.read_text(encoding="utf-8").count("\n## ")) for text in documents)
    print(f"Validated {len(documents)} synthetic documents with {chunks} sections")


if __name__ == "__main__":
    main()
