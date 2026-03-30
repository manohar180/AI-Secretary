import os
import chromadb
from chromadb.utils import embedding_functions
import PyPDF2
from datetime import datetime

class KnowledgeService:
    def __init__(self):
        # Hybrid Local Lightning Stack: ChromaDB Node
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "chroma")
        if not os.path.exists(db_path):
            os.makedirs(db_path)
            
        print(f"🧠 KnowledgeService: Bootstrapping ChromaDB via Local NVMe Bind at {db_path}")
        self.chroma_client = chromadb.PersistentClient(path=db_path)
        
        # Uses standard all-MiniLM-L6-v2 internally for dense RAG lookups locally.
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        self.collection = self.chroma_client.get_or_create_collection(
            name="coordai_enterprise_rag",
            embedding_function=self.embedding_fn
        )
        print(f"✅ ChromaDB Synchronized: {self.collection.count()} vectors loaded.")

    def _extract_text_chunks(self, filepath: str, max_chunk_size: int = 500) -> list:
        """Reads a PDF/TXT and breaks it into semantic paragraphs for optimal RAG context windows."""
        text = ""
        ext = filepath.split(".")[-1].lower()
        
        if ext == "pdf":
            try:
                with open(filepath, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n\n"
            except Exception as e:
                print(f"❌ PDF Parsing Error: {e}")
                return []
        elif ext == "txt":
            with open(filepath, "r", encoding="utf-8") as f:
                text = f.read()
        
        # Super quick chunking heuristic (by double-newlines / paragraphs)
        raw_chunks = text.split("\n\n")
        chunks = []
        current = ""
        
        for p in raw_chunks:
            p = p.strip()
            if not p:
                continue
            if len(current) + len(p) > max_chunk_size:
                if len(current) > 20:  # Avoid storing tiny fragments
                    chunks.append(current.strip())
                current = p + " "
            else:
                current += p + " "
                
        if current.strip() and len(current) > 20:
            chunks.append(current.strip())
            
        return chunks

    def ingest_document(self, filepath: str, meta_db_id: str, filename: str) -> bool:
        """Parses the document exactly and commits the dense vectors natively to ChromaDB."""
        print(f"🧠 Vectorizing {filename}...")
        chunks = self._extract_text_chunks(filepath)
        
        if not chunks:
            print(f"⚠️ Vectorization Aborted: Zero coherent text found in {filename}.")
            return False
            
        # Math injection maps
        documents = []
        metadatas = []
        ids = []
        
        for i, chunk in enumerate(chunks):
            documents.append(chunk)
            metadatas.append({"source_id": meta_db_id, "filename": filename, "chunk_index": i})
            ids.append(f"{meta_db_id}__chunk_{i}")
            
        try:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            print(f"✅ Vectorization Complete: Embedded {len(chunks)} contextual tensors into Local RAG.")
            return True
        except Exception as e:
            print(f"❌ ChromaDB Write Error: {e}")
            return False

    def query_context(self, user_question: str, top_k: int = 3) -> str:
        """Mathematically searches the isolated Vector space using cosine similarity embeddings."""
        if self.collection.count() == 0:
            return ""
            
        results = self.collection.query(
            query_texts=[user_question],
            n_results=min(top_k, self.collection.count())
        )
        
        if not results['documents'] or not results['documents'][0]:
            return ""
            
        # Format the top contextual hits for the LLM injection prompt
        context_block = "\n---\n".join(results['documents'][0])
        return context_block
