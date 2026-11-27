---
name: obsidian-html-scenes
description: Create or adapt self-contained interactive HTML for Obsidian's Interactive HTML Embeds plugin when a note needs to link to a named scene, embed it with parameters, or restore the state a reader selected.
---

# Author linkable HTML scenes

Choose the smallest part of the explanation a reader might cite on its own. Keep its title, controls, units and result together. For a new page adapt the [working example](assets/weather-log.html). When adapting an existing page, use its actual controls, state and rendering code so that the inline view stays interactive.

## Address a scene

Give each embeddable region a stable, unique ID and an accessible title. The example marks each region with `data-embeddable`. Its page script uses that attribute to switch layouts. The plugin discovers scenes by reading the static JSON catalog in the HTML source.

```html
<script type="application/json" id="html-scenes">
{"reading":"Weather reading","sources":"Reading sources"}
</script>
```

Use the same IDs in the catalog and the page. Choose parameters that describe state worth saving, such as a time, selected device, or plan stage. Define accepted values and deterministic defaults. Scene IDs and parameter keys match `^[a-zA-Z][a-zA-Z0-9_-]*$`. Report parameters as a flat object of strings with at most 32 entries and 1024 UTF-16 code units per value. Retain IDs and parameter meanings across revisions so old notes still work.

## Connect the page

Register the message listener and initialize the data before announcing readiness. Check `event.source === window.parent` and the message type. The plugin creates a sandboxed Blob iframe. Send messages with `parent.postMessage(message, "*")`; use a separate initial hash restoration path when the HTML runs as a top-level document.

| Message | Sender | Meaning |
| --- | --- | --- |
| `html-scenes:ready` | Page | The page can receive the initial scene. |
| `html-scenes:open` | Host | Restore `scene` and `params`. The `inline` boolean selects the layout. Duplicate deliveries should restore the same state. |
| `html-scenes:state` | Page | After applying an open or a reader action, report the active `scene` and normalized `params`. A full page with several scenes should make the selection explicit. |
| `html-scenes:height` | Page | Optionally send numeric `height` after the visible content changes. Measure the content container, not the viewport. The host clamps this value to 100–1200 pixels. |

For a multilingual page, the host can include its Obsidian language code in the optional `locale` field of `html-scenes:open`. Read it on each open. A saved language parameter can take precedence when the author wants the scene to match the prose around it. Release 0.1.0 omits this field. Use the browser language when no language is saved and the host omits the field, with a fallback to a language the page supports. The [TsFile examples](../../examples/tsfile/) share each HTML file across English and Simplified Chinese notes.

Keep all required scripts, styles, data and images within the file. Narrow inline views should preserve controls and readable text. Wide charts or tables can scroll inside their own containers. Full-page mode should restore the same scene and keep its surrounding context available.

## Embed one panel from a large page

In a checkout of the plugin repository, the [TsFile storage workbench](../../examples/tsfile/tsfile-storage-workbench.html) keeps three panels in one offline file. Each panel owns its controls and state. A note can embed the index directly with `![[tsfile-storage-workbench.html#lookup?key=s14&mode=floor]]`. In inline mode, show only `lookup` and measure its visible content. In full-page mode, show all three panels and restore the selected key and mode. Give each panel a **Select for linking** action so the host can copy it before the reader changes a control.

To check the boundary, open the [companion note](../../examples/tsfile/en/One%20panel%20from%20the%20TsFile%20workbench.md) next to the full HTML. Switch to exact match inside the note and expand it. Then select the byte encoder in the full page, copy its embed and confirm that the new embed shows just the encoder.

## Deliver and check

Supply a normal link and an embed. For example, `[[weather-log.html#reading?time=12%3A00]]` opens a full page and `![[weather-log.html#reading?time=12%3A00]]` embeds the scene. Encode parameter values with `URLSearchParams`.

Open a non-default state. Change a control, copy the embed into another note and check the actual displayed result. Expand it and select a different scene. Verify these interactions in the views available to you and identify any untested platforms.
