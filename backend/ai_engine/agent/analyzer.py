import os
import subprocess
from pydantic import BaseModel, Field
from typing import List, Optional
import frontmatter
from openrouter import OpenRouter
from dotenv import load_dotenv

load_dotenv()

class UIElement(BaseModel):
    element_type: str = Field(description="The HTML tag or UI element type (e.g., 'input', 'button', 'form', 'text')")
    selector: str = Field(description="The exact CSS Selector, XPath, or data-testid used to target this element")
    purpose: str = Field(description="Brief explanation in VIETNAMESE of what this element does (e.g., 'Ô nhập tài khoản email')")

class APIEndpoint(BaseModel):
    function_name: str = Field(description="The name of the core function handling the API call or business logic")
    method: str = Field(default="GET", description="HTTP Method (GET, POST, PUT, DELETE, PATCH)")
    route_or_target: str = Field(description="The specific backend endpoint route URL or base target")
    required_payload_fields: List[str] = Field(default=[], description="List of required parameter keys or payload fields")

class TechnicalAnalysisOutput(BaseModel):
    component_name: str = Field(description="The logical name of the component or file (e.g., 'LoginForm'). Fallback to 'UnknownComponent' if not found.")
    module_type: str = Field(description="Must be strictly either 'UI_Component' or 'API_Service_Module'")
    impact_level: str = Field(description="System critical assessment. Must be strictly: 'High', 'Medium', or 'Low'")
    interactive_elements: List[UIElement] = Field(default=[], description="List of extracted interactive UI elements. DO NOT leave empty if inputs/buttons exist in code.")
    extracted_endpoints: List[APIEndpoint] = Field(default=[], description="List of detected network calls or core API services inside the file.")
    dependencies: List[str] = Field(default=[], description="List of imported third-party libraries, framework hooks, or global states used.")
    has_conditional_rendering: bool = Field(default=False, description="True if the code contains conditional display logic (e.g., v-if, v-show, ternary operators for error tracking).")

class Analyzer:
    def __init__(self, setting="backend/ai_engine/settings_agent/Analyzer.md"):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        if self.api_key is None:
            raise ValueError("API key is not found. Please import API key in file .env")
        
        try:
            with open(setting, 'r', encoding="utf-8") as f:
                settings = frontmatter.load(f)
        except Exception:
            raise FileNotFoundError("File setting is not found. Please add file setting for AnalyzerAgent.")
        self.model = settings.get("model")
        self.system_prompt = settings.content

    def preprocess_code(self, raw_code: str, ast_script_path="backend/utils/ast_parser.js") -> str:
        """Gửi code sang Node.js để lọc AST và nhận lại code sạch."""
        try:
            process = subprocess.Popen(
                ["node", ast_script_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8'
            )
            stdout, stderr = process.communicate(input=raw_code)
            if process.returncode != 0:
                print(f"[Detector Error]: {stderr}")
                return raw_code[:3000]
            return stdout.strip()
        except Exception as e:
            print(f"[Bridge Error]: {str(e)}")
            return raw_code

    def analyze(self, raw_code: str, language: str) -> Optional[TechnicalAnalysisOutput]:
        """Phân tích cấu trúc mã nguồn tĩnh chỉ dựa vào Code và Ngôn ngữ."""
        code_context = self.preprocess_code(raw_code)
        
        # User Prompt siêu ngắn, tối giản hóa đầu vào
        user_prompt = (
            f"Language: {language}\n"
            f"Source Code:\n```\n{code_context}\n```"
        )

        with OpenRouter(api_key=self.api_key) as client:
            response = client.chat.send(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "technical_analysis_output",
                        "schema_": TechnicalAnalysisOutput.model_json_schema()
                    }
                }
            )
        
        content = response.choices[0].message.content

        try:
            structure_data = TechnicalAnalysisOutput.model_validate_json(content)
            return structure_data
        except Exception as e:
            print(f"Lỗi parse JSON: {e}")
            return content
        
if __name__ == "__main__":
    # Test thử nghiệm với đoạn mã Vue.js chứa cả UI và API Logic ngầm
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
    // Logic gọi API axios.post('/api/auth/login') nằm ở đây
    </script>
    """
    
    analyzer = Analyzer()
    result = analyzer.analyze(raw_code=sample_vue_code, language="JavaScript")
    print(result)