import os
from typing import TypedDict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END

# Load .env from ai_engine directory
load_dotenv()

# ============================================================
# FastAPI Setup
# ============================================================
app = FastAPI(title="AI Content Engine (Python/LangGraph)")

# CORS — allow backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LangGraph State & Nodes
# ============================================================
class AgentState(TypedDict):
    prompt: str
    content: str
    iterations: int


def _get_llm():
    """Lazy initialization of Gemini LLM to avoid crash if key is missing at import time."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("API key is not set in the environment")
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
    )


def generation_node(state: AgentState):
    """Initial content generation node."""
    llm = _get_llm()
    response = llm.invoke(
        f"You are a professional content writer. Write high-quality, engaging content for the following topic:\n\n{state['prompt']}"
    )
    return {
        "content": response.content,
        "iterations": state["iterations"] + 1,
    }


def refiner_node(state: AgentState):
    """Refinement node to polish and format the content."""
    llm = _get_llm()
    response = llm.invoke(
        f"Refine and format the following content for better readability. Use clean markdown formatting:\n\n{state['content']}"
    )
    return {
        "content": response.content,
        "iterations": state["iterations"] + 1,
    }


# Build the LangGraph workflow: Generate → Refine → END
builder = StateGraph(AgentState)
builder.add_node("generate", generation_node)
builder.add_node("refine", refiner_node)
builder.set_entry_point("generate")
builder.add_edge("generate", "refine")
builder.add_edge("refine", END)
graph = builder.compile()


# ============================================================
# API Models & Routes
# ============================================================
class GenerateRequest(BaseModel):
    prompt: str


class GenerateResponse(BaseModel):
    content: str


@app.post("/generate", response_model=GenerateResponse)
async def generate_content(req: GenerateRequest):
    """Runs the LangGraph Generate → Refine pipeline."""
    try:
        inputs = {"prompt": req.prompt, "content": "", "iterations": 0}
        result = await graph.ainvoke(inputs)
        return GenerateResponse(content=result["content"])
    except ValueError as ve:
        # Missing API key
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        print(f"❌ AI Engine Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Content generation failed: {str(e)}",
        )


@app.get("/health")
def health():
    """Health check endpoint."""
    has_key = bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    return {
        "status": "ok" if has_key else "degraded",
        "engine": "Python/LangGraph/Gemini",
        "gemini_key_configured": has_key,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
