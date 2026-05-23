from fastapi import FastAPI, APIRouter, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# 1. Tạo Model nhận request từ Frontend
class TestRunRequest(BaseModel):
    user_id: str
    project_id: str
    source_path: str # Thư mục chứa code của user đã được clone/unzip

# 2. Tạo hàm chạy ngầm Pipeline để tránh timeout API
def trigger_ai_pipeline(user_id: str, project_id: str, source_path: str):
    from pipeline_AI import AIPipelineOrchestrator
    
    # Khởi tạo Pipeline với kiến trúc Dynamic Workspace
    pipeline = AIPipelineOrchestrator(
        user_id=user_id, 
        project_id=project_id, 
        source_code_path=source_path
    )
    # Chạy pipeline
    pipeline.execute_pipeline()

# 3. Tạo Endpoint kích hoạt test
@api_router.post("/run-test")
async def run_test_pipeline(request: TestRunRequest, background_tasks: BackgroundTasks):
    # Đẩy tác vụ chạy AI vào background task
    background_tasks.add_task(
        trigger_ai_pipeline, 
        request.user_id, 
        request.project_id, 
        request.source_path
    )
    
    return {
        "status": "success",
        "message": f"Pipeline đã được kích hoạt cho user {request.user_id}, project {request.project_id}",
        "action": "Vui lòng poll API (hoặc dùng WebSocket) để nhận kết quả."
    }