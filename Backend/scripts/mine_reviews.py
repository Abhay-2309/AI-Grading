import sys
import json
import re
import numpy as np

# Configure keyword list for size-related signals
KEYWORD_LIST = [
    'runs small', 'runs large', 'true to size', 'narrow', 'wide', 
    'tight', 'loose', 'size up', 'size down', 'fit small', 'fit large', 
    'fits small', 'fits large', 'runs a bit small', 'runs a bit large',
    'fits tight', 'fits loose', 'runs tight', 'runs loose', 'too tight', 'too loose'
]

# Anchor sentences representing the three sizing sentiments
ANCHORS = {
    'runs-small': [
        "this runs small, suggest sizing up",
        "fits tight and is too small",
        "small fit, runs small, tight fit",
        "tight in the toes",
        "runs tight, runs small",
        "too tight"
    ],
    'runs-true': [
        "fits true to size",
        "perfect fit, exact sizing, runs true",
        "matches size chart exactly",
        "great fit, fits well",
        "runs true to size"
    ],
    'runs-large': [
        "this runs large, suggest sizing down",
        "fits loose and is too big",
        "large fit, runs large, loose fit",
        "too loose, fits big",
        "runs big, runs large",
        "too loose"
    ]
}

def split_into_sentences(text):
    if not text:
        return []
    # Split by punctuation and newlines
    sentences = re.split(r'[.!?\n\r]+', text)
    return [s.strip() for s in sentences if s.strip()]

def contains_size_keywords(sentence):
    sent_lower = sentence.lower()
    return any(kw in sent_lower for kw in KEYWORD_LIST)

def main():
    try:
        # Load reviews from standard input
        input_data = json.loads(sys.stdin.read())
        reviews = input_data.get('reviews', [])
        
        if not reviews:
            print(json.dumps({
                "sentiment": "runs-true",
                "pct_of_reviews": 0.0,
                "sample_review_snippet": "No reviews available yet."
            }))
            return

        # Extract sizing-relevant sentences and preserve their original review context
        filtered_sentences = []
        sentence_to_review = {}
        
        for review in reviews:
            r_text = review.get('reviewText', '')
            if not r_text:
                continue
            
            sentences = split_into_sentences(r_text)
            for s in sentences:
                if contains_size_keywords(s):
                    filtered_sentences.append(s)
                    sentence_to_review[s] = r_text

        # If no sentences match size keywords, fallback to all sentences to find any signal
        if not filtered_sentences:
            for review in reviews:
                r_text = review.get('reviewText', '')
                if not r_text:
                    continue
                sentences = split_into_sentences(r_text)
                if sentences:
                    filtered_sentences.append(sentences[0])
                    sentence_to_review[sentences[0]] = r_text

        if not filtered_sentences:
            print(json.dumps({
                "sentiment": "runs-true",
                "pct_of_reviews": 0.0,
                "sample_review_snippet": "No sizing comments in reviews."
            }))
            return

        # Initialize sentence-transformers
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')

        # Embed input sentences
        sentence_embeddings = model.encode(filtered_sentences)

        # Embed anchor sentences
        anchor_categories = list(ANCHORS.keys())
        anchor_embeddings = {}
        for cat in anchor_categories:
            anchor_embeddings[cat] = model.encode(ANCHORS[cat])

        # Classify each sentence based on average cosine similarity to anchor vectors
        from sklearn.metrics.pairwise import cosine_similarity
        
        classifications = []
        for i, emb in enumerate(sentence_embeddings):
            best_cat = None
            max_sim = -1.0
            
            # Reshape embedding for cosine similarity
            emb_reshaped = emb.reshape(1, -1)
            
            for cat in anchor_categories:
                cat_embs = anchor_embeddings[cat]
                sims = cosine_similarity(emb_reshaped, cat_embs)
                avg_sim = float(np.mean(sims))
                
                if avg_sim > max_sim:
                    max_sim = avg_sim
                    best_cat = cat
            
            classifications.append((filtered_sentences[i], best_cat))

        # Count frequencies
        counts = {cat: 0 for cat in anchor_categories}
        cat_sentences = {cat: [] for cat in anchor_categories}
        
        for sent, cat in classifications:
            counts[cat] += 1
            cat_sentences[cat].append(sent)

        total = len(classifications)
        dominant_sentiment = max(counts, key=counts.get)
        pct = (counts[dominant_sentiment] / total) * 100.0 if total > 0 else 0.0

        # Retrieve a representative snippet from the dominant category
        sample_snippet = ""
        if cat_sentences[dominant_sentiment]:
            # Pick the sentence that contains sizing keywords if possible, else the first sentence
            best_sent = cat_sentences[dominant_sentiment][0]
            # Use the full review text as the snippet for context, or just the sentence
            sample_snippet = sentence_to_review.get(best_sent, best_sent)
            # Truncate if too long
            if len(sample_snippet) > 160:
                sample_snippet = sample_snippet[:157] + "..."
        else:
            sample_snippet = "No matching reviews."

        result = {
            "sentiment": dominant_sentiment,
            "pct_of_reviews": round(pct, 1),
            "sample_review_snippet": sample_snippet
        }
        
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "sentiment": "runs-true",
            "pct_of_reviews": 0.0,
            "sample_review_snippet": "Error executing review miner."
        }))

if __name__ == '__main__':
    main()
