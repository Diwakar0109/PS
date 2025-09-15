###     PART    ------   1    -------


import pandas as pd

# Load the dataset
file_path = r"C:\Users\Suriya\BIT_PROJECTS\PS_ML\ml2\backend\data\datasets\ds\reviews.txt"
df = pd.read_csv(file_path)

# Inspect first few rows
print(df.head())
import nltk
from nltk.tokenize import word_tokenize

# Download tokenizer if not already
# nltk.download('punkt')

# Tokenize each review
df['Tokenized Review'] = df['Review'].apply(lambda x: word_tokenize(x))

# Check first 8 tokenized reviews   
print("Tokenized Reviews:", df['Tokenized Review'].head(8).tolist())


    ###     PART    ------   2    -------


# Define mapping
sentiment_map = {
    "Positive": 1,
    "Negative": 0,
    "Neutral": 2
}

# Apply mapping
df['Numerical Sentiment'] = df['Sentiment'].map(sentiment_map)

# Check first 8 numerical sentiments
print("Numerical Sentiment:", df['Numerical Sentiment'].head(8).tolist())





    ###     PART    ------   3    -------

# Rename columns to match required format
df_to_save = df.rename(columns={
    'Review': 'Original Review',
    'Tokenized Review': 'Tokenized Review',
    'Sentiment': 'Original Sentiment',
    'Numerical Sentiment': 'Numerical Sentiment'
})

# Save to CSV with specific column order
df_to_save = df_to_save[['Original Review', 'Tokenized Review', 'Original Sentiment', 'Numerical Sentiment']]
df_to_save.to_csv("tokenized_sentiment.csv", index_label='Index')

print("Saved tokenized and encoded dataset with correct column names to 'tokenized_sentiment.csv'")
