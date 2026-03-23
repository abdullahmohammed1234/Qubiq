"""
Qubiq Backend - FastAPI Application with RAG Pipeline
AI-powered quantum computing tutor using LangChain
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

# Try multiple import paths for LangChain compatibility
try:
    # Try newer LangChain (0.3+) - chains moved to langchain
    from langchain.chains import RetrievalQA
except ImportError:
    try:
        # Try langchain-community
        from langchain_community.chains import RetrievalQA
    except ImportError:
        RetrievalQA = None

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
except ImportError:
    try:
        from langchain_community.text_splitter import RecursiveCharacterTextSplitter
    except ImportError:
        RecursiveCharacterTextSplitter = None

try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_community.vectorstores import FAISS
    from langchain_community.llms import HuggingFaceHub
    from langchain.schema import Document
except ImportError as e:
    print(f"Import error: {e}")
    HuggingFaceEmbeddings = None
    FAISS = None
    HuggingFaceHub = None
    Document = None

app = FastAPI(title="Qubiq API", version="1.0.1")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class AskRequest(BaseModel):
    question: str

# Response model
class AskResponse(BaseModel):
    answer: str
    sources: Optional[list] = None


# Global variables for RAG pipeline
qa_chain = None
vectorstore = None
rag_enabled = False


def simple_text_splitter(text, chunk_size=500, chunk_overlap=50):
    """Simple fallback text splitter if LangChain's is unavailable"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - chunk_overlap
    return chunks


class SimpleDocument:
    """Fallback document class"""
    def __init__(self, page_content, metadata=None):
        self.page_content = page_content
        self.metadata = metadata or {}


def load_knowledge_base():
    """
    Load the quantum computing knowledge base and create RAG pipeline
    """
    global qa_chain, vectorstore, rag_enabled
    
    # Check if required imports are available
    if not all([RetrievalQA, HuggingFaceEmbeddings, FAISS, HuggingFaceHub]):
        print("Warning: Not all LangChain modules available. RAG may not work fully.")
        return False
    
    # Path to the knowledge base file
    data_path = os.path.join(os.path.dirname(__file__), "data", "quantum_docs.txt")
    
    # Check if file exists
    if not os.path.exists(data_path):
        print(f"Warning: Knowledge base file not found at {data_path}")
        return False
    
    try:
        # Read the knowledge base
        with open(data_path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Split text into chunks using LangChain or fallback
        if RecursiveCharacterTextSplitter:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=50,
                length_function=len
            )
            chunks = text_splitter.split_text(text)
        else:
            print("Using simple text splitter fallback")
            chunks = simple_text_splitter(text)
        
        # Create documents
        doc_class = Document if Document else SimpleDocument
        documents = [doc_class(page_content=chunk, metadata={"source": "quantum_docs"}) for chunk in chunks]
        
        # Create embeddings (using a lightweight model)
        print("Loading embeddings model...")
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        
        # Create vector store
        print("Creating vector store...")
        vectorstore = FAISS.from_documents(documents, embeddings)
        
        # Create QA chain with HuggingFace Hub
        print("Loading language model...")
        try:
            llm = HuggingFaceHub(
                repo_id="google/flan-t5-base",
                model_kwargs={"temperature": 0.5, "max_length": 512}
            )
            
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
                return_source_documents=True
            )
            rag_enabled = True
            print("RAG pipeline loaded successfully!")
        except Exception as e:
            print(f"Warning: Could not initialize HuggingFace Hub: {e}")
            print("The API will work but with limited AI responses")
            qa_chain = None
            
        return True
        
    except Exception as e:
        print(f"Error loading knowledge base: {e}")
        return False


@app.on_event("startup")
async def startup_event():
    """Load knowledge base on startup"""
    print("Loading quantum computing knowledge base...")
    load_knowledge_base()
    print("Qubiq API ready!")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Qubiq API",
        "version": "1.0.1",
        "status": "running",
        "description": "AI-powered quantum computing tutor with RAG"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "rag_enabled": rag_enabled,
        "vectorstore_loaded": vectorstore is not None
    }


@app.post("/api/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """
    Answer a quantum computing question using RAG
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        if qa_chain is not None and rag_enabled:
            # Use RAG pipeline
            result = qa_chain({"query": request.question})
            
            # Extract answer and sources
            answer = result.get("result", "I don't have enough information to answer that.")
            source_docs = result.get("source_documents", [])
            sources = [doc.page_content[:100] + "..." for doc in source_docs[:3]]
            
            return AskResponse(answer=answer, sources=sources)
        else:
            # Fallback response when RAG is not available
            return AskResponse(
                answer="I'm currently operating in demo mode. The RAG pipeline requires additional setup or the language model couldn't be loaded. Please ensure you have HuggingFace Hub configured and try again.",
                sources=["Demo mode"]
            )
            
    except Exception as e:
        print(f"Error processing question: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
