import math
import re
from collections import Counter
from pathlib import Path
from typing import Optional

from gtts import gTTS
from sumy.nlp.tokenizers import Tokenizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.summarizers.lsa import LsaSummarizer

from app.config import AUDIO_DIR, GROQ_API_KEY, GROQ_MODEL, USE_GROQ

STOP_WORDS = {
    "the",
    "is",
    "are",
    "and",
    "or",
    "to",
    "of",
    "in",
    "that",
    "with",
    "for",
    "on",
    "it",
    "this",
    "be",
    "as",
    "at",
    "by",
}


def split_sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def summarize_extractive(text: str, sentence_count: int) -> str:
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, sentence_count)
    return " ".join(str(sentence) for sentence in summary)


def summarize_abstractive(
    text: str,
    sentence_count: int,
    model_name: str,
    enable_transformers: bool,
) -> str:
    max_length = max(60, sentence_count * 35)
    min_length = max(25, sentence_count * 15)

    if enable_transformers:
        try:
            from transformers import pipeline

            summarizer = pipeline("summarization", model=model_name)
            chunks = _chunk_text(text, max_chars=2400)
            output = []
            for chunk in chunks:
                result = summarizer(
                    chunk,
                    max_length=max_length,
                    min_length=min_length,
                    do_sample=False,
                )
                output.append(result[0]["summary_text"])
            return " ".join(output)
        except Exception:
            pass

    # Fallback: score sentences and rewrite as concise bullet-like text.
    sentences = split_sentences(text)
    if not sentences:
        return "No summary could be generated."
    ranked = _rank_sentences(sentences)
    top = [s for _, s in sorted(ranked[:sentence_count], key=lambda item: sentences.index(item[1]))]
    return " ".join(top)


def summarize(text: str, summary_type: str, summary_length: int, model_name: str, enable_transformers: bool) -> str:
    if USE_GROQ and GROQ_API_KEY:
        groq_summary = _summarize_with_groq(text, summary_type, summary_length)
        if groq_summary:
            return groq_summary

    if summary_type == "extractive":
        return summarize_extractive(text, summary_length)
    return summarize_abstractive(text, summary_length, model_name, enable_transformers)


def translate_text(text: str, target_language: str, model_name: str, enable_transformers: bool) -> str:
    if not target_language:
        return text

    if USE_GROQ and GROQ_API_KEY:
        groq_translation = _translate_with_groq(text, target_language)
        if groq_translation:
            return groq_translation

    if enable_transformers:
        try:
            from transformers import pipeline

            translator = pipeline("translation", model=model_name)
            result = translator(text, max_length=512)
            return result[0]["translation_text"]
        except Exception:
            pass

    fallback_map = {
        "ta": "[Tamil translation unavailable in offline mode] ",
        "hi": "[Hindi translation unavailable in offline mode] ",
        "fr": "[French translation unavailable in offline mode] ",
    }
    prefix = fallback_map.get(target_language, "[Translation unavailable in offline mode] ")
    return prefix + text


def text_to_speech(text: str, language: str, output_name: str) -> str:
    language = language or "en"
    output_path = AUDIO_DIR / f"{output_name}_{language}.mp3"

    try:
        tts = gTTS(text=text, lang=language)
        tts.save(str(output_path))
    except Exception:
        # Keep pipeline non-breaking by generating a tiny placeholder audio marker.
        output_path.write_bytes(b"")

    return str(output_path)


def extract_keywords(text: str, top_n: int = 12) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z-]{2,}", text.lower())
    words = [w for w in words if w not in STOP_WORDS]
    common = Counter(words).most_common(top_n)
    return [word for word, _ in common]


def detect_topics(text: str) -> list[str]:
    keywords = extract_keywords(text, top_n=8)
    buckets = {
        "technology": {"ai", "model", "data", "software", "system", "algorithm"},
        "education": {"learn", "student", "course", "lesson", "training", "study"},
        "business": {"market", "growth", "customer", "revenue", "company", "strategy"},
        "productivity": {"time", "focus", "habit", "workflow", "task", "plan"},
    }

    scores = {topic: 0 for topic in buckets}
    for keyword in keywords:
        for topic, vocab in buckets.items():
            if keyword in vocab:
                scores[topic] += 1

    ranked = [topic for topic, score in sorted(scores.items(), key=lambda x: x[1], reverse=True) if score > 0]
    return ranked or ["general"]


def answer_question(transcript: str, question: str) -> str:
    if USE_GROQ and GROQ_API_KEY:
        groq_answer = _answer_with_groq(transcript, question)
        if groq_answer:
            return groq_answer

    sentences = split_sentences(transcript)
    if not sentences:
        return "No transcript available to answer the question."

    q_tokens = set(re.findall(r"[a-zA-Z]+", question.lower()))
    scored = []
    for sentence in sentences:
        s_tokens = set(re.findall(r"[a-zA-Z]+", sentence.lower()))
        overlap = len(q_tokens & s_tokens)
        if overlap:
            scored.append((overlap, sentence))

    if not scored:
        return "I could not find a precise answer in the transcript."

    return max(scored, key=lambda item: item[0])[1]


def compression_ratio(transcript: str, summary: str) -> float:
    t_words = max(1, len(transcript.split()))
    s_words = max(1, len(summary.split()))
    return round((1 - (s_words / t_words)) * 100, 2)


def _rank_sentences(sentences: list[str]) -> list[tuple[float, str]]:
    frequencies = Counter()
    for sentence in sentences:
        tokens = [w.lower() for w in re.findall(r"[A-Za-z]+", sentence)]
        frequencies.update([w for w in tokens if w not in STOP_WORDS])

    ranked = []
    for sentence in sentences:
        tokens = [w.lower() for w in re.findall(r"[A-Za-z]+", sentence)]
        score = sum(frequencies[w] for w in tokens if w in frequencies)
        length_penalty = math.sqrt(max(1, len(tokens)))
        ranked.append((score / length_penalty, sentence))

    return sorted(ranked, key=lambda item: item[0], reverse=True)


def _chunk_text(text: str, max_chars: int) -> list[str]:
    sentences = split_sentences(text)
    chunks = []
    current = []
    size = 0

    for sentence in sentences:
        if size + len(sentence) > max_chars and current:
            chunks.append(" ".join(current))
            current = [sentence]
            size = len(sentence)
        else:
            current.append(sentence)
            size += len(sentence)

    if current:
        chunks.append(" ".join(current))

    return chunks or [text]


def _summarize_with_groq(text: str, summary_type: str, summary_length: int) -> Optional[str]:
    style = "extractive" if summary_type == "extractive" else "abstractive"
    prompt = (
        f"Create a {style} summary in about {summary_length} sentences. "
        "Preserve the core meaning and avoid hallucinations.\n\n"
        f"Transcript:\n{_trim_text(text, 16000)}"
    )
    return _groq_chat(prompt)


def _translate_with_groq(text: str, target_language: str) -> Optional[str]:
    lang_map = {"ta": "Tamil", "hi": "Hindi", "fr": "French"}
    target = lang_map.get(target_language, target_language)
    prompt = (
        f"Translate the following summary to {target}. Keep technical meaning unchanged. "
        "Return only the translated text.\n\n"
        f"Summary:\n{_trim_text(text, 12000)}"
    )
    return _groq_chat(prompt)


def _answer_with_groq(transcript: str, question: str) -> Optional[str]:
    prompt = (
        "Answer the user question using only the transcript context. "
        "If answer is not present, say that clearly in one line.\n\n"
        f"Question: {question}\n\n"
        f"Transcript:\n{_trim_text(transcript, 16000)}"
    )
    return _groq_chat(prompt)


def _groq_chat(prompt: str) -> Optional[str]:
    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise NLP assistant for transcript processing.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        content = completion.choices[0].message.content
        return content.strip() if content else None
    except Exception:
        return None


def _trim_text(text: str, max_chars: int) -> str:
    return text if len(text) <= max_chars else text[:max_chars]
