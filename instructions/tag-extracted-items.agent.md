# Tag Extracted Items

Workflow for attaching an extraction-method tag to items produced by multiple extractors (e.g. pattern-matching vs. LLM fallback), so downstream steps can tell how each item was found.

- Input format:
  + A list of extracted items (e.g. action items, entities), each already associated with the extractor/pass that produced it.
  + The name/identifier of that extractor (e.g. `pattern`, `llm`, `manual`).
- Processing steps:
  + Define a small controlled vocabulary of extraction-method values up front (e.g. `pattern`, `llm`) — do not invent new values ad hoc per item.
  + Iterate over each extracted item and attach a `method`/`extraction_method` field set to the value matching its originating extractor.
  + Never overwrite or alter the item's original text/content while tagging.
  + If an item's origin is ambiguous (e.g. produced by a merge/dedup step), tag it explicitly (e.g. `merged`) rather than guessing one of the base methods.
  + Merge all tagged items from every extractor into a single combined list, preserving each item's tag.
- Output format:
  + The same item objects/strings, each annotated with an explicit extraction-method tag.
  + A single combined list ready for downstream review/consumption.
- Constraints:
  + Every item must carry exactly one method tag — no untagged items in the output.
  + Tag values must come from the predefined vocabulary, not free text.
  + Do not silently drop items that don't fit a known method — flag them for manual review instead.
