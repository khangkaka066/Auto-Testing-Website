import json
import os
from colorama import Fore, Style
from tqdm import tqdm
from agent.detector import Detector
from agent.analyzer import Analyzer

if __name__ == "__main__":
    detector = Detector()
    analyzer = Analyzer()
    
    # Cấu hình đường dẫn dự án cần test
    src_code_path = "workspace/pc-store-ecommerce-website"
    
    # Định nghĩa thư mục lưu trữ kết quả phân tích logic của Analyzer
    output_json_dir = "analyzer_outputs"
    os.makedirs(output_json_dir, exist_ok=True)

    print(f"{Fore.GREEN}[STAGE 1] Quét dự án và phân loại file (Code thuần)...{Style.RESET_ALL}")
    scan_projects = detector.scan_project(src_code_path)

    # print(f"\n{Fore.GREEN}[STAGE 2] Phân tích Logic & Tạo kịch bản JSON (Dùng AI)...{Style.RESET_ALL}")
    # for info_file in tqdm(info_files[:10], desc="Đang xử lý"):
    #     file_full_path = os.path.join(src_code_path, info_file.file_path)
    #     try:
    #         with open(file_full_path, 'r', encoding='utf-8') as f:
    #             content = f.read()
            
    #         # Gọi Agent Analyzer phân tích (đã tối ưu prompt tiếng Anh)
    #         analyze_output = analyzer.analyze(content, info_file.framework, info_file.language)

    #         if analyze_output:
    #             print(f"\n[File]: {info_file.file_path} => Sinh ra {len(analyze_output.scenarios)} kịch bản.")
                
    #             # ---- TIẾN HÀNH LƯU OUTPUT THÀNH FILE JSON ----
    #             # 1. Chuyển đổi đường dẫn file (ví dụ: components/Button.jsx -> components_Button.json)
    #             safe_file_name = info_file.file_path.replace("/", "_").replace("\\", "_")
    #             json_file_name = f"{os.path.splitext(safe_file_name)[0]}_analysis.json"
    #             json_file_path = os.path.join(output_json_dir, json_file_name)
                
    #             # 2. Convert Pydantic Model sang Python Dict hoặc JSON string trực tiếp
    #             # Sử dụng .model_dump() (nếu dùng Pydantic v2) hoặc .dict() (nếu dùng Pydantic v1)
    #             try:
    #                 output_data = analyze_output.model_dump()
    #             except AttributeError:
    #                 output_data = analyze_output.dict()
                
    #             # 3. Ghi file JSON kèm indent=4 để dễ đọc (Pretty Print)
    #             with open(json_file_path, 'w', encoding='utf-8') as json_file:
    #                 json.dump(output_data, json_file, ensure_ascii=False, indent=4)
                    
    #             print(f"   -> Đã lưu kịch bản phân tích vào: {Fore.CYAN}{json_file_path}{Style.RESET_ALL}")
    #         else:
    #             print(f"\n{Fore.YELLOW}[Cảnh báo]: File {info_file.file_path} không trả về kết quả.{Style.RESET_ALL}")
                
    #     except Exception as e:
    #         print(f"{Fore.RED}Lỗi khi xử lý file {info_file.file_path}: {e}{Style.RESET_ALL}")