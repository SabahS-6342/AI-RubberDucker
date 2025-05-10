from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import re
import sqlite3
import requests
from bs4 import BeautifulSoup
import uvicorn

app = FastAPI()

MODEL_NAME = "gpt2"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)

chat_history = []


class ChatRequest(BaseModel):
    message: str


def search_database(user_input):
    conn = sqlite3.connect("chatbot_knowledge.db")
    cursor = conn.cursor()
    cursor.execute("SELECT answer FROM knowledge WHERE question LIKE ?", (f"%{user_input}%",))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None


def search_google(query):
    try:
        url = f"https://www.google.com/search?q={query}"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, "html.parser")

        snippet = soup.find("div", class_="BNeawe").text
        return snippet
    except Exception:
        return "Sorry, I couldn't retrieve information from Google."


def is_code(user_input):
    return bool(re.match(r"^\s*(def|class|for|if|import|print|return|while).*", user_input))


def provide_code_feedback(user_input):
    feedback = "Here’s some feedback on your code:\n"
    if "def " in user_input and '"""' not in user_input:
        feedback += "- Missing docstring in your function.\n"
    if "x =" in user_input and "x" not in user_input.split("=")[1]:
        feedback += "- Variable 'x' is defined but might not be used.\n"
    if re.search(r"def .+\)", user_input) and not re.search(r"def .+\(.*\):", user_input):
        feedback += "- Check your function definition syntax.\n"
    if re.search(r"\s{2,}", user_input):
        feedback += "- Extra spaces detected. Clean up your indentation.\n"
    feedback += "- Make sure to test your code thoroughly."
    return feedback


def generate_response(user_input):
    global chat_history
    chat_history.append(f"User: {user_input}")

    if is_code(user_input):
        feedback = provide_code_feedback(user_input)
        chat_history.append(f"AI: {feedback}")
        return feedback

    db_answer = search_database(user_input)
    if db_answer:
        chat_history.append(f"AI: {db_answer}")
        return db_answer

    google_answer = search_google(user_input)
    if google_answer and "Sorry" not in google_answer:
        chat_history.append(f"AI: {google_answer}")
        return google_answer

    input_text = "\n".join(chat_history) + "\nAI:"
    inputs = tokenizer(input_text, return_tensors="pt")
    output = model.generate(**inputs, max_length=150, pad_token_id=tokenizer.eos_token_id)
    response = tokenizer.decode(output[0], skip_special_tokens=True)

    chat_history.append(f"AI: {response}")
    chat_history = chat_history[-10:]  # Limit history
    return response


@app.post("/chat")
async def chat(request: ChatRequest):
    user_input = request.message.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="Empty message")

    response = generate_response(user_input)
    return {"response": response, "history": chat_history}


if __name__ == "__main__":
    uvicorn.run("chatbot:app", host="0.0.0.0", port=5000, reload=True)


