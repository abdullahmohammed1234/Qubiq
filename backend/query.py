"""
Query Module - Retrieval System and Gemini Integration
=========================================================

This module handles:
1. Loading the FAISS vector index
2. Similarity-based retrieval (top-k)
3. Google Gemini API integration
4. Anti-hallucination prompting
5. Response formatting

Author: Qubiq AI Team
"""

import os
import pickle
from typing import List, Tuple, Dict, Any, Optional
import numpy as np

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# For embeddings
from sentence_transformers import SentenceTransformer

# For FAISS
import faiss

# For Gemini API - support both old and new packages
GEMINI_CLIENT = None
USE_NEW_GEMINI = False
GEMINI_API_KEY = None

try:
    # Try new google.genai package first
    import google.genai as genai
    GEMINI_CLIENT = genai
    USE_NEW_GEMINI = True
except ImportError:
    try:
        # Fallback to deprecated google.generativeai
        import google.generativeai as genai
        GEMINI_CLIENT = genai
        USE_NEW_GEMINI = False
    except ImportError:
        print("Warning: No Gemini package available. Install google-genai or google-generativeai")


# ============================================================================
# CONFIGURATION
# ============================================================================

# Gemini model configuration
GEMINI_MODEL_NAME = "gemini-2.5-flash-lite"  # Fast and capable model
GEMINI_TEMPERATURE = 0.3                # Low temperature for factual consistency
GEMINI_MAX_TOKENS = 500                 # Limit response length

# Retrieval configuration
TOP_K = 3                               # Number of chunks to retrieve

# Paths - use absolute path based on script location
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_DIR = os.path.join(BASE_DIR, "data")


# ============================================================================
# ANTI-HALLUCINATION PROMPTING SYSTEM
# ============================================================================

# System prompt that forces grounded, beginner-friendly responses
SYSTEM_PROMPT = """You are an AI tutor for quantum computing, designed to help beginners learn.

IMPORTANT INSTRUCTIONS:
1. You MUST only answer using the context provided below
2. If the answer is NOT in the context, say "I don't have enough information about that."
3. Always explain concepts in simple, beginner-friendly terms
4. Use analogies when helpful
5. If the question is unclear, ask for clarification
6. Never make up information - only use what's provided

Response format:
- Begin with a direct answer
- Then explain in simple terms
- Use the retrieved context as your sole source of truth
"""


def build_rag_prompt(context: str, question: str) -> str:
    """
    Build the prompt for Gemini with retrieved context.
    
    Args:
        context: Retrieved context chunks concatenated
        question: User's question
        
    Returns:
        Formatted prompt for Gemini
    """
    prompt = f"""{SYSTEM_PROMPT}

RETRIEVED CONTEXT:
==================
{context}

USER QUESTION:
==============
{question}

Your answer (using only the context above):
"""
    return prompt


# ============================================================================
# INDEX AND RETRIEVAL
# ============================================================================

class QuantumRAG:
    """
    RAG system for quantum computing knowledge base.
    
    Handles:
    - Loading the FAISS index
    - Similarity search retrieval
    - Gemini API integration
    """
    
    def __init__(self, index_dir: str = INDEX_DIR):
        """
        Initialize the RAG system.
        
        Args:
            index_dir: Directory containing the FAISS index and metadata
        """
        self.index_dir = index_dir
        self.index = None
        self.chunks = None
        self.embedding_model = None
        self.gemini_model = None
        self.is_loaded = False
        
        # Load everything
        self._load_index()
        self._load_embedding_model()
        self._configure_gemini()
    
    
    def _load_index(self):
        """Load the FAISS index and chunk metadata from disk."""
        index_path = os.path.join(self.index_dir, "faiss_index.bin")
        chunks_path = os.path.join(self.index_dir, "chunks.pkl")
        
        if not os.path.exists(index_path):
            print(f"Warning: Index not found at {index_path}")
            print("Run ingest.py first to build the index!")
            return
        
        # Load FAISS index
        self.index = faiss.read_index(index_path)
        print(f"Loaded FAISS index with {self.index.ntotal} vectors")
        
        # Load chunks metadata
        with open(chunks_path, 'rb') as f:
            self.chunks = pickle.load(f)
        print(f"Loaded {len(self.chunks)} chunks")
    
    
    def _load_embedding_model(self):
        """Load the sentence-transformers model for embeddings."""
        config_path = os.path.join(self.index_dir, "config.pkl")
        
        with open(config_path, 'rb') as f:
            config = pickle.load(f)
        
        model_name = config.get("model_name", "sentence-transformers/all-MiniLM-L6-v2")
        print(f"Loading embedding model: {model_name}...")
        
        self.embedding_model = SentenceTransformer(model_name)
        print("Embedding model loaded")
    
    
    def _configure_gemini(self):
        """Configure and initialize the Gemini API."""
        global GEMINI_CLIENT, USE_NEW_GEMINI
        
        if GEMINI_CLIENT is None:
            print("Warning: No Gemini client available")
            return
        
        # Get API key from environment
        api_key = os.environ.get("GEMINI_API_KEY")
        
        if not api_key:
            print("Warning: GEMINI_API_KEY not found in environment")
            print("Set the GEMINI_API_KEY environment variable to enable AI responses")
            return
        
        try:
            if USE_NEW_GEMINI:
                # New google.genai package - use Client directly
                self.gemini_client = GEMINI_CLIENT.Client(api_key=api_key)
                # Store model name for use in generate_content
                self.gemini_model_name = GEMINI_MODEL_NAME
            else:
                # Legacy google.generativeai package
                GEMINI_CLIENT.configure(api_key=api_key)
                generation_config = {
                    "temperature": GEMINI_TEMPERATURE,
                    "max_output_tokens": GEMINI_MAX_TOKENS,
                    "top_p": 0.95,
                    "top_k": 40,
                }
                self.gemini_model = GEMINI_CLIENT.GenerativeModel(
                    model_name=GEMINI_MODEL_NAME,
                    generation_config=generation_config,
                    system_instruction=SYSTEM_PROMPT
                )
            
            print(f"Gemini model '{GEMINI_MODEL_NAME}' initialized (new_api={USE_NEW_GEMINI})")
            self.is_loaded = True
            
        except Exception as e:
            print(f"Error configuring Gemini: {e}")
            self.is_loaded = False
    
    
    def retrieve(self, query: str, top_k: int = TOP_K) -> List[Tuple[str, float, str]]:
        """
        Retrieve the most relevant chunks for a query.
        
        Args:
            query: User's question
            top_k: Number of chunks to retrieve
            
        Returns:
            List of (chunk_text, similarity_score, topic) tuples
        """
        if self.index is None or self.chunks is None:
            print("Error: Index not loaded")
            return []
        
        # Encode the query
        query_embedding = self.embedding_model.encode([query])
        
        # Normalize for cosine similarity
        query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)
        
        # Search the index
        scores, indices = self.index.search(query_embedding, top_k)
        
        # Build results
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(self.chunks):
                chunk_text, topic = self.chunks[idx]
                results.append((chunk_text, float(score), topic))
        
        return results
    
    
    def format_context(self, retrieved_chunks: List[Tuple[str, float, str]]) -> str:
        """
        Format retrieved chunks into a context string.
        
        Args:
            retrieved_chunks: List of (text, score, topic) tuples
            
        Returns:
            Formatted context string
        """
        context_parts = []
        
        for i, (chunk, score, topic) in enumerate(retrieved_chunks):
            # Add source marker
            source_marker = f"\n[Source {i+1}"
            if topic:
                source_marker += f": {topic}"
            source_marker += "]\n"
            
            context_parts.append(source_marker + chunk)
        
        return "\n---\n".join(context_parts)
    
    
    def generate_answer(self, question: str, retrieved_chunks: List[Tuple[str, float, str]]) -> Dict[str, Any]:
        """
        Generate an answer using Gemini with retrieved context.
        
        Args:
            question: User's question
            retrieved_chunks: Retrieved context chunks
            
        Returns:
            Dictionary with answer and sources
        """
        if not self.is_loaded or (not hasattr(self, 'gemini_model') and not hasattr(self, 'gemini_client')):
            return {
                "answer": "AI model not available. Please set GEMINI_API_KEY environment variable.",
                "sources": [],
                "error": "Gemini not configured"
            }
        
        # Check if retrieval scores are too low (not relevant context)
        if retrieved_chunks:
            avg_score = sum(score for _, score, _ in retrieved_chunks) / len(retrieved_chunks)
            if avg_score < 0.15:  # Low relevance threshold
                return {
                    "answer": "I don't have enough information to answer that question. This system only knows about quantum computing topics.",
                    "sources": [],
                    "num_sources": 0,
                    "error": "Low relevance"
                }
        
        # Format context
        context = self.format_context(retrieved_chunks)
        
        # Build prompt
        prompt = build_rag_prompt(context, question)
        
        # Generate response
        try:
            if USE_NEW_GEMINI and hasattr(self, 'gemini_client'):
                # New google.genai API
                response = self.gemini_client.models.generate_content(
                    model=self.gemini_model_name,
                    contents=prompt
                )
            else:
                # Legacy API
                response = self.gemini_model.generate_content(prompt)
            
            answer = response.text
            
            # Extract sources (chunk text snippets)
            sources = [chunk[:150] + "..." if len(chunk) > 150 else chunk 
                      for chunk, _, _ in retrieved_chunks]
            
            return {
                "answer": answer,
                "sources": sources,
                "num_sources": len(retrieved_chunks)
            }
            
        except Exception as e:
            print(f"Error generating answer: {e}")
            error_msg = str(e)
            # Check for quota errors
            if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
                return {
                    "answer": "I'm temporarily unable to generate an answer due to API quota limits. Please try again later or use your own Gemini API key from https://aistudio.google.com/app/apikey",
                    "sources": [],
                    "error": "Quota exceeded"
                }
            # Check for other API errors
            return {
                "answer": f"I encountered an error: {error_msg[:100]}...",
                "sources": [],
                "error": str(e)[:100]
            }
    
    
    def query(self, question: str, top_k: int = TOP_K) -> Dict[str, Any]:
        """
        Full RAG pipeline: retrieve + generate.
        
        Args:
            question: User's question
            top_k: Number of chunks to retrieve
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        # Check if system is ready
        if self.index is None:
            return {
                "answer": "Knowledge base not loaded. Please run the ingestion pipeline first.",
                "sources": [],
                "error": "Index not loaded"
            }
        
        # Retrieve relevant chunks
        retrieved_chunks = self.retrieve(question, top_k)
        
        if not retrieved_chunks:
            return {
                "answer": "I couldn't find relevant information to answer your question.",
                "sources": [],
                "error": "No retrieval results"
            }
        
        # Print retrieval scores for debugging
        print("\nRetrieval Results:")
        for i, (chunk, score, topic) in enumerate(retrieved_chunks):
            print(f"  {i+1}. [Score: {score:.3f}] {topic}: {chunk[:60]}...")
        
        # Generate answer with Gemini
        result = self.generate_answer(question, retrieved_chunks)
        
        # Add retrieval info
        result["retrieval_scores"] = [score for _, score, _ in retrieved_chunks]
        
        return result


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_rag_system(index_dir: str = INDEX_DIR) -> Optional[QuantumRAG]:
    """
    Create and initialize the RAG system.
    
    Args:
        index_dir: Directory containing the index
        
    Returns:
        QuantumRAG instance or None if failed
    """
    try:
        rag = QuantumRAG(index_dir)
        
        if rag.index is None:
            print("Error: Failed to load the index")
            return None
        
        return rag
        
    except Exception as e:
        print(f"Error creating RAG system: {e}")
        return None


# ============================================================================
# STANDALONE TEST
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("QUANTUM RAG SYSTEM - QUERY MODULE TEST")
    print("=" * 60)
    print(f"Using new Gemini API: {USE_NEW_GEMINI}")
    
    # Check for API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\n⚠️  GEMINI_API_KEY not set!")
        print("Please set it with: export GEMINI_API_KEY='your-key'")
        print("(Windows CMD: set GEMINI_API_KEY=your-key)")
        print("(Windows PowerShell: $env:GEMINI_API_KEY='your-key')")
    
    # Create RAG system
    print("\nInitializing RAG system...")
    rag = create_rag_system()
    
    if rag:
        # Test queries
        test_questions = [
            "What is superposition?",
            "How does quantum error correction work?",
            "What are the main quantum computing approaches?"
        ]
        
        for question in test_questions:
            print(f"\n{'='*60}")
            print(f"Question: {question}")
            print(f"{'='*60}")
            
            result = rag.query(question)
            
            print(f"\nAnswer:\n{result['answer']}")
            print(f"\nSources: {result.get('num_sources', 0)} chunks retrieved")
    else:
        print("Failed to initialize RAG system")
