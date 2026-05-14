import os
import asyncio
from pathlib import Path
from openrouter import OpenRouter
from dotenv import load_dotenv
import frontmatter
from pydantic import BaseModel, Field
from typing import List

load_dotenv()

class InfoFile(BaseModel):
    file_name: str = Field(description='File name')
    file_path: str = Field(description='File path')
    role: str = Field(description='role of file in system')
    importance: str = Field(description='Priority level: Low, Medium or High')

class SystemArchitecture(BaseModel):
    client_side: List[InfoFile]
    server_side: List[InfoFile]

class DetectorAgent:
    def __init__(self, setting="backend/settings_agent/Detector.md"):
        self.supported_extensions = {'.js', '.jsx', '.ts', '.tsx', '.vue'}
        self.ignored_dirs = {'node_modules', '.git', 'dist', 'build', 'public'}
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        with open(setting, 'r', encoding="utf-8") as f:
            self.settings = frontmatter.load(f)

    def scan_project(self, root_path: str):
        """
        Quét toàn bộ thư mục và phân loại file
        """
        detected_files = []
        root = Path(root_path)

        for path in root.rglob('*'):
            # Kiểm tra nếu nằm trong thư mục bị bỏ qua
            if any(ignored in path.parts for ignored in self.ignored_dirs):
                continue
            
            # Chỉ lấy các file code được hỗ trợ
            if path.suffix in self.supported_extensions:
                file_info = {
                    "file_name": path.name,
                    "relative_path": str(path.relative_to(root)),
                    "type": self._classify_file(path),
                    "size": path.stat().st_size
                }
                detected_files.append(file_info)
        
        return detected_files

    def _classify_file(self, path: Path):
        """
        Phân loại sơ bộ dựa trên đường dẫn và tên file
        """
        path_str = str(path).lower()
        if 'pages' in path_str or 'views' in path_str:
            return "Page/Route"
        if 'components' in path_str:
            return "Component"
        if 'api' in path_str or 'services' in path_str:
            return "API_Logic"
        return "General_Logic"

    async def select_critical_files(self, detected_files):
        """
        Dùng LLM (tùy chọn) để chọn ra các file quan trọng nhất cần test 
        nhằm tiết kiệm Token cho bước Analyzer.
        """
        prompt = ""
        for files in detected_files:
            prompt+=f"File name: {files.get('file_name', 'Cannot get file name')}" + "|" + f"relative path: {files.get('relative_path', 'Cannot get path')}\n"
        prompt = prompt.strip()

        with OpenRouter(
            api_key=self.api_key
        ) as client:
            response = client.chat.send(
                model=self.settings['model'],
                messages=[
                    {"role": "system", "content": self.settings.content},
                    {"role": "user", "content": prompt}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "system_architecture",
                        "schema_": SystemArchitecture.model_json_schema()
                    }
                }
            )
        content = response.choices[0].message.content
        try:
            structured_data = SystemArchitecture.model_validate_json(content)
            return structured_data
        except Exception as e:
            print(f"Lỗi parse JSON: {e}")
            return content

if __name__ == "__main__":
    src_code_path = "pc-store-ecommerce-website"
    detectorAgent = DetectorAgent()
    scan_projects = detectorAgent.scan_project(src_code_path)
    
    critical_file = asyncio.run(detectorAgent.select_critical_files(scan_projects))
    client_sides = critical_file.client_side
    server_side = critical_file.server_side
    print(server_side)