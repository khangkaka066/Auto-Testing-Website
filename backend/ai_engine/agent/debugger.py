import os
import frontmatter
import lmstudio as lms
from colorama import Fore, Style
from dotenv import load_dotenv

load_dotenv()

class Debugger:
    def __init__(self, setting: str = "backend/ai_engine/system_prompt/Debugger.md") -> None:
        # Load API key tương tự coder.py (mặc dù LM Studio có thể chạy local)
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if self.api_key is None:
            print(f"{Fore.YELLOW}Warning: OPENROUTER_API_KEY is not found in .env{Style.RESET_ALL}")

        try:
            with open(setting, "r", encoding="utf-8") as f:
                settings = frontmatter.load(f)
        except Exception as exc:
            raise FileNotFoundError("File setting is not found. Please add file setting for DebuggerAgent.") from exc

        # Khởi tạo model và system_prompt từ file markdown
        self.model = lms.llm(settings.get("model"))
        self.system_prompt = settings.content

    # Thêm tham số test_plan (mặc định là chuỗi rỗng)
    def fix_code(self, file_path: str, error_log: str, test_plan: str = "") -> bool:
        """
        Đọc file bị lỗi, gửi log + code + test_plan cho LLM sửa, và ghi đè lại file.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                code_content = f.read()

            print(f"{Fore.CYAN}    -> Đang nhờ AI sửa lỗi file (có kèm Test Plan): {os.path.basename(file_path)}...{Style.RESET_ALL}")
            
            # Đưa Test Plan vào User Prompt
            user_prompt = f"""
            [TSC ERROR LOG]:
            {error_log}

            [TEST PLAN CONTEXT]:
            {test_plan}

            [CURRENT SOURCE CODE]:
            {code_content}
            """

            response = self.model.respond(
                {
                    "messages": [
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": user_prompt},
                    ]
                }
            )
            
            fixed_code = response.content

            # Bóc tách code
            fixed_code = fixed_code.replace("```typescript\n", "").replace("```ts\n", "").replace("```javascript\n", "").replace("```\n", "").strip()
            if fixed_code.endswith("```"):
                fixed_code = fixed_code[:-3].strip()

            # Ghi đè lại file .spec.ts cũ
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_code)
                
            print(f"{Fore.GREEN}    -> [DONE] Đã sửa xong file {os.path.basename(file_path)}!{Style.RESET_ALL}")
            return True
            
        except Exception as e:
            print(f"{Fore.RED}Lỗi khi Debugger chạy: {e}{Style.RESET_ALL}")
            return False