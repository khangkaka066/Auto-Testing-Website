from fastapi import FastAPI, APIRouter, BackgroundTasks, Header, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging
import uuid
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
# Thư viện dùng để mã hóa mật khẩu bảo mật
from werkzeug.security import generate_password_hash, check_password_hash

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Sử dụng .get() có giá trị mặc định để tránh crash server khi chưa cấu hình MongoDB
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Cấu hình thư mục chứa ảnh đại diện trên ổ đĩa cứng
UPLOAD_DIR = Path(__file__).parent / "static" / "avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ====================================================================
# MOCK DATABASE (Lưu trên RAM phục vụ việc chưa có MongoDB)
# ====================================================================
USERS_DB = {}

# 🛠️ THÊM MỚI: MOCK DATABASE lưu lịch sử Test
TEST_HISTORY_DB = []

# Hàm bổ trợ giải mã lấy user_id từ Mock Token để tìm thông tin User trong RAM DB
def get_user_by_token(token: str):
    if not token or not token.startswith("testpilot_mock_token_"):
        return None
    parts = token.split("_")
    if len(parts) < 4:
        return None
    user_id = parts[3]
    for email, user in USERS_DB.items():
        if user["id"] == user_id:
            return user
    return None


# ====================================================================
# PYDANTIC MODELS (Định nghĩa cấu trúc dữ liệu đầu vào/đầu ra)
# ====================================================================
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Models cho chức năng Đăng ký / Đăng nhập
class UserRegisterInput(BaseModel):
    name: Optional[str] = None
    email: str
    password: str

class UserLoginInput(BaseModel):
    email: str
    password: str

# Model xác thực dữ liệu cho chức năng cập nhật thông tin cá nhân
class ProfileUpdateInput(BaseModel):
    name: str
    password: Optional[str] = None

# 🛠️ THÊM MỚI: Model nhận dữ liệu tên file từ Frontend gửi lên để lưu lịch sử
class TestHistoryCreate(BaseModel):
    filename: str

# 🛠️ THÊM MỚI: Model nhận token mã hóa của Google từ Frontend gửi lên
class GoogleLoginInput(BaseModel):
    token: str


# ====================================================================
# ROUTES (Định nghĩa các API Endpoints)
# ====================================================================

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# --- API ĐĂNG KÝ (Register) ---
@api_router.post("/auth/register")
async def register(input_data: UserRegisterInput):
    email = input_data.email.strip()
    password = input_data.password
    name = input_data.name
    
    if not email or not password:
        return JSONResponse(
            status_code=400, 
            content={"success": False, "message": "Email và mật khẩu không được để trống"}
        )
        
    if email in USERS_DB:
        return JSONResponse(
            status_code=400, 
            content={"success": False, "message": "Email này đã được đăng ký tài khoản khác"}
        )
        
    hashed_password = generate_password_hash(password)
    user_id = str(uuid.uuid4())
    
    USERS_DB[email] = {
        "id": user_id,
        "name": name if name else email.split('@')[0],
        "email": email,
        "password_hash": hashed_password
    }
    
    mock_token = f"testpilot_mock_token_{user_id}_{str(uuid.uuid4())[:8]}"
    
    return JSONResponse(
        status_code=201,
        content={
            "success": True,
            "message": "Đăng ký tài khoản và Đăng nhập thành công!",
            "token": mock_token,
            "user": {
                "id": user_id,
                "name": USERS_DB[email]["name"],
                "email": email
            }
        }
    )

# --- API ĐĂNG NHẬP (Login) ---
@api_router.post("/api/auth/login") 
@api_router.post("/auth/login")
async def login(input_data: UserLoginInput):
    email = input_data.email.strip()
    password = input_data.password
    
    if not email or not password:
        return JSONResponse(
            status_code=400, 
            content={"success": False, "message": "Vui lòng nhập đầy đủ cả Email và Mật khẩu"}
        )
        
    user = USERS_DB.get(email)
    
    if not user or not check_password_hash(user["password_hash"], password):
        return JSONResponse(
            status_code=401, 
            content={"success": False, "message": "Email hoặc mật khẩu không chính xác"}
        )
        
    mock_token = f"testpilot_mock_token_{user['id']}_{str(uuid.uuid4())[:8]}"
    
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Đăng nhập hệ thống thành công!",
            "token": mock_token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }
    )

# --- 🛠️ THÊM MỚI: API ĐĂNG NHẬP / TỰ ĐỘNG ĐĂNG KÝ BẰNG GOOGLE ---
@api_router.post("/auth/google")
async def google_login(input_data: GoogleLoginInput):
    try:
        import base64
        import json
        
        token_parts = input_data.token.split('.')
        if len(token_parts) < 2:
            return JSONResponse(status_code=400, content={"success": False, "message": "Mã xác thực Google không hợp lệ"})
            
        # Giải mã phần nội dung (Payload) nằm ở phân đoạn thứ 2 của chuỗi JWT
        payload_b64 = token_parts[1]
        payload_b64 += '=' * (4 - len(payload_b64) % 4)  # Bù khoảng trống để giải mã chuẩn
        payload_json = base64.b64decode(payload_b64).decode('utf-8')
        id_info = json.loads(payload_json)
        
        email = id_info.get('email')
        name = id_info.get('name', email.split('@')[0] if email else "Google User")
        
        if not email:
            return JSONResponse(status_code=400, content={"success": False, "message": "Không thể lấy thông tin Email từ tài khoản Google này"})
        
        # Kiểm tra xem tài khoản Email này đã từng tồn tại trong bộ nhớ RAM chưa
        if email not in USERS_DB:
            user_id = str(uuid.uuid4())
            USERS_DB[email] = {
                "id": user_id,
                "name": name,
                "email": email,
                "password_hash": generate_password_hash(str(uuid.uuid4()))  # Tạo mật khẩu ngẫu nhiên bảo mật
            }
        else:
            user_id = USERS_DB[email]["id"]
            
        # Tạo phiên đăng nhập (Mock Token) đồng nhất với cơ chế hệ thống
        mock_token = f"testpilot_mock_token_{user_id}_{str(uuid.uuid4())[:8]}"
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Đăng nhập thông qua tài khoản Google thành công!",
                "token": mock_token,
                "user": {
                    "id": user_id,
                    "name": USERS_DB[email]["name"],
                    "email": email
                }
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Lỗi hệ thống khi xác thực Google: {str(e)}"}
        )

# --- API LẤY THÔNG TIN CÁ NHÂN HIỆN TẠI ---
@api_router.get("/auth/profile")
async def get_profile(authorization: Optional[str] = Header(None)):
    if not authorization:
        return JSONResponse(status_code=401, content={"success": False, "message": "Bạn chưa đăng nhập"})
    
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_by_token(token)
    
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "message": "Phiên đăng nhập không hợp lệ"})
        
    return {
        "success": True,
        "user": {
            "name": user["name"],
            "email": user["email"],
            "avatar": user.get("avatar", "")
        }
    }

# --- API CẬP NHẬT THÔNG TIN CÁ NHÂN ---
@api_router.put("/auth/profile")
async def update_profile(input_data: ProfileUpdateInput, authorization: Optional[str] = Header(None)):
    if not authorization:
        return JSONResponse(status_code=401, content={"success": False, "message": "Bạn chưa đăng nhập"})
    
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_by_token(token)
    
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "message": "Tài khoản không tồn tại"})
    
    user["name"] = input_data.name.strip()
    
    if input_data.password and input_data.password.strip():
        user["password_hash"] = generate_password_hash(input_data.password)
        
    return {
        "success": True,
        "message": "Cập nhật thông tin cá nhân thành công!",
        "user": {
            "name": user["name"],
            "email": user["email"]
        }
    }

# --- API TIẾP NHẬN VÀ LƯU TRỮ FILE ẢNH ĐẠI DIỆN ---
@api_router.post("/auth/avatar")
async def upload_avatar(file: UploadFile = File(...), authorization: Optional[str] = Header(None)):
    if not authorization:
        return JSONResponse(status_code=401, content={"success": False, "message": "Bạn chưa đăng nhập"})
    
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_by_token(token)
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "message": "Tài khoản không tồn tại"})
    
    if not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"success": False, "message": "File gửi lên bắt buộc phải là hình ảnh"})
        
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"http://localhost:5000/static/avatars/{unique_filename}"
    user["avatar"] = avatar_url
    
    return {
        "success": True,
        "message": "Tải ảnh đại diện thành công!",
        "avatar_url": avatar_url
    }

# --- 🛠️ THÊM MỚI: API LƯU LỊCH SỬ CHẠY TEST ---
@api_router.post("/test/history")
async def create_test_history(input_data: TestHistoryCreate, authorization: Optional[str] = Header(None)):
    if not authorization:
        return JSONResponse(status_code=401, content={"success": False, "message": "Bạn chưa đăng nhập"})
    
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_by_token(token)
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "message": "Tài khoản không hợp lệ"})
    
    # Tạo bản ghi mới chứa tên file và thời gian hiện tại chính xác đến từng giây
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "filename": input_data.filename,
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    }
    
    TEST_HISTORY_DB.insert(0, record)  # Chèn vào đầu danh sách để lịch sử mới nhất hiện lên trên cùng
    
    return {"success": True, "data": record}

# --- 🛠️ THÊM MỚI: API LẤY DANH SÁCH LỊCH SỬ TEST CỦA USER ---
@api_router.get("/test/history")
async def get_test_history(authorization: Optional[str] = Header(None)):
    if not authorization:
        return JSONResponse(status_code=401, content={"success": False, "message": "Bạn chưa đăng nhập"})
    
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_by_token(token)
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "message": "Tài khoản không hợp lệ"})
    
    # Lọc ra các lịch sử thuộc về user đang đăng nhập
    user_history = [record for record in TEST_HISTORY_DB if record["user_id"] == user["id"]]
    
    return {"success": True, "data": user_history}

# --- Các API Status cũ của bạn (Giữ nguyên) ---
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    try:
        _ = await db.status_checks.insert_one(doc)
    except Exception as e:
        logger.error(f"Lỗi lưu MongoDB: {e}")
        
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    try:
        status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
        for check in status_checks:
            if isinstance(check['timestamp'], str):
                check['timestamp'] = datetime.fromisoformat(check['timestamp'])
        return status_checks
    except Exception as e:
        logger.error(f"Lỗi đọc MongoDB: {e}")
        return []


# Cấu hình cho phép trình duyệt truy cập thư mục static để xem ảnh trực tiếp
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

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
    try:
        client.close()
    except Exception:
        pass

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
