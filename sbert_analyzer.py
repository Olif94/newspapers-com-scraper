import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer, util
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re

class HistoricalSentimentAnalyzer:
    def __init__(self):
        # Load SBERT model for semantic similarity
        self.sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.vader_analyzer = SentimentIntensityAnalyzer()
        
        # Define historically accurate sentiment references for 19th century Chinese labor discourse
        self.positive_references = [
            "industrious and peaceful",
            "quiet and law abiding", 
            "steady and reliable laborers",
            "harmless and inoffensive people",
            "useful workers in the mines",
            "faithful servants",
            "patient and hardworking"
        ]
        
        self.negative_references = [
            "coolie labor",
            "cheap Mongolian labor",
            "threat to white labor", 
            "drives down wages",
            "heathen Chinese",
            "filthy habits",
            "unassimilable race",
            "vice and gambling dens",
            "opium smoking dens", 
            "moral corruption",
            "yellow peril",
            "cannot be Americanized"
        ]
        
        # Encode reference texts
        self.positive_embeddings = self.sbert_model.encode(self.positive_references)
        self.negative_embeddings = self.sbert_model.encode(self.negative_references)
    
    def analyze_sentiment_sbert(self, text):
        """Use SBERT to compare with historical reference sentiments"""
        if not text or len(text.strip()) < 10:
            return {'method': 'sbert', 'sentiment': 'neutral', 'score': 0, 'confidence': 0}
        
        # Encode input text
        text_embedding = self.sbert_model.encode([text])
        
        # Calculate similarity with positive and negative references
        positive_similarity = util.pytorch_cos_sim(text_embedding, self.positive_embeddings).max().item()
        negative_similarity = util.pytorch_cos_sim(text_embedding, self.negative_embeddings).max().item()
        
        # Determine sentiment
        score = positive_similarity - negative_similarity
        confidence = max(positive_similarity, negative_similarity)
        
        if score > 0.1:
            sentiment = 'positive'
        elif score < -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return {
            'method': 'sbert',
            'sentiment': sentiment,
            'score': score,
            'confidence': confidence,
            'positive_similarity': positive_similarity,
            'negative_similarity': negative_similarity
        }
    
    def analyze_sentiment_vader(self, text):
        """Use VADER for rule-based sentiment analysis"""
        if not text:
            return {'method': 'vader', 'sentiment': 'neutral', 'score': 0, 'confidence': 0}
        
        scores = self.vader_analyzer.polarity_scores(text)
        compound = scores['compound']
        
        if compound >= 0.05:
            sentiment = 'positive'
        elif compound <= -0.05:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return {
            'method': 'vader',
            'sentiment': sentiment,
            'score': compound,
            'confidence': abs(compound),
            'details': scores
        }
    
    def analyze_sentiment_textblob(self, text):
        """Use TextBlob for sentiment analysis"""
        if not text:
            return {'method': 'textblob', 'sentiment': 'neutral', 'score': 0, 'confidence': 0}
        
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        if polarity > 0.1:
            sentiment = 'positive'
        elif polarity < -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return {
            'method': 'textblob',
            'sentiment': sentiment,
            'score': polarity,
            'confidence': subjectivity,
            'subjectivity': subjectivity
        }
    
    def extract_coolie_context(self, text, window_size=150):
        """Extract context around mentions of coolie/Chinese labor"""
        if not text:
            return []
        
        # Look for various historical terms
        patterns = [
            r'coolie',
            r'chinese',
            r'chinaman',
            r'mongolian',
            r'celestial',
            r'heathen chinese',
            r'yellow peril'
        ]
        
        contexts = []
        for pattern in patterns:
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            for match in matches:
                start = max(0, match.start() - window_size)
                end = min(len(text), match.end() + window_size)
                context = text[start:end]
                contexts.append({
                    'term': match.group(),
                    'context': context,
                    'preceding': text[max(0, match.start()-50):match.start()],
                    'following': text[match.end():min(len(text), match.end()+50)]
                })
        
        return contexts
    
    def comprehensive_analysis(self, text):
        """Combine multiple sentiment analysis methods with historical context"""
        sbert_result = self.analyze_sentiment_sbert(text)
        vader_result = self.analyze_sentiment_vader(text)
        textblob_result = self.analyze_sentiment_textblob(text)
        contexts = self.extract_coolie_context(text)
        
        # Weighted consensus (favor SBERT for historical context)
        methods = [sbert_result, vader_result, textblob_result]
        weights = [0.5, 0.25, 0.25]  # SBERT gets higher weight for historical accuracy
        
        sentiments = [m['sentiment'] for m in methods]
        scores = [m['score'] for m in methods]
        confidences = [m['confidence'] for m in methods]
        
        # Calculate weighted score
        weighted_score = sum(s * w for s, w in zip(scores, weights))
        
        # Determine final sentiment
        if weighted_score > 0.05:
            final_sentiment = 'positive'
        elif weighted_score < -0.05:
            final_sentiment = 'negative'
        else:
            final_sentiment = 'neutral'
        
        return {
            'final_sentiment': final_sentiment,
            'final_score': weighted_score,
            'agreement': len(set(sentiments)) == 1,  # True if all methods agree
            'contexts_found': len(contexts),
            'contexts': contexts,
            'methods': {
                'sbert': sbert_result,
                'vader': vader_result,
                'textblob': textblob_result
            }
        }

def analyze_newspaper_dataset(csv_file):
    """Analyze sentiment for an entire newspaper dataset"""
    try:
        df = pd.read_csv(csv_file)
    except FileNotFoundError:
        print(f"File {csv_file} not found. Please run the scraper first.")
        return
    
    analyzer = HistoricalSentimentAnalyzer()
    results = []
    
    print("🧠 Analyzing historical sentiment for newspaper articles...")
    
    for idx, row in df.iterrows():
        content = str(row.get('content_preview', '')) or str(row.get('title', ''))
        
        if len(content) > 20:  # Only analyze if there's substantial text
            analysis = analyzer.comprehensive_analysis(content)
            
            result = {
                'date': row.get('date', ''),
                'newspaper': row.get('newspaper', ''),
                'title': row.get('title', ''),
                'keyword_matches': row.get('keyword_matches', 0),
                'sentiment': analysis['final_sentiment'],
                'sentiment_score': analysis['final_score'],
                'agreement': analysis['agreement'],
                'contexts_found': analysis['contexts_found'],
                'sbert_score': analysis['methods']['sbert']['score'],
                'vader_score': analysis['methods']['vader']['score'],
                'textblob_score': analysis['methods']['textblob']['score']
            }
            
            # Add first context if available
            if analysis['contexts']:
                result['example_context'] = analysis['contexts'][0]['context']
            
            results.append(result)
        
        if (idx + 1) % 50 == 0:
            print(f"Processed {idx + 1} articles...")
    
    # Create results DataFrame
    results_df = pd.DataFrame(results)
    
    # Save results
    output_file = csv_file.replace('.csv', '_sentiment.csv')
    results_df.to_csv(output_file, index=False)
    
    # Print summary
    print(f"\n📊 SENTIMENT ANALYSIS SUMMARY")
    print(f"Total articles analyzed: {len(results_df)}")
    print(f"Positive: {len(results_df[results_df['sentiment'] == 'positive'])}")
    print(f"Negative: {len(results_df[results_df['sentiment'] == 'negative'])}") 
    print(f"Neutral: {len(results_df[results_df['sentiment'] == 'neutral'])}")
    print(f"Results saved to: {output_file}")
    
    # Show examples of each sentiment
    print(f"\n🔍 SENTIMENT EXAMPLES:")
    
    positive_examples = results_df[results_df['sentiment'] == 'positive'].head(2)
    negative_examples = results_df[results_df['sentiment'] == 'negative'].head(2)
    
    if not positive_examples.empty:
        print(f"\n📈 POSITIVE EXAMPLES:")
        for _, example in positive_examples.iterrows():
            print(f"   {example['date']} - {example['newspaper']}")
            if 'example_context' in example and pd.notna(example['example_context']):
                print(f"   Context: {example['example_context']}")
            print(f"   Score: {example['sentiment_score']:.3f}\n")
    
    if not negative_examples.empty:
        print(f"📉 NEGATIVE EXAMPLES:")
        for _, example in negative_examples.iterrows():
            print(f"   {example['date']} - {example['newspaper']}")
            if 'example_context' in example and pd.notna(example['example_context']):
                print(f"   Context: {example['example_context']}")
            print(f"   Score: {example['sentiment_score']:.3f}\n")
    
    return results_df

# Example usage and testing
if __name__ == "__main__":
    analyzer = HistoricalSentimentAnalyzer()
    
    # Test with historically accurate examples
    test_texts = [
        "The Chinese coolies have proven to be industrious and peaceful workers in our mines",
        "We must restrict coolie labor as it threatens white labor and drives down wages",
        "The heathen Chinese with their filthy habits cannot be Americanized",
        "These quiet and law abiding people have been faithful servants on the railroad",
        "The yellow peril brings vice and gambling dens that cause moral corruption"
    ]
    
    print("🧪 TESTING HISTORICAL SENTIMENT ANALYSIS")
    print("=========================================\n")
    
    for text in test_texts:
        print(f"Text: {text}")
        result = analyzer.comprehensive_analysis(text)
        print(f"Sentiment: {result['final_sentiment']} (Score: {result['final_score']:.3f})")
        print(f"Methods agree: {result['agreement']}")
        if result['contexts']:
            print(f"Context found: {result['contexts'][0]['context']}")
        print("---\n")
    
    # Check if we have data to analyze
    import os
    if os.path.exists('coolie_comprehensive_articles.csv'):
        print("📊 ANALYZING EXISTING DATASET...")
        analyze_newspaper_dataset('coolie_comprehensive_articles.csv')
    else:
        print("💡 Run the scraper first to generate data, then run this analyzer.")
        print("   Or use: analyze_newspaper_dataset('your_csv_file.csv')")
