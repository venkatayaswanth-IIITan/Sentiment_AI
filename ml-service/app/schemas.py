from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to analyze for sentiment")
    brand: Optional[str] = Field(None, description="Target brand name if applicable")
    model_type: Optional[str] = Field("bilstm", description="Model variant to use (ml, cnn, bilstm)")

class BatchSentimentRequest(BaseModel):
    items: List[SentimentRequest] = Field(..., min_items=1)

class AspectSentiment(BaseModel):
    aspect: str
    sentiment: str
    confidence: float

class SentimentResponse(BaseModel):
    text: str
    sentiment: str
    confidence: float
    probabilities: Dict[str, float]
    aspects: List[AspectSentiment] = []
    model_version: str

class BatchSentimentResponse(BaseModel):
    results: List[SentimentResponse]
    total_processed: int

class ModelEvaluationRequest(BaseModel):
    model_name: str
    test_data_path: Optional[str] = None
