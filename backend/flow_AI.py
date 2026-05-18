import json
import os
from pathlib import Path
from colorama import Fore, Style
from tqdm import tqdm
from ai_engine.agent.detector import Detector
from ai_engine.agent.analyzer import Analyzer
from ai_engine.agent.planner import Planner
from ai_engine.agent.coder import Coder
from utils.filter_tc import filter_planner_outputs

if __name__ == "__main__":
    detector = Detector()
    analyzer = Analyzer()
    planner = Planner()
    coder = Coder()
    requests_type = ["UI Testing"]
    
    # Cấu hình đường dẫn dự án cần test
    src_code_path = "workspace/pc-store-ecommerce-website"
    output_analyze_json_dir = "backend/ai_engine/analyzer_outputs"
    output_planner_json_dir = "backend/ai_engine/planner_outputs"
    output_filter_before_code_dir = "backend/ai_engine/filter_outputs"
    os.makedirs(output_analyze_json_dir, exist_ok=True)
    os.makedirs(output_planner_json_dir, exist_ok=True)
    # os.makedirs(output_filter_before_code_dir, exist_ok=True)

    print(f"{Fore.GREEN}[STAGE 1] Quét dự án và phân loại file (Code thuần)...{Style.RESET_ALL}")
    scan_projects = detector.scan_project(src_code_path)

    # print(f"\n{Fore.GREEN}[STAGE 2] Phân tích cấu trúc kỹ thuật bằng AI (Analyzer)...{Style.RESET_ALL}")
    
    # for info_file in tqdm(scan_projects[:10], desc="Đang phân tích cấu trúc"):
    #     # Đọc file_path từ object Detector trả về
    #     file_full_path = os.path.join(src_code_path, info_file.file_path)
        
    #     try:
    #         with open(file_full_path, 'r', encoding='utf-8') as f:
    #             content = f.read()
            
    #         analyze_output = analyzer.analyze(
    #             raw_code=content, 
    #             language=info_file.language
    #         )

    #         if analyze_output:
    #             print(f"\n[File]: {info_file.file_path} => Loại: {analyze_output.module_type} | Phần tử tương tác: {len(analyze_output.interactive_elements)}")
                
    #             # ---- TIẾN HÀNH LƯU OUTPUT THÀNH FILE JSON ----
    #             safe_file_name = info_file.file_path.replace("/", "_").replace("\\", "_")
    #             json_file_name = f"{os.path.splitext(safe_file_name)[0]}_analysis.json"
    #             json_file_path = os.path.join(output_analyze_json_dir, json_file_name)
                
    #             try:
    #                 output_data = analyze_output.model_dump()
    #             except AttributeError:
    #                 output_data = analyze_output.dict()
                
    #             with open(json_file_path, 'w', encoding='utf-8') as json_file:
    #                 json.dump(output_data, json_file, ensure_ascii=False, indent=4)
                    
    #             print(f"   -> Đã lưu Metadata kỹ thuật vào: {Fore.CYAN}{json_file_path}{Style.RESET_ALL}")
    #         else:
    #             print(f"\n{Fore.YELLOW}[Cảnh báo]: File {info_file.file_path} không trả về kết quả.{Style.RESET_ALL}")
                
    #     except Exception as e:
    #         print(f"{Fore.RED}Lỗi khi xử lý file {info_file.file_path}: {e}{Style.RESET_ALL}")

    # print(f"\n{Fore.GREEN}[STAGE 3] Lên kế hoạch test case (Planner)...{Style.RESET_ALL}")
    # for analyze_json_file in tqdm(os.listdir(output_analyze_json_dir), desc="Đang lên kế hoạch"):
    #     analyze_json_path = os.path.join(output_analyze_json_dir, analyze_json_file)
    #     filename = analyze_json_file.split('_analysis')[0].split('_')[-1]
    #     try:
    #         with open(analyze_json_path, 'r', encoding='utf-8') as f:
    #             content = json.load(f)
    #         plan_output = planner.build_plan(content, requested_test_types=requests_type)

    #         planner_json_path = os.path.join(output_planner_json_dir, f'{filename}.json')

    #         planner_data = plan_output.model_dump()

    #         with open(planner_json_path, 'w', encoding='utf-8') as json_file:
    #             json.dump(planner_data, json_file, ensure_ascii=False, indent=4)
    #     except Exception as e:
    #         print(f"{Fore.RED}Lỗi khi xử lý file {analyze_json_file}: {e}{Style.RESET_ALL}")

    # print(f"{Fore.GREEN}[STAGE 4] Lọc và tạo code test (Coder)...{Style.RESET_ALL}")
    # filtered_outputs = coder.generate_from_filtered(
    #     filtered_file=Path(output_planner_json_dir),
    #     output_dir=Path(os.path.join(output_filter_before_code_dir, "fitered_outputs.json")),
    #     base_url="http://localhost:3000")