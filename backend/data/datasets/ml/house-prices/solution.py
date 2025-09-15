###     PART    ------   1    -------


# Part 1: Data Inspection
import pandas as pd

# Define the path to the training dataset
TRAIN_CSV_PATH = '/home/bit/Desktop/ps/ml2/backend/data/datasets/house-prices/train.csv'


try:
    # Load the training dataset
    train_df = pd.read_csv(TRAIN_CSV_PATH)

    # Calculate the number of missing values for each column
    missing_values = train_df.isnull().sum()

    # Filter the series to only include columns that have missing values
    columns_with_missing_values = missing_values[missing_values > 0]

    if columns_with_missing_values.empty:
        print("No missing values found in the training data.")
    else:
        # Iterate through the filtered series and print in the specified format
        for column, count in columns_with_missing_values.items():
            print(f"{column} {count}")

except FileNotFoundError:
    print(f"Error: The file was not found at {TRAIN_CSV_PATH}")
except Exception as e:
    print(f"An error occurred: {e}")




    ###     PART    ------   2    -------





# Part 2: Model Training & Evaluation
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# Define the path to the training dataset
TRAIN_CSV_PATH = '/home/bit/Desktop/ps/ml2/backend/data/datasets/house-prices/train.csv'


try:
    # Load the training dataset
    train_df = pd.read_csv(TRAIN_CSV_PATH)

    # --- Data Preprocessing ---
    # Separate features (X) and target (y). Drop 'Id' as it's an identifier.
    X = train_df.drop(['SalePrice', 'Id'], axis=1)
    y = train_df['SalePrice']

    # Identify numerical and categorical columns
    numerical_cols = X.select_dtypes(include=np.number).columns
    categorical_cols = X.select_dtypes(include='object').columns

    # Handle Missing Values: Fill numerical with median, categorical with mode
    for col in numerical_cols:
        X[col] = X[col].fillna(X[col].median())
    for col in categorical_cols:
        X[col] = X[col].fillna(X[col].mode()[0])

    # Convert Categorical Features to Numbers using One-Hot Encoding
    X_processed = pd.get_dummies(X, columns=categorical_cols, drop_first=True)

    # --- Model Training ---
    # Initialize the Linear Regression model
    model = LinearRegression()

    # Train the model on the preprocessed data
    model.fit(X_processed, y)

    # --- Model Evaluation ---
    # Make predictions on the same training data to evaluate its fit
    y_train_pred = model.predict(X_processed)

    # Calculate RMSE and R-squared
    rmse = np.sqrt(mean_squared_error(y, y_train_pred))
    r2 = r2_score(y, y_train_pred)

    # Print the evaluation metrics in the specified format
    print(f"Root Mean Squared Error: {rmse}")
    print(f"R-squared: {r2}")

except FileNotFoundError:
    print(f"Error: The file was not found at {TRAIN_CSV_PATH}")
except Exception as e:
    print(f"An error occurred: {e}")






    ###     PART    ------   3    -------



# Part 3: Prediction
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

# Define file paths
TRAIN_CSV_PATH = '/home/bit/Desktop/ps/ml2/backend/data/datasets/house-prices/train.csv'
TEST_CSV_PATH = '/home/bit/Desktop/ps/ml2/backend/data/datasets/house-prices/test.csv'
SUBMISSION_CSV_PATH = 'submission.csv'


try:
    # Load training and testing data
    train_df = pd.read_csv(TRAIN_CSV_PATH)
    test_df = pd.read_csv(TEST_CSV_PATH)

    # Store test IDs for the final submission file
    test_ids = test_df['Id']

    # --- Data Preprocessing ---
    # Separate features and target from training data
    X_train = train_df.drop(['SalePrice', 'Id'], axis=1)
    y_train = train_df['SalePrice']
    X_test = test_df.drop('Id', axis=1) # Features from test data

    # Combine for consistent processing
    combined_df = pd.concat([X_train, X_test], axis=0)

    # Identify column types
    numerical_cols = combined_df.select_dtypes(include=np.number).columns
    categorical_cols = combined_df.select_dtypes(include='object').columns

    # Handle Missing Values
    for col in numerical_cols:
        combined_df[col] = combined_df[col].fillna(combined_df[col].median())
    for col in categorical_cols:
        combined_df[col] = combined_df[col].fillna(combined_df[col].mode()[0])

    # One-Hot Encode Categorical Features
    combined_processed = pd.get_dummies(combined_df, columns=categorical_cols, drop_first=True)

    # Separate back into training and testing sets
    X_train_processed = combined_processed.iloc[:len(train_df)]
    X_test_processed = combined_processed.iloc[len(train_df):]

    # --- Model Training ---
    model = LinearRegression()
    model.fit(X_train_processed, y_train)

    # --- Prediction on Test Data ---
    test_predictions = model.predict(X_test_processed)

    # --- Create Submission File ---
    submission_df = pd.DataFrame({
        'Id': test_ids,
        'SalePrice': test_predictions
    })

    # Save the predictions to submission.csv
    submission_df.to_csv(SUBMISSION_CSV_PATH, index=False)


    print(submission_df.head())

except FileNotFoundError:
    print(f"Error: A dataset file was not found. Check the paths.")
except Exception as e:
    print(f"An error occurred: {e}")