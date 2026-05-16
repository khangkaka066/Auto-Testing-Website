import os
from pathlib import Path
from pydantic import BaseModel
from typing import List

class InfoFile(BaseModel):
    file_name: str
    file_path: str
    language: str

class Detector:
    def __init__(self):
        # Chỉ định nghĩa các extension của file code thực sự cần quét
        self.supported_extensions = {'.js', '.jsx', '.ts', '.tsx', '.vue'}
        self.ignored_dirs = {'node_modules', '.git', 'dist', 'build', 'public', '__pycache__'}

    def scan_project(self, root_path: str) -> List[InfoFile]:
        detected_files = []
        root = Path(root_path)

        for path in root.rglob('*'):
            # 1. Bỏ qua nếu là thư mục (loại bỏ hoàn toàn folder khỏi danh sách)
            if not path.is_file():
                continue

            # 2. Bỏ qua nếu file nằm trong các thư mục bị ẩn/ignore
            if any(ignored in path.parts for ignored in self.ignored_dirs):
                continue
            
            # 3. Chỉ lọc các file code thuộc extension được hỗ trợ (tự động bỏ README, ảnh, config...)
            if path.suffix in self.supported_extensions:
                lang = "TypeScript" if path.suffix in {'.ts', '.tsx'} else "JavaScript"
                
                # Append gọn gàng chỉ chứa thông tin cơ bản của file
                detected_files.append(InfoFile(
                    file_name=path.name,
                    file_path=str(path.relative_to(root)),
                    language=lang
                ))
                
        return detected_files