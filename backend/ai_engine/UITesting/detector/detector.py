import os
import json
from pathlib import Path
from pydantic import BaseModel
from typing import List, Dict

class InfoFile(BaseModel):
    file_name: str
    file_path: str
    language: str

class Detector:
    def __init__(self):
        # Chỉ định nghĩa các extension của file code thực sự cần quét
        self.supported_extensions = {'.js', '.jsx', '.ts', '.tsx', '.vue'}
        self.ignored_dirs = {'node_modules', '.git', 'dist', 'build', 'public', '__pycache__', '.emergent', 'venv'}

    def scan_project(self, root_path: str) -> List[InfoFile]:
        """Nhiệm vụ 1: Lọc file code cần thiết để đưa cho Agent Analyzer (LLM) phân tích."""
        detected_files = []
        root = Path(root_path)

        for path in root.rglob('*'):
            # 1. Bỏ qua nếu là thư mục
            if not path.is_file():
                continue

            # 2. Bỏ qua nếu file nằm trong các thư mục bị ẩn/ignore
            if any(ignored in path.parts for ignored in self.ignored_dirs):
                continue
            
            # 3. Chỉ lọc các file code thuộc extension được hỗ trợ
            if path.suffix in self.supported_extensions:
                lang = "TypeScript" if path.suffix in {'.ts', '.tsx'} else "JavaScript"
                
                detected_files.append(InfoFile(
                    file_name=path.name,
                    file_path=str(path.relative_to(root)),
                    language=lang
                ))
                
        return detected_files

    def extract_project_metadata(self, root_path: str) -> Dict:
        """Nhiệm vụ 2: Tìm package.json để lấy root_path (cho Executor) và Framework (cho Planner)"""
        detected_projects = []
        
        for dirpath, dirnames, filenames in os.walk(root_path):
            # Cắt tỉa thư mục
            dirnames[:] = [d for d in dirnames if d not in self.ignored_dirs]

            if 'package.json' in filenames:
                package_path = os.path.join(dirpath, 'package.json')
                try:
                    with open(package_path, 'r', encoding='utf-8') as f:
                        pkg_data = json.load(f)
                        
                        deps = pkg_data.get('dependencies', {})
                        dev_deps = pkg_data.get('devDependencies', {})
                        all_deps = {**deps, **dev_deps}
                        
                        framework = "Vanilla JS"
                        if "react" in all_deps or "react-dom" in all_deps:
                            framework = "React"
                        elif "vue" in all_deps:
                            framework = "Vue"
                        
                        detected_projects.append({
                            "project_name": pkg_data.get('name', 'unknown-project'),
                            "root_path": dirpath,  # Nơi chứa package.json, Executor sẽ `cd` vào đây
                            "framework": framework,
                            "has_playwright": "@playwright/test" in all_deps
                        })
                except Exception as e:
                    print(f"[Detector] Lỗi khi đọc {package_path}: {str(e)}")

        return {
            "total_projects": len(detected_projects),
            "projects": detected_projects
        }

    def run(self, workspace_root: str) -> Dict:
        """
        Hàm chính được gọi bởi pipeline_AI.py hoặc flow_AI.py
        Kết hợp sức mạnh của cả 2 hàm trên.
        """
        # 1. Lấy danh sách file cho LLM
        scanned_files = self.scan_project(workspace_root)
        
        # 2. Lấy metadata hạ tầng cho kịch bản chạy Playwright
        project_metadata = self.extract_project_metadata(workspace_root)
        
        # 3. Trả về kết quả tổng hợp
        return {
            "status": "success",
            "source_files": [f.model_dump() for f in scanned_files], # Hoặc f.dict() tuỳ version pydantic
            "infrastructure": project_metadata
        }