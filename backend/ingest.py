"""
Ingest Module - Dataset Processing and Embedding Generation
============================================================

This module handles:
1. Loading the quantum computing knowledge base
2. Splitting text into chunks with overlap
3. Creating embeddings using sentence-transformers
4. Building and saving the FAISS vector index

Author: Qubiq AI Team
"""

import os
import pickle
import re
from typing import List, Tuple

# Embeddings and vector store
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np


# ============================================================================
# CONFIGURATION
# ============================================================================

CHUNK_SIZE = 400          # Characters per chunk (roughly 300-500 tokens)
CHUNK_OVERLAP = 50        # Overlap between chunks for context preservation
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DATA_FILE = "data/quantum_docs.txt"
INDEX_DIR = "data"


# ============================================================================
# TEXT PROCESSING
# ============================================================================

def clean_text(text: str) -> str:
    """
    Clean and normalize text content.
    
    Args:
        text: Raw text to clean
        
    Returns:
        Cleaned text
    """
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep essential punctuation
    text = re.sub(r'[^\w\s.,!?;:\-\(\)\[\]|⟩⟨]', '', text)
    return text.strip()


def extract_topic(chunk: str) -> str:
    """
    Extract topic label from chunk if present.
    
    Looks for patterns like [Topic: Name] or "TOPIC NAME" headers
    
    Args:
        chunk: Text chunk to analyze
        
    Returns:
        Topic name or empty string
    """
    # Check for [Topic: ...] pattern
    topic_match = re.search(r'\[Topic:\s*([^\]]+)\]', chunk)
    if topic_match:
        return topic_match.group(1).strip()
    
    # Check for section headers (lines in all caps followed by dashes)
    lines = chunk.split('\n')
    for line in lines:
        if re.match(r'^[A-Z][A-Z\s]+-*$', line):
            return line.replace('-', '').strip()
    
    return ""


def split_into_chunks(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[Tuple[str, str]]:
    """
    Split text into overlapping chunks while preserving topic structure.
    
    This function intelligently splits the text at logical boundaries
    (paragraphs, questions) while maintaining overlap for context.
    
    Args:
        text: Input text to split
        chunk_size: Maximum characters per chunk
        overlap: Number of overlapping characters between chunks
        
    Returns:
        List of (chunk_text, topic) tuples
    """
    chunks = []
    
    # First, split by major sections (double newlines)
    sections = re.split(r'\n\n+', text)
    
    current_chunk = ""
    current_topic = ""
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
        
        # Extract topic from section header
        topic = extract_topic(section)
        if topic:
            current_topic = topic
        
        # If adding this section would exceed chunk size, save current and start new
        if len(current_chunk) + len(section) > chunk_size:
            if current_chunk:
                chunks.append((clean_text(current_chunk), current_topic))
            
            # Start new chunk with overlap from previous
            if overlap > 0 and len(current_chunk) > overlap:
                current_chunk = current_chunk[-overlap:]
            else:
                current_chunk = ""
        
        # Add section to current chunk
        if current_chunk:
            current_chunk += "\n" + section
        else:
            current_chunk = section
    
    # Don't forget the last chunk
    if current_chunk:
        chunks.append((clean_text(current_chunk), current_topic))
    
    return chunks


# ============================================================================
# EMBEDDING AND INDEX CREATION
# ============================================================================

def create_embeddings(chunks: List[Tuple[str, str]], model_name: str = EMBEDDING_MODEL) -> Tuple[np.ndarray, SentenceTransformer]:
    """
    Create embeddings for all text chunks.
    
    Args:
        chunks: List of (text, topic) tuples
        model_name: Name of sentence-transformers model
        
    Returns:
        Tuple of (embeddings_array, model)
    """
    print(f"Loading embedding model: {model_name}...")
    model = SentenceTransformer(model_name)
    
    # Extract just the text for embedding
    texts = [chunk[0] for chunk in chunks]
    
    print(f"Generating embeddings for {len(texts)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=True)
    
    print(f"Embeddings shape: {embeddings.shape}")
    return embeddings, model


def create_faiss_index(embeddings: np.ndarray) -> faiss.Index:
    """
    Create a FAISS index from embeddings.
    
    Args:
        embeddings: Numpy array of embeddings (n_samples, n_dimensions)
        
    Returns:
        FAISS index
    """
    dimension = embeddings.shape[1]
    
    # Use Inner Product for cosine similarity (with normalized vectors)
    index = faiss.IndexFlatIP(dimension)
    
    # Normalize vectors for cosine similarity
    normalized_embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    
    index.add(normalized_embeddings)
    print(f"FAISS index created with {index.ntotal} vectors")
    
    return index


def save_index(index: faiss.Index, chunks: List[Tuple[str, str]], model: SentenceTransformer, index_dir: str = INDEX_DIR):
    """
    Save the FAISS index and metadata to disk.
    
    Args:
        index: FAISS index
        chunks: List of (text, topic) tuples
        model: SentenceTransformer model
        index_dir: Directory to save files
    """
    os.makedirs(index_dir, exist_ok=True)
    
    # Save FAISS index
    index_path = os.path.join(index_dir, "faiss_index.bin")
    faiss.write_index(index, index_path)
    print(f"FAISS index saved to {index_path}")
    
    # Save chunks metadata
    metadata_path = os.path.join(index_dir, "chunks.pkl")
    with open(metadata_path, 'wb') as f:
        pickle.dump(chunks, f)
    print(f"Chunks metadata saved to {metadata_path}")
    
    # Save model name for later loading
    config_path = os.path.join(index_dir, "config.pkl")
    with open(config_path, 'wb') as f:
        pickle.dump({"model_name": EMBEDDING_MODEL}, f)
    print(f"Config saved to {config_path}")


# ============================================================================
# MAIN INGESTION PIPELINE
# ============================================================================

def load_data(file_path: str) -> str:
    """
    Load the knowledge base text file.
    
    Args:
        file_path: Path to the quantum_docs.txt file
        
    Returns:
        Raw text content
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def build_index(data_file: str = None, force_rebuild: bool = False):
    """
    Main function to build the RAG index from the knowledge base.
    
    Args:
        data_file: Path to the data file (optional, uses default)
        force_rebuild: Whether to rebuild even if index exists
        
    Returns:
        True if successful, False otherwise
    """
    # Determine paths
    if data_file is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_file = os.path.join(base_dir, DATA_FILE)
    
    index_dir = os.path.dirname(data_file)
    index_path = os.path.join(index_dir, "faiss_index.bin")
    
    # Check if index already exists
    if os.path.exists(index_path) and not force_rebuild:
        print(f"Index already exists at {index_path}. Use force_rebuild=True to rebuild.")
        return True
    
    # Load data
    print(f"Loading data from {data_file}...")
    if not os.path.exists(data_file):
        print(f"Error: Data file not found at {data_file}")
        return False
    
    text = load_data(data_file)
    print(f"Loaded {len(text)} characters of text")
    
    # Split into chunks
    print("Splitting text into chunks...")
    chunks = split_into_chunks(text)
    print(f"Created {len(chunks)} chunks")
    
    # Show sample chunks
    print("\nSample chunks:")
    for i, (chunk, topic) in enumerate(chunks[:3]):
        print(f"  Chunk {i+1} [{topic}]: {chunk[:80]}...")
    
    # Create embeddings
    embeddings, model = create_embeddings(chunks)
    
    # Create FAISS index
    print("\nCreating FAISS index...")
    index = create_faiss_index(embeddings)
    
    # Save everything
    print("\nSaving index...")
    save_index(index, chunks, model, index_dir)
    
    print("\n✓ Index building complete!")
    return True


# ============================================================================
# STANDALONE EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("QUANTUM KNOWLEDGE BASE - INGESTION PIPELINE")
    print("=" * 60)
    build_index()
