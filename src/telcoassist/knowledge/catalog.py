from pathlib import Path
from threading import RLock

DOCUMENTS = [
    {
        "id": "DOC-014", "title": "DSL Troubleshooting Guide", "section": "Periodic Speed Degradation",
        "page": 18, "product": "fixed_internet", "language": "tr", "version": "2.1", "status": "active",
        "effective_date": "2026-01-01", "score": 0.91,
        "content": "Yoğun saatlerde tekrarlayan hız düşüşünde önce Wi-Fi ve Ethernet sonuçlarını karşılaştırın. Hat SNR, senkronizasyon ve son 24 saat kopma geçmişini inceleyin. Bölgesel kapasite alarmlarını kontrol edin.",
    },
    {
        "id": "DOC-021", "title": "Wi-Fi Diagnostic Playbook", "section": "Isolating local interference",
        "page": 7, "product": "fixed_internet", "language": "tr", "version": "1.8", "status": "active",
        "effective_date": "2025-11-12", "score": 0.84,
        "content": "Sorunun yerel kablosuz ağdan kaynaklanıp kaynaklanmadığını anlamak için aynı cihazda Ethernet testi yapın. Kanal yoğunluğu ve modem konumunu kontrol edin.",
    },
    {
        "id": "DOC-031", "title": "SIM Loss & Security Procedure", "section": "Immediate safeguards",
        "page": 3, "product": "mobile", "language": "tr", "version": "3.0", "status": "active",
        "effective_date": "2026-03-01", "score": 0.94,
        "content": "Kayıp veya çalıntı SIM bildirimlerinde hat güvenlik doğrulaması sonrası kullanıma kapatılır. Talep en az yüksek öncelikle işlenir ve müşteriye yeniden SIM çıkarma kanalları anlatılır.",
    },
    {
        "id": "DOC-044", "title": "Mobile Data Troubleshooting", "section": "Connection loss",
        "page": 12, "product": "mobile", "language": "tr", "version": "2.4", "status": "active",
        "effective_date": "2026-02-15", "score": 0.88,
        "content": "Mobil veri bağlantı kaybında uçak modu testi, APN doğrulaması, cihaz yeniden başlatma ve bölgesel alarm kontrolü sırasıyla uygulanır.",
    },
    {
        "id": "DOC-052", "title": "Billing Dispute Procedure", "section": "Unrecognized charges",
        "page": 5, "product": "billing", "language": "tr", "version": "1.4", "status": "active",
        "effective_date": "2026-04-10", "score": 0.90,
        "content": "Müşteri tarafından tanınmayan ücretler güvenlik riski olarak ele alınır. İşlem tarihi ve fatura dönemi doğrulanır; ücretin kaynağı kesinleşmeden iade taahhüdü verilmez.",
    },
    {
        "id": "DOC-008", "title": "Legacy DSL Handbook", "section": "Speed checks",
        "page": 11, "product": "fixed_internet", "language": "tr", "version": "0.9", "status": "deprecated",
        "effective_date": "2023-06-01", "score": 0.77,
        "content": "Eski hız testi prosedürü.",
    },
]


class DocumentIndexingError(ValueError):
    """Raised when an uploaded document cannot be indexed safely."""


class KnowledgeStore:
    def __init__(self, documents: list[dict]) -> None:
        self._documents = documents
        self._lock = RLock()

    def list_documents(self) -> list[dict]:
        with self._lock:
            return [dict(document) for document in self._documents]

    def add_document(self, filename: str, content: bytes, content_type: str) -> dict:
        with self._lock:
            sequence = max(int(document["id"].split("-")[1]) for document in self._documents) + 1
            text = content.decode("utf-8", errors="replace") if content_type != "application/pdf" else ""
            document = {
                "id": f"DOC-{sequence:03d}",
                "title": Path(filename).stem.replace("-", " ").replace("_", " ").title(),
                "section": "Uploaded guidance",
                "page": 1,
                "product": "other",
                "language": "tr",
                "version": "1.0",
                "status": "draft",
                "effective_date": "",
                "score": 0.0,
                "content": text,
                "chunk_count": 0,
                "usage_count": 0,
                "index_status": "uploaded",
                "content_type": content_type,
                "size": len(content),
            }
            self._documents.append(document)
            return dict(document)

    def index_document(self, document_id: str) -> dict | None:
        with self._lock:
            document = next((item for item in self._documents if item["id"] == document_id), None)
            if document is None:
                return None
            if document.get("content_type") == "application/pdf":
                raise DocumentIndexingError(
                    "PDF indexing is unavailable because no PDF parser is configured"
                )
            if not document.get("content", "").strip():
                raise DocumentIndexingError("The document has no indexable text content")
            document["index_status"] = "indexed"
            document["status"] = "active"
            document["chunk_count"] = max(1, document["content"].count("\n\n") + 1)
            return {
                "id": document_id,
                "index_status": "indexed",
                "stages": ["parsing", "chunking", "lexical_indexing", "indexed"],
            }


knowledge_store = KnowledgeStore(DOCUMENTS)
