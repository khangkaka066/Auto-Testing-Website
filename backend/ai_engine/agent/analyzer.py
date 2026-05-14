import os
import subprocess
from pydantic import BaseModel, Field
from typing import List, Optional
import frontmatter
from dotenv import load_dotenv
from openrouter import OpenRouter

load_dotenv()

class TestStep(BaseModel):
    step_id: int = Field(description="Thứ tự của bước kiểm thử (1, 2, 3...)")
    action: str = Field(description="Hành động: 'click', 'input', 'assert_visible', 'assert_text'")
    target: str = Field(description="CSS Selector, XPath, hoặc data-testid chuẩn xác")
    value: str = Field(default="", description="Giá trị đầu vào nếu action là 'input'")
    purpose: str = Field(description="Mục đích của bước này để làm gì?")
    is_mock_api: bool = Field(default=False, description="True nếu bước này kích hoạt API Call cần được mock/intercept")

class TestScenario(BaseModel):
    scenario_name: str = Field(description="Tên kịch bản (VD: Đăng nhập thất bại do sai mật khẩu)")
    risk_level: str = Field(description="Mức độ rủi ro: 'High', 'Medium', 'Low'")
    steps: List[TestStep]

class AnalyzerOutput(BaseModel):
    component_name: str = Field(description="Tên component đang được test")
    scenarios: List[TestScenario]

class Analyzer:
    def __init__(self, setting="backend/ai_engine/settings_agent/Analyzer.md"):
        # Sử dụng model mini để tối ưu chi phí (CAC) cho gói Starter/Free
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        if self.api_key is None:
            raise("API key is not found. Please import API key in file .env")
        
        try:
            with open(setting, 'r', encoding="utf-8") as f:
                settings = frontmatter.load(f)
        except:
            raise FileNotFoundError("File setting is not found. Please add file setting for AnalyzerAgent.")
        self.model = settings.get("model")
        self.system_prompt = settings.content

    def preprocess_code(self, raw_code: str, ast_script_path="backend/utils/ast_parser.js") -> str:
        """Gửi code sang Node.js để lọc AST và nhận lại code sạch."""
        try:
            # Khởi tạo tiến trình Node.js
            process = subprocess.Popen(
                ["node", ast_script_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8'
            )
            
            # Gửi code và đợi kết quả
            stdout, stderr = process.communicate(input=raw_code)
            
            if process.returncode != 0:
                print(f"[Detector Error]: {stderr}")
                return raw_code[:3000] # Fallback an toàn
            
            return stdout.strip()
            
        except Exception as e:
            print(f"[Bridge Error]: {str(e)}")
            return raw_code[:3000]

    def analyze(self, raw_code: str, framework: str, language: str) -> Optional[AnalyzerOutput]:
        prompt = ""
        code_context = self.preprocess_code(raw_code)
        prompt += "Content of file code:\n" + code_context + "\n" + \
        f"Framework: {framework}\n" + \
        f"Programming language: {language}"

        with OpenRouter(api_key=self.api_key) as client:
            response = client.chat.send(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": code_context}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "analyze_output",
                        "schema_": AnalyzerOutput.model_json_schema()
                    }
                }
            )
        
        content = response.choices[0].message.content

        try:
            structure_data = AnalyzerOutput.model_validate_json(content)
            return structure_data
        except Exception as e:
            print(f"Lỗi parse JSON: {e}")
            return content

# Khởi chạy thử nghiệm (Dành cho việc Test Local)
if __name__ == "__main__":
    sample_vue_code = """
    <template>
      <form @submit.prevent="login">
        <input data-testid="email" v-model="email" type="email" required />
        <input data-testid="password" v-model="password" type="password" required />
        <button type="submit" class="btn-login">Đăng nhập</button>
      </form>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </template>
    <script>
    // Logic gọi API axios.post('/api/auth') nằm ở đây
    </script>
    """
    
    analyzer = Analyzer()
    result = analyzer.analyze(raw_code=sample_vue_code, framework="Vue.js", language="JavaScript")
    print(result.scenarios)