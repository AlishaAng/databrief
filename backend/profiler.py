import pandas as pd
import json

def profile_dataset(filepath, max_rows=100_000):
    """
    Loads a CSV and extracts statistics only.
    Handles large files, bad encodings, and messy data gracefully.
    """

    # --- Load the file safely ---
    try:
        df = pd.read_csv(filepath, encoding="utf-8")
    except UnicodeDecodeError:
        # Some files use a different encoding — try latin-1 as fallback
        df = pd.read_csv(filepath, encoding="latin-1")

    # --- Warn if file is very large, sample it ---
    was_sampled = False
    if len(df) > max_rows:
        df = df.sample(n=max_rows, random_state=42)
        was_sampled = True

    # --- Drop completely empty columns ---
    empty_cols = df.columns[df.isnull().all()].tolist()
    df = df.dropna(axis=1, how="all")

    profile = {
        "filename": filepath.split("/")[-1],
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "was_sampled": was_sampled,
        "empty_columns_removed": empty_cols,
        "columns": []
    }

    for col in df.columns:
        col_data = df[col]

        col_info = {
            "name": col,
            "type": str(col_data.dtype),
            "null_count": int(col_data.isnull().sum()),
            "null_percent": round(col_data.isnull().mean() * 100, 1),
            "unique_values": int(col_data.nunique()),
        }

        # Numeric columns
        if pd.api.types.is_numeric_dtype(col_data):
            q1 = col_data.quantile(0.25)
            q3 = col_data.quantile(0.75)
            iqr = q3 - q1
            outlier_count = int(((col_data < q1 - 1.5 * iqr) | (col_data > q3 + 1.5 * iqr)).sum())

            col_info.update({
                "min": round(float(col_data.min()), 2),
                "max": round(float(col_data.max()), 2),
                "mean": round(float(col_data.mean()), 2),
                "median": round(float(col_data.median()), 2),
                "std_dev": round(float(col_data.std()), 2),
                "outlier_count": outlier_count,
            })

        # Text columns
        elif pd.api.types.is_object_dtype(col_data):
            top_values = col_data.value_counts().head(3).to_dict()
            col_info["top_values"] = {str(k): int(v) for k, v in top_values.items()}

            # Detect mixed date formats
            sample = col_data.dropna().head(200)
            formats_found = set()
            for val in sample:
                val = str(val).strip()
                if len(val) == 10 and val[4] == "-":
                    formats_found.add("YYYY-MM-DD")
                elif len(val) == 10 and val[2] == "/":
                    formats_found.add("DD/MM/YYYY")
                elif len(val) == 8 and val[2] == "/":
                    formats_found.add("DD/MM/YY")
            if len(formats_found) > 1:
                col_info["date_format_warning"] = f"Multiple formats detected: {formats_found}"

        profile["columns"].append(col_info)

    return profile


if __name__ == "__main__":
    profile = profile_dataset("sample.csv")
    print(json.dumps(profile, indent=2)) # For debugging, can be removed later