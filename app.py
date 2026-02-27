import streamlit as st
import json
from backend.agent import explain_data

st.set_page_config(
    page_title="Data Report Agent",
    page_icon="🔍",
    layout="centered"
)

st.markdown("""
<style>
    /* Page background */
    .stApp {
        background-color: #f9fafb;
    }

    /* Main card area */
    .block-container {
        background: white;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        padding: 2rem 2.5rem;
        max-width: 640px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }

    /* Headings */
    h1 {
        font-size: 28px !important;
        font-weight: 700 !important;
        color: #111827 !important;
        letter-spacing: -0.5px;
    }

    /* Primary button */
    .stButton > button {
        background-color: #2563eb;
        color: white;
        border: none;
        border-radius: 10px;
        padding: 12px 24px;
        font-weight: 600;
        width: 100%;
        transition: all 0.15s ease;
    }
    .stButton > button:hover {
        background-color: #1d4ed8;
        box-shadow: 0 4px 16px rgba(37,99,235,0.3);
        transform: translateY(-1px);
    }

    /* Radio buttons */
    .stRadio > div {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 12px;
    }

    /* File uploader */
    .stFileUploader {
        border: 1.5px dashed #d1d5db;
        border-radius: 10px;
        padding: 16px;
        background: #fafafa;
    }

    /* Hide Streamlit branding */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
</style>
""", unsafe_allow_html=True)

st.title("🔍 Data Report Agent")
st.caption("Your data never leaves your machine — AI runs locally via Ollama.")
st.divider()

uploaded_file = st.file_uploader(
    "Upload your CSV file",
    type=["csv"],
    help="Your file stays local. Nothing is sent to the cloud."
)

mode = st.radio(
    "What kind of report do you want?",
    options=["summary", "ds"],
    format_func=lambda x: "📋 General Summary — plain English overview" if x == "summary" else "🔬 Data Scientist — technical analysis with code fixes",
    horizontal=True
)

st.divider()

if uploaded_file is not None:

    # Warn if file is large
    file_size_mb = uploaded_file.size / (1024 * 1024)
    if file_size_mb > 50:
        st.warning(f"⚠️ Large file detected ({file_size_mb:.1f} MB). The profiler will sample 100,000 rows for performance.")
    
    temp_path = f"/tmp/{uploaded_file.name}"
    with open(temp_path, "wb") as f:
        f.write(uploaded_file.getbuffer())

    st.success(f"✅ File loaded: **{uploaded_file.name}** ({file_size_mb:.1f} MB)")

    if st.button("🚀 Generate Report", type="primary", use_container_width=True):
        with st.spinner("Analysing your data and generating report... (this takes 20-40 seconds)"):
            try:
                profile, report = explain_data(temp_path, mode=mode)

                # Dataset overview metrics
                st.subheader("📊 Dataset Overview")
                col1, col2, col3, col4 = st.columns(4)
                col1.metric("Rows", f"{profile['total_rows']:,}")
                col2.metric("Columns", profile['total_columns'])
                null_cols = sum(1 for c in profile['columns'] if c['null_percent'] > 0)
                col3.metric("Columns with Nulls", null_cols)
                outlier_cols = sum(1 for c in profile['columns'] if c.get('outlier_count', 0) > 0)
                col4.metric("Columns with Outliers", outlier_cols)

                # Sampled warning
                if profile['was_sampled']:
                    st.info("ℹ️ File was very large — report is based on a 100,000 row sample.")

                # Removed empty columns warning
                if profile['empty_columns_removed']:
                    st.warning(f"⚠️ {len(profile['empty_columns_removed'])} completely empty column(s) were removed: {', '.join(profile['empty_columns_removed'])}")

                st.divider()

                # Report
                st.subheader("📋 General Summary" if mode == "summary" else "🔬 Technical Analysis")
                st.markdown(report)

                st.divider()

                # Export
                st.subheader("📥 Export")
                col1, col2 = st.columns(2)
                with col1:
                    st.download_button(
                        label="⬇️ Download Report (.txt)",
                        data=report,
                        file_name=f"report_{uploaded_file.name}.txt",
                        mime="text/plain",
                        use_container_width=True
                    )
                with col2:
                    st.download_button(
                        label="⬇️ Download Profile (.json)",
                        data=json.dumps(profile, indent=2),
                        file_name=f"profile_{uploaded_file.name}.json",
                        mime="application/json",
                        use_container_width=True
                    )

            except ConnectionError:
                st.error("❌ Cannot connect to Ollama.")
                st.info("In your terminal, run: `ollama serve` — then try again.")
            except Exception as e:
                st.error(f"❌ Something went wrong: {str(e)}")

else:
    st.info("👆 Upload a CSV file to get started.")
