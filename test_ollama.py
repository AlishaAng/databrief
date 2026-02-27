import ollama

response = ollama.chat(
    model="llama3",
    messages=[
        {
            "role": "user",
            "content": "In 2 sentences, explain what a null value in a dataset means, as if talking to a business manager."
        }
    ]
)

print(response["message"]["content"])