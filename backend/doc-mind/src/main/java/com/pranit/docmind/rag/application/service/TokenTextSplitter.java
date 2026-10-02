package com.pranit.docmind.rag.application.service;

import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.EncodingType;
import org.jspecify.annotations.NonNull;
import org.springframework.ai.transformer.splitter.TextSplitter;
import org.springframework.util.Assert;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;

/**
 * Structure-aware, token-budgeted splitter for RAG.
 * <ul>
 *   <li>cleans whitespace, then splits on paragraphs and Markdown headings (topic boundaries);</li>
 *   <li>packs whole paragraphs; oversized paragraphs fall back to sentences, then words;</li>
 *   <li>repeats whole trailing paragraphs/sentences as overlap (never across a topic break);</li>
 *   <li>optionally prefixes each chunk with its section path ("Section: Guide &gt; Inheritance").</li>
 * </ul>
 * A chunk never starts or ends mid-sentence, except for one sentence larger than chunkSize.
 */
public class TokenTextSplitter extends TextSplitter {

    private static final int DEFAULT_CHUNK_SIZE = 512;
    private static final int DEFAULT_CHUNK_OVERLAP = 64;
    private static final int MIN_CHUNK_SIZE_CHARS = 350;
    private static final int MIN_CHUNK_LENGTH_TO_EMBED = 20;
    private static final int MAX_NUM_CHUNKS = 10000;
    private static final boolean KEEP_SEPARATOR = true;
    private static final boolean NORMALIZE_WHITESPACE = true;
    private static final boolean RESPECT_HEADINGS = true;
    private static final boolean HEADING_CONTEXT = true;
    private static final double SECTION_BREAK_RATIO = 0.5;
    private static final EncodingType DEFAULT_ENCODING_TYPE = EncodingType.CL100K_BASE;
    private static final EncodingRegistry REGISTRY = Encodings.newLazyEncodingRegistry();
    private final Encoding encoding;
    private final SentenceChunker.Options options;

    private TokenTextSplitter(
            EncodingType encodingType, int chunkSize, int chunkOverlap,
            int minChunkSizeChars, int minChunkLengthToEmbed, int maxNumChunks,
            boolean keepSeparator, Locale locale, List<Character> punctuationMarks,
            boolean normalizeWhitespace, boolean respectHeadings, boolean headingContext,
            double sectionBreakRatio) {
        Assert.notNull
                (encodingType, "encodingType must not be null");
        Assert.notNull
                (locale, "locale must not be null");
        Assert.notNull
                (punctuationMarks, "punctuationMarks must not be null (use an empty list for locale rules)");
        Assert.isTrue
                (chunkSize > 0, "chunkSize must be greater than zero");
        Assert.isTrue
                (chunkOverlap >= 0, "chunkOverlap must not be negative");
        Assert.isTrue
                (chunkOverlap < chunkSize, "chunkOverlap must be smaller than chunkSize");
        Assert.isTrue
                (maxNumChunks > 0, "maxNumChunks must be greater than zero");
        Assert.isTrue
                (minChunkSizeChars >= 0, "minChunkSizeChars must not be negative");
        Assert.isTrue
                (minChunkLengthToEmbed >= 0, "minChunkLengthToEmbed must not be negative");
        Assert.isTrue
                (sectionBreakRatio >= 0.0 && sectionBreakRatio <= 1.0, "sectionBreakRatio must be between 0 and 1");

        this.encoding = REGISTRY.getEncoding(encodingType);
        this.options = new SentenceChunker.Options(
                chunkSize, chunkOverlap, minChunkSizeChars,
                minChunkLengthToEmbed, maxNumChunks, keepSeparator,
                locale, new HashSet<>(punctuationMarks), normalizeWhitespace,
                respectHeadings, headingContext, sectionBreakRatio);
    }

    public static Builder builder() {
        return new Builder();
    }

    @Override
    protected @NonNull List<String> splitText(@NonNull String text) {
        return SentenceChunker.chunk(text, this.options, this.encoding::countTokens);
    }

    public static final class Builder {

        private EncodingType encodingType = DEFAULT_ENCODING_TYPE;
        private int chunkSize = DEFAULT_CHUNK_SIZE;
        private int chunkOverlap = DEFAULT_CHUNK_OVERLAP;
        private int minChunkSizeChars = MIN_CHUNK_SIZE_CHARS;
        private int minChunkLengthToEmbed = MIN_CHUNK_LENGTH_TO_EMBED;
        private int maxNumChunks = MAX_NUM_CHUNKS;
        private boolean keepSeparator = KEEP_SEPARATOR;
        private Locale locale = Locale.ROOT;
        private List<Character> punctuationMarks = List.of(); // empty = use locale sentence rules
        private boolean normalizeWhitespace = NORMALIZE_WHITESPACE;
        private boolean respectHeadings = RESPECT_HEADINGS;
        private boolean headingContext = HEADING_CONTEXT;
        private double sectionBreakRatio = SECTION_BREAK_RATIO;

        private Builder() {
        }

        public Builder withEncodingType(EncodingType encodingType) {
            this.encodingType = encodingType;
            return this;
        }

        /**
         * Maximum tokens per chunk (including the section-path prefix).
         */
        public Builder withChunkSize(int chunkSize) {
            this.chunkSize = chunkSize;
            return this;
        }

        /**
         * Token budget for overlap; only WHOLE paragraphs/sentences that fit in it are carried over.
         */
        public Builder withChunkOverlap(int chunkOverlap) {
            this.chunkOverlap = chunkOverlap;
            return this;
        }

        /**
         * Minimum chunk length in characters. A shorter chunk (usually the last one) borrows whole
         * units from the end of the previous chunk, never exceeding chunkSize. Use 0 to disable.
         */
        public Builder withMinChunkSizeChars(int minChunkSizeChars) {
            this.minChunkSizeChars = minChunkSizeChars;
            return this;
        }

        public Builder withMinChunkLengthToEmbed(int minChunkLengthToEmbed) {
            this.minChunkLengthToEmbed = minChunkLengthToEmbed;
            return this;
        }

        public Builder withMaxNumChunks(int maxNumChunks) {
            this.maxNumChunks = maxNumChunks;
            return this;
        }

        public Builder withKeepSeparator(boolean keepSeparator) {
            this.keepSeparator = keepSeparator;
            return this;
        }

        /**
         * Language rules used to detect sentence boundaries (when no punctuation marks are set).
         */
        public Builder withLocale(Locale locale) {
            this.locale = locale;
            return this;
        }

        /**
         * Characters that end a sentence, e.g. {@code List.of('.', '?', '!', '।')}. A sentence ends
         * after a run of these characters followed by whitespace or end of text ("2.5" is not split).
         * Default is empty, which uses the locale's sentence rules (better with abbreviations).
         */
        public Builder withPunctuationMarks(List<Character> punctuationMarks) {
            this.punctuationMarks = punctuationMarks;
            return this;
        }

        /**
         * Clean CRLF, NBSP, trailing/repeated spaces and 3+ blank lines before splitting.
         */
        public Builder withNormalizeWhitespace(boolean normalizeWhitespace) {
            this.normalizeWhitespace = normalizeWhitespace;
            return this;
        }

        /**
         * Treat Markdown headings as topic boundaries; a heading never ends a chunk.
         */
        public Builder withRespectHeadings(boolean respectHeadings) {
            this.respectHeadings = respectHeadings;
            return this;
        }

        /**
         * Prefix each chunk with its section path, e.g. "Section: Guide &gt; Inheritance".
         */
        public Builder withHeadingContext(boolean headingContext) {
            this.headingContext = headingContext;
            return this;
        }

        /**
         * How full a chunk must be (0..1 of the token budget) before a heading starts a new chunk.
         * 0 = split at every heading, 1 = only when full. A level-1 heading always starts a new chunk.
         */
        public Builder withSectionBreakRatio(double sectionBreakRatio) {
            this.sectionBreakRatio = sectionBreakRatio;
            return this;
        }

        public TokenTextSplitter build() {
            return new TokenTextSplitter(this.encodingType, this.chunkSize, this.chunkOverlap,
                    this.minChunkSizeChars, this.minChunkLengthToEmbed, this.maxNumChunks, this.keepSeparator,
                    this.locale, this.punctuationMarks, this.normalizeWhitespace, this.respectHeadings,
                    this.headingContext, this.sectionBreakRatio);
        }
    }
}