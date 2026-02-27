import ollama
import json
from profiler import profile_dataset

def build_summary_prompt(profile):
    return f"""
You have been given a statistical profile of a dataset called "{profile['filename']}".
It has {profile['total_rows']} rows and {profile['total_columns']} columns.
{'Note: this is a sample of a larger file.' if profile['was_sampled'] else ''}

Here are the column statistics:
{json.dumps(profile['columns'], indent=2)}

Write a clear, plain-English report that:
1. Describes what this dataset appears to contain in 2-3 sentences
2. Summarises each column — what it represents and what the values look like
3. Flags anything unusual or worth knowing (missing values, odd ranges, etc.)
4. Ends with a short overall assessment of the dataset's completeness and reliability

Use simple language. Write in paragraphs. Avoid statistical jargon.
"""


def build_ds_prompt(profile):
    return f"""
You are a senior data scientist reviewing a dataset for quality issues.

Dataset: "{profile['filename']}"
Rows: {profile['total_rows']} | Columns: {profile['total_columns']}
{'Note: this is a sample of a larger file.' if profile['was_sampled'] else ''}

Column statistics:
{json.dumps(profile['columns'], indent=2)}

Provide a detailed technical data quality report that:
1. Identifies every data quality issue per column (nulls, outliers, skew,
   cardinality issues, suspicious value ranges, type mismatches)
2. Explains why each issue matters for downstream modelling or analysis
3. Suggests a concrete fix for each issue with working pandas code
4. Gives an overall data quality score out of 10 with justification

Format each issue as:
- ISSUE: what is wrong
- IMPACT: why it matters
- FIX: pandas code to resolve it
"""


def explain_data(filepath, mode="summary"):
    print(f"📊 Profiling dataset...")
    profile = profile_dataset(filepath)

    print(f"🧠 Generating report...")
    prompt = build_summary_prompt(profile) if mode == "summary" else build_ds_prompt(profile)

    response = ollama.chat(
        model="llama3",
        # System prompt keeps output consistent across runs
        messages=[
            {
                "role": "system",
                "content": "You are a precise, concise data analyst. Always structure your reports clearly. Never make up data that wasn't provided."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return profile, response["message"]["content"]