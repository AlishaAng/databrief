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
    backtick = "```"
    return f"""
You are a senior data scientist conducting a thorough data quality audit.

Dataset: "{profile['filename']}"
Rows: {profile['total_rows']} | Columns: {profile['total_columns']}
{'Note: this is a sample of a larger file.' if profile.get('was_sampled') else ''}

Column statistics:
{json.dumps(profile['columns'], indent=2)}

Produce a structured technical data quality report using EXACTLY this format.
Do not add any extra text, asterisks, or markdown outside of what is shown below.
Each section must be separated by a line containing only three dashes: ---

---
## Data Quality Score: [X/10]
[One sentence justifying the score]

---
## Column Analysis

For EACH column use EXACTLY this block format with no variations:

### [column name] ([data type])
STATUS: [PASS or WARNING or CRITICAL]
ISSUES: [One paragraph describing every issue. If none write: No issues detected.]
IMPACT: [One paragraph explaining why this matters for modelling or analysis.]
FIX:
{backtick}{backtick}{backtick}python
# paste working pandas code here
# if no fix needed write: # No fix required
{backtick}{backtick}{backtick}

---
## Top 3 Priority Fixes
1. [First most important fix and why]
2. [Second most important fix and why]
3. [Third most important fix and why]

---
## Overall Assessment
[2-3 sentences summarising the dataset's readiness for analysis or modelling]

STRICT RULES:
- Do NOT use double asterisks ** anywhere in your response
- Do NOT put the code inline with text — always put it in a python code block on its own line
- Do NOT skip any columns
- Do NOT add extra sections
- Reference exact column names and numbers from the statistics
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
                "content": "You are a precise, concise data analyst/scientist. Always structure your reports clearly. Never make up data that wasn't provided."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return profile, response["message"]["content"]