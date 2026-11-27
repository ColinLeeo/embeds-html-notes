# Interactive HTML Embeds

Link to a specific moment in an interactive HTML file from an Obsidian note. A link remembers the scene and its parameters. Two notes can embed different states of the same file, and readers can continue interacting from either one.

## Try it

1. Copy [weather-log.html](skills/obsidian-html-scenes/assets/weather-log.html) and [Weather notes.md](<examples/Weather notes.md>) into the same folder in your vault.
2. Open **Weather notes** in Reading view or Live Preview. The card starts at noon, when the corrected observation reads **23 °C · 1016 hPa**.
3. Choose **08:00** in the card. Click **Copy embed**, then paste into a second note. The new card opens at **17 °C · 1015 hPa**, and the noon reference still opens at noon.
4. Click **Open full page** to see the rest of the document with the selected time restored. Use **Find references** to see which notes cite the active scene.

```md
![[weather-log.html#reading?time=12%3A00]]
[[weather-log.html#sources?time=08%3A00|Compare the morning readings]]
```

Open **Find HTML scenes** from the command palette to search scene titles, IDs and file paths. References are grouped by scene, so different parameter values can lead back to the same explanation.

## Install from GitHub

Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/ColinLeeo/embeds-html-notes/releases/latest). Place them in the `plugins/html-scenes/` folder of your vault's configuration directory, then enable **Interactive HTML Embeds** under **Settings → Community plugins**. With the default configuration directory, the installation path is `.obsidian/plugins/html-scenes/`. Requires Obsidian 1.15.1 or later. Desktop Reading view and Live Preview have been tested. Mobile support is unverified.

## Author an HTML scene

A self-contained HTML file opens directly in a tab or as a whole-page embed. To make regions individually discoverable, declare their stable IDs in a static scene catalog. The page decides which controls and results to show for an embedded scene, handles incoming parameters, and reports its current state after each interaction. The host uses that state when copying or expanding a link.

The [authoring skill](skills/obsidian-html-scenes/SKILL.md) describes the messages, parameter format and inline sizing. Its [working template](skills/obsidian-html-scenes/assets/weather-log.html) runs in Obsidian and as a standalone HTML page. The plugin ID and message namespace are `html-scenes` for compatibility with existing pages.

## Files and privacy

The plugin reads HTML and Markdown link metadata from the open vault. It uses an iframe with `sandbox="allow-scripts"` and an opaque origin, so the embedded page has no direct access to the Obsidian plugin API. Opening an HTML file runs its scripts. Use files you trust. Documents can request external resources if their HTML references them and the host permits the request. Inline scripts, styles, images and data for a portable offline archive. Relative resource links in sibling files do not resolve against the vault in this version.

The plugin itself uses no remote service, account or telemetry. Clipboard writes happen when you copy a link or embed. A saved link restores the parameters against the current HTML file. Archive the matching data if future readers need the original result.

## Source and license

`main.js` is the complete plugin source and the release artifact. It uses the Obsidian runtime directly and requires no build step. The release also contains the root manifest and stylesheet.

[Apache License 2.0](LICENSE)
