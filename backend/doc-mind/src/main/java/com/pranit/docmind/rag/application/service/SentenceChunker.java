package com.pranit.docmind.rag.application.service;

import java.text.BreakIterator;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.ToIntFunction;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Dependency-free, structure-aware chunking core.
 * <ol>
 *   <li><b>Clean</b>: normalise line endings and stray whitespace (optional).</li>
 *   <li><b>Structure</b>: split into paragraphs (blank lines); Markdown headings become their own
 *       units and define the section path (e.g. "Java &gt; Inheritance").</li>
 *   <li><b>Pack</b>: whole paragraphs are packed into chunks of at most the token budget. A
 *       paragraph that does not fit is split into sentences, then words, then characters.</li>
 *   <li><b>Topic breaks</b>: a chunk breaks before a top-level ({@code #}) heading, or before any heading
 *       once the chunk is at least {@code sectionBreakRatio} full (0 = every heading, 1 = only when
 *       full), so small sections are combined instead of becoming tiny chunks. A heading never ends a
 *       chunk. No overlap crosses a topic break.</li>
 *   <li><b>Overlap</b>: inside a section, WHOLE trailing units that fit in {@code chunkOverlap} tokens
 *       are repeated at the start of the next chunk.</li>
 *   <li><b>Minimum size</b>: a chunk shorter than {@code minChunkSizeChars} borrows earlier units of
 *       the same topic (never past the budget).</li>
 *   <li><b>Context</b>: optionally prefix each chunk with its section path so a chunk is
 *       self-explanatory when retrieved on its own (its tokens are reserved from the budget).</li>
 * </ol>
 * Sentence boundaries come from {@link BreakIterator} unless {@code sentenceMarks} is non-empty.
 */
public final class SentenceChunker {

    private static final Pattern PARAGRAPH_BREAK = Pattern.compile("\\R[ \\t]*\\R\\s*");
    private static final Pattern HEADING = Pattern.compile("^ {0,3}(#{1,6})[ \\t]+(\\S.*?)(?:[ \\t]+#+)?[ \\t]*$");

    private SentenceChunker() {
    }

    public static List<String> chunk(String text, Options o, ToIntFunction<String> counter) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return chunks;
        }
        if (o.normalizeWhitespace()) {
            text = normalize(text);
            if (text.isBlank()) {
                return chunks;
            }
        }

        List<Para> paras = toParas(text, o);

        // reserve room for the section-path prefix so prefix + body still fits chunkSize
        int budget = o.chunkSize();
        if (o.headingContext()) {
            int maxHeader = 0;
            Set<List<String>> seen = new HashSet<>();
            for (Para p : paras) {
                if (!p.path().isEmpty() && seen.add(p.path())) {
                    maxHeader = Math.max(maxHeader, counter.applyAsInt(header(p.path())));
                }
            }
            budget = Math.max(1, Math.max(o.chunkSize() - maxHeader, o.chunkSize() / 2));
        }

        List<Unit> units = new ArrayList<>();
        for (Para p : paras) {
            addParagraph(p, budget, o, counter, units);
        }

        // ---- pack ----
        List<Window> windows = new ArrayList<>();
        List<Unit> window = new ArrayList<>();
        int windowTokens = 0;
        int carriedUnits = 0;
        boolean sectionStart = false;

        for (Unit unit : units) {
            boolean overflow = !window.isEmpty() && windowTokens + unit.tokens() > budget;
            boolean topicBreak = o.respectHeadings() && unit.isHeading() && !window.isEmpty()
                    && (unit.level() == 1 || windowTokens >= budget * o.sectionBreakRatio());

            if (overflow || topicBreak) {
                // a heading must never end a chunk: hold trailing headings for the next one
                int cut = window.size();
                while (cut > carriedUnits && window.get(cut - 1).isHeading()) {
                    cut--;
                }
                if (cut <= carriedUnits) {
                    cut = window.size();
                }
                List<Unit> emitted = new ArrayList<>(window.subList(0, cut));
                List<Unit> held = new ArrayList<>(window.subList(cut, window.size()));
                int heldTokens = sum(held);
                if (!held.isEmpty() && heldTokens + unit.tokens() > budget) {
                    emitted = new ArrayList<>(window);
                    held.clear();
                    heldTokens = 0;
                }
                windows.add(new Window(emitted, carriedUnits, sectionStart));

                if (unit.isHeading() || !held.isEmpty()) {
                    // new topic: no overlap across it
                    window = held;
                    windowTokens = heldTokens;
                    carriedUnits = 0;
                    sectionStart = true;
                } else {
                    // same topic: carry whole trailing units that fit in the overlap budget
                    int start = emitted.size();
                    int carried = 0;
                    while (start > 0 && carried + emitted.get(start - 1).tokens() <= o.chunkOverlap()) {
                        start--;
                        carried += emitted.get(start).tokens();
                    }
                    window = new ArrayList<>(emitted.subList(start, emitted.size()));
                    windowTokens = carried;
                    while (!window.isEmpty() && windowTokens + unit.tokens() > budget) {
                        windowTokens -= window.removeFirst().tokens();
                    }
                    carriedUnits = window.size();
                    sectionStart = false;
                }
            }
            window.add(unit);
            windowTokens += unit.tokens();
        }
        if (!window.isEmpty()) {
            windows.add(new Window(window, carriedUnits, sectionStart));
        }

        topUp(windows, o.minChunkSizeChars(), budget);

        // ---- windows -> strings ----
        for (Window w : windows) {
            if (chunks.size() >= o.maxNumChunks()) {
                break;
            }
            String body = w.text().strip();
            if (body.length() <= o.minChunkLengthToEmbed()) {
                continue;
            }
            String out = o.headingContext() ? prefix(w) + body : body;
            chunks.add(o.keepSeparator() ? out : out.replaceAll("\\R+", " ").trim());
        }
        return chunks;
    }

    /**
     * Tidy whitespace without touching line structure: CRLF->LF, NBSP/zero-width, trailing and repeated spaces.
     */
    static String normalize(String t) {
        t = t.replace("\r\n", "\n").replace('\r', '\n');
        t = t.replace('\u00A0', ' ').replace("\u200B", "").replace("\uFEFF", "");
        t = t.replaceAll("[ \\t\\x0B\\f]+\\n", "\n");          // trailing whitespace
        t = t.replaceAll("(?<=\\S)[ \\t]+(?=\\S)", " ");       // runs inside a line (indentation is kept)
        t = t.replaceAll("\\n{3,}", "\n\n");                   // max one blank line
        return t.strip();
    }

    private static List<Para> toParas(String text, Options o) {
        List<Para> out = new ArrayList<>();
        List<Integer> levels = new ArrayList<>();
        List<String> titles = new ArrayList<>();
        List<String> snapshot = List.of();
        boolean inFence = false;

        Matcher m = PARAGRAPH_BREAK.matcher(text);
        int start = 0;
        List<String> raws = new ArrayList<>();
        while (m.find()) {
            raws.add(text.substring(start, m.end()));
            start = m.end();
        }
        if (start < text.length()) {
            raws.add(text.substring(start));
        }

        for (String raw : raws) {
            if (raw.isBlank()) {
                continue;
            }
            boolean startedInFence = inFence;
            for (String line : raw.split("\n", -1)) {
                if (line.stripLeading().startsWith("```")) {
                    inFence = !inFence;
                }
            }
            if (!o.respectHeadings() || startedInFence) {
                out.add(new Para(raw, 0, snapshot));
                continue;
            }
            String rest = raw;
            while (!rest.isBlank()) {
                int nl = rest.indexOf('\n');
                String firstLine = nl < 0 ? rest : rest.substring(0, nl);
                Matcher h = HEADING.matcher(firstLine);
                if (h.matches()) {
                    int level = h.group(1).length();
                    while (!levels.isEmpty() && levels.getLast() >= level) {
                        levels.removeLast();
                        titles.removeLast();
                    }
                    levels.add(level);
                    titles.add(h.group(2).strip());
                    snapshot = List.copyOf(titles);
                    int end = nl < 0 ? rest.length() : nl + 1;
                    out.add(new Para(rest.substring(0, end), level, snapshot));
                    rest = rest.substring(end);
                } else {
                    out.add(new Para(rest, 0, snapshot));
                    break;
                }
            }
        }
        return out;
    }

    private static String header(List<String> path) {
        return "Section: " + String.join(" > ", path) + "\n\n";
    }

    private static String prefix(Window w) {
        Unit first = w.units.getFirst();
        List<String> path = first.path();
        if (first.isHeading() && !path.isEmpty()) {
            // the heading itself is already the chunk's first line
            path = path.subList(0, path.size() - 1);
        }
        return path.isEmpty() ? "" : header(path);
    }

    private static int sum(List<Unit> units) {
        int t = 0;
        for (Unit u : units) {
            t += u.tokens();
        }
        return t;
    }

    /**
     * A short chunk (typically the last) cannot be merged into its full neighbour, so it borrows whole
     * units from the tail of the previous chunk, just before its overlap, until long enough. Chunks
     * that start a new topic are left alone so topics are not mixed.
     */
    private static void topUp(List<Window> ws, int minChars, int budget) {
        if (minChars <= 0) return;
        for (int i = 1; i < ws.size(); i++) {
            Window w = ws.get(i);
            if (w.sectionStart || w.text().strip().length() >= minChars) continue;
            Window prev = ws.get(i - 1);
            List<Unit> units = new ArrayList<>(w.units);
            int carried = w.carried;
            int tokens = w.tokens();
            int idx = prev.units.size() - carried - 1;
            while (idx >= 0 && new Window(units, carried, false).text().strip().length() < minChars) {
                Unit u = prev.units.get(idx);
                if (tokens + u.tokens() > budget) break;
                units.addFirst(u);
                tokens += u.tokens();
                carried++;
                idx--;
            }
            ws.set(i, new Window(units, carried, false));
        }
    }

    private static void addParagraph
            (Para p, int budget, Options o, ToIntFunction<String> counter, List<Unit> out) {
        String paragraph = p.text();
        if (paragraph.isBlank()) return;
        int tokens = counter.applyAsInt(paragraph);
        if (tokens <= budget) {
            out.add(new Unit(paragraph, tokens, p.level(), p.path()));
            return;
        }
        for (String sentence : sentences(paragraph, o)) {
            if (sentence.isBlank()) continue;
            int st = counter.applyAsInt(sentence);
            if (st <= budget) {
                out.add(new Unit(sentence, st, 0, p.path()));
            } else {
                splitOversized(sentence, budget, counter, p.path(), out);
            }
        }
    }

    private static List<String> sentences(String paragraph, Options o) {
        if (o.sentenceMarks() != null && !o.sentenceMarks().isEmpty()) {
            return splitByMarks(paragraph, o.sentenceMarks());
        }
        List<String> result = new ArrayList<>();
        BreakIterator it = BreakIterator.getSentenceInstance(o.locale());
        it.setText(paragraph);
        int start = it.first();
        for (int end = it.next(); end != BreakIterator.DONE; start = end, end = it.next()) {
            result.add(paragraph.substring(start, end));
        }
        return result;
    }

    /**
     * A sentence ends after a run of marks followed by whitespace/end of text ("2.5" is not split).
     */
    static List<String> splitByMarks(String text, Set<Character> marks) {
        List<String> out = new ArrayList<>();
        int n = text.length();
        int start = 0;
        int i = 0;
        while (i < n) {
            if (marks.contains(text.charAt(i))) {
                int j = i + 1;
                while (j < n && marks.contains(text.charAt(j))) {
                    j++;
                }
                boolean boundary = j == n || Character.isWhitespace(text.charAt(j))
                        || Character.isWhitespace(text.charAt(j - 1));
                if (boundary) {
                    while (j < n && Character.isWhitespace(text.charAt(j))) {
                        j++;
                    }
                    out.add(text.substring(start, j));
                    start = j;
                }
                i = j;
            } else {
                i++;
            }
        }
        if (start < n) {
            out.add(text.substring(start));
        }
        return out;
    }

    private static void splitOversized
            (String sentence, int budget, ToIntFunction<String> counter, List<String> path, List<Unit> out) {
        StringBuilder sb = new StringBuilder();
        int tokens = 0;
        for (String word : sentence.split("(?<=\\s)(?=\\S)")) {
            int wt = counter.applyAsInt(word);
            // URL, base64, CJK without spaces...
            if (wt > budget) {
                if (!sb.isEmpty()) {
                    out.add(new Unit(sb.toString(), tokens, 0, path));
                    sb.setLength(0);
                    tokens = 0;
                }
                hardSplit(word, budget, counter, path, out);
                continue;
            }
            if (tokens + wt > budget) {
                out.add(new Unit(sb.toString(), tokens, 0, path));
                sb.setLength(0);
                tokens = 0;
            }
            sb.append(word);
            tokens += wt;
        }
        if (!sb.isEmpty()) {
            out.add(new Unit(sb.toString(), tokens, 0, path));
        }
    }

    /**
     * Last resort: largest prefix that fits (binary search), never splitting a surrogate pair.
     */
    private static void hardSplit
    (String s, int budget, ToIntFunction<String> counter, List<String> path, List<Unit> out) {
        int pos = 0;
        while (pos < s.length()) {
            int lo = pos + 1;
            int hi = s.length();
            int best = pos + 1;
            while (lo <= hi) {
                int mid = (lo + hi) >>> 1;
                if (counter.applyAsInt(s.substring(pos, mid)) <= budget) {
                    best = mid;
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }
            if (best < s.length() && Character.isLowSurrogate(s.charAt(best))) {
                best--;
            }
            if (best <= pos) {
                best = Math.min(pos + 2, s.length());
            }
            String piece = s.substring(pos, best);
            out.add(new Unit(piece, counter.applyAsInt(piece), 0, path));
            pos = best;
        }
    }

    public record Options(
            int chunkSize, int chunkOverlap, int minChunkSizeChars,
            int minChunkLengthToEmbed, int maxNumChunks, boolean keepSeparator,
            Locale locale, Set<Character> sentenceMarks, boolean normalizeWhitespace,
            boolean respectHeadings, boolean headingContext, double sectionBreakRatio
    ) {
    }

    private record Para(String text, int level, List<String> path) {
    }

    private record Unit(String text, int tokens, int level, List<String> path) {
        boolean isHeading() {
            return level > 0;
        }
    }

    /**
     * One chunk before it is turned into a string. The first {@code carried} units are overlap.
     */
    private record Window(List<Unit> units, int carried, boolean sectionStart) {
        int tokens() {
            int t = 0;
            for (Unit u : units) {
                t += u.tokens();
            }
            return t;
        }

        String text() {
            StringBuilder sb = new StringBuilder();
            for (Unit u : units) {
                sb.append(u.text());
            }
            return sb.toString();
        }
    }
}