import os
import json
from pathlib import Path
from colorama import Fore, Style
from tqdm import tqdm
import subprocess

from ai_engine.agent.detector import Detector
from ai_engine.agent.analyzer import Analyzer
from ai_engine.agent.planner import Planner
from ai_engine.agent.coder import Coder
from ai_engine.agent.runner import Runner
from ai_engine.agent.reporter import Reporter

class AIPipelineOrchestrator:
    def __init__(self, workspace_dir: str, base_output_dir: str = "backend/ai_engine"):
        self.workspace_dir = workspace_dir
        self.base_output_dir = base_output_dir
        
        # Định nghĩa các thư mục output
        self.dirs = {
            "1_detector": os.path.join(self.base_output_dir, "1_detector_outputs"),
            "2_analyzer": os.path.join(self.base_output_dir, "2_analyzer_outputs"),
            "3_planner": os.path.join(self.base_output_dir, "3_planner_outputs"),
            "4_filter": os.path.join(self.base_output_dir, "4_filter_outputs"),
            "5_coder": os.path.join(self.base_output_dir, "5_coder_outputs"),
            "6_executor": os.path.join(self.base_output_dir, "6_executor_outputs"),
            "7_reporter": os.path.join(self.base_output_dir, "7_reporter_outputs"),
        }
        
        self.setup_directories()

    def setup_directories(self):
        print(f"{Fore.CYAN}[SETUP] Đang khởi tạo các thư mục lưu trữ I/O...{Style.RESET_ALL}")
        for key, dir_path in self.dirs.items():
            os.makedirs(dir_path, exist_ok=True)
            print(f"  -> {dir_path}")

    def run_detector(self):
        print(f"\n{Fore.GREEN}[STAGE 1] Quét dự án và phân loại file (Detector)...{Style.RESET_ALL}")
        detector = Detector()
        scan_projects = detector.scan_project(self.workspace_dir)
        
        output_file = os.path.join(self.dirs["1_detector"], "detector_results.json")
        try:
            data_to_save = [item.model_dump() for item in scan_projects]
        except AttributeError:
            data_to_save = [item.dict() for item in scan_projects]
            
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=4)
            
        print(f"  -> Đã tìm thấy {len(scan_projects)} file code hợp lệ.")
        print(f"  -> Đã lưu kết quả tại: {output_file}")
        return output_file

    def run_analyzer(self, detector_json_path: str):
        print(f"\n{Fore.GREEN}[STAGE 2] Phân tích cấu trúc kỹ thuật (Analyzer)...{Style.RESET_ALL}")
        if not os.path.exists(detector_json_path):
            print(f"{Fore.RED}Lỗi: Không tìm thấy file {detector_json_path}{Style.RESET_ALL}")
            return
            
        with open(detector_json_path, 'r', encoding='utf-8') as f:
            files_to_analyze = json.load(f)
            
        analyzer = Analyzer()
        
        for info_file in tqdm(files_to_analyze, desc="Đang phân tích cấu trúc"):
            file_full_path = os.path.join(self.workspace_dir, info_file['file_path'])
            try:
                with open(file_full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                analyze_output = analyzer.analyze(
                    raw_code=content, 
                    language=info_file['language']
                )
                
                if analyze_output:
                    safe_file_name = info_file['file_path'].replace("/", "_").replace("\\", "_")
                    json_file_name = f"{os.path.splitext(safe_file_name)[0]}_analysis.json"
                    json_file_path = os.path.join(self.dirs["2_analyzer"], json_file_name)
                    
                    try:
                        output_data = analyze_output.model_dump()
                    except AttributeError:
                        output_data = analyze_output.dict()
                        
                    output_data['file_path'] = info_file['file_path']
                        
                    with open(json_file_path, 'w', encoding='utf-8') as json_file:
                        json.dump(output_data, json_file, ensure_ascii=False, indent=4)
            except Exception as e:
                print(f"{Fore.RED}Lỗi khi xử lý file {info_file['file_path']}: {e}{Style.RESET_ALL}")

    def run_planner(self, test_type: str = "UI Testing"):
        print(f"\n{Fore.GREEN}[STAGE 3] Lên kế hoạch test case (Planner)...{Style.RESET_ALL}")
        analyzer_dir = self.dirs["2_analyzer"]
        planner_dir = self.dirs["3_planner"]
        
        if not os.path.exists(analyzer_dir) or not os.listdir(analyzer_dir):
            print(f"{Fore.RED}Lỗi: Thư mục {analyzer_dir} trống hoặc không tồn tại.{Style.RESET_ALL}")
            return
            
        planner = Planner()
        
        for filename in tqdm(os.listdir(analyzer_dir), desc=f"Đang lên kế hoạch cho {test_type}"):
            if not filename.endswith(".json"): continue
            file_path = os.path.join(analyzer_dir, filename)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                    
                plan_output = planner.build_plan(content, requested_test_types=[test_type])
                
                try:
                    planner_data = plan_output.model_dump()
                except AttributeError:
                    planner_data = plan_output.dict()
                    
                planner_data['file_path'] = content.get('file_path', '')
                
                out_filename = filename.replace("_analysis.json", "_plan.json")
                out_path = os.path.join(planner_dir, out_filename)
                
                with open(out_path, 'w', encoding='utf-8') as f:
                    json.dump(planner_data, f, ensure_ascii=False, indent=4)
            except Exception as e:
                print(f"{Fore.RED}Lỗi khi xử lý file {filename}: {e}{Style.RESET_ALL}")

    def run_filter(self):
        print(f"\n{Fore.GREEN}[STAGE 3.5] Lọc các file không có test case (Filter)...{Style.RESET_ALL}")
        planner_dir = self.dirs["3_planner"]
        filter_dir = self.dirs["4_filter"]
        
        valid_count = 0
        skipped_count = 0
        
        for filename in os.listdir(planner_dir):
            if not filename.endswith(".json"): continue
            file_path = os.path.join(planner_dir, filename)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                    
                test_cases = content.get('test_cases', [])
                should_generate = content.get('should_generate_plan', False)
                
                if should_generate and len(test_cases) > 0:
                    out_path = os.path.join(filter_dir, filename)
                    with open(out_path, 'w', encoding='utf-8') as f:
                        json.dump(content, f, ensure_ascii=False, indent=4)
                    valid_count += 1
                else:
                    reason = content.get('skip_reason', 'Không có lý do')
                    print(f"{Fore.YELLOW}  -> Bỏ qua file {filename}: {reason} hoặc test_cases rỗng.{Style.RESET_ALL}")
                    skipped_count += 1
            except Exception as e:
                print(f"{Fore.RED}Lỗi khi lọc file {filename}: {e}{Style.RESET_ALL}")
                
        print(f"{Fore.CYAN}Kết quả: Giữ lại {valid_count} file, Bỏ qua {skipped_count} file.{Style.RESET_ALL}")

    def run_coder(self):
        print(f"\n{Fore.GREEN}[STAGE 4] Lập trình kịch bản Test (Coder)...{Style.RESET_ALL}")

        print(f"{Fore.CYAN}  -> Đang cài đặt Playwright & Trình duyệt (có thể mất vài phút)...{Style.RESET_ALL}")
        try:
            subprocess.run(
                [
                    "npm", "create", "playwright@latest", "--yes", 
                    "--", 
                    "--quiet",                   # Bỏ qua các câu hỏi tương tác
                    "--lang=TypeScript",         # Chọn ngôn ngữ TypeScript
                    "--browser=chromium",        # Chỉ cài Chromium cho nhẹ (hoặc xóa dòng này để cài tất cả)
                    "--github-actions=false",    # Không tạo file CI/CD Github Actions
                    "--test-dir=tests"           # Chỉ định thư mục test giống với core_ai_dir của bạn
                ],
                check=True,
                shell=(os.name == 'nt')          # Rất quan trọng nếu chạy trên Windows
            )
            print(f"{Fore.GREEN}  -> Cài đặt Playwright thành công!{Style.RESET_ALL}")
        except subprocess.CalledProcessError as e:
            print(f"{Fore.RED}Lỗi trong quá trình khởi tạo Playwright: {e}{Style.RESET_ALL}")
            return
        except FileNotFoundError:
            print(f"{Fore.RED}Không tìm thấy lệnh 'npm'. Vui lòng cài đặt Node.js trước!{Style.RESET_ALL}")
            return

        filter_dir = self.dirs["4_filter"]
        coder_dir = self.dirs["5_coder"]
        core_ai_dir = "tests"
        os.makedirs(core_ai_dir, exist_ok=True)
        
        if not os.path.exists(filter_dir) or not os.listdir(filter_dir):
            print(f"{Fore.YELLOW}Không có file hợp lệ nào trong {filter_dir} để tạo code.{Style.RESET_ALL}")
            return
            
        coder = Coder()
        # Chạy coder sinh file ra thư mục core-AI
        manifest = coder.generate_from_filtered(
            filtered_input=Path(filter_dir),
            output_dir=Path(core_ai_dir),
            base_url="http://localhost:3000" # Có thể lấy từ tham số động sau
        )
        
        # manifest['input'], manifest['output_dir'], manifest['generated']
        # Lưu log chạy của Coder vào 5_coder_outputs
        coder_log_path = os.path.join(coder_dir, "coder_manifest.json")
        with open(coder_log_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=4)
            
        print(f"{Fore.CYAN}  -> Đã tạo {manifest['generated_count']} file spec tại {core_ai_dir}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}  -> Đã lưu manifest log tại {coder_log_path}{Style.RESET_ALL}")

    def run_executor(self):
        print(f"\n{Fore.GREEN}[STAGE 5] Chạy test trong Sandbox (Executor)...{Style.RESET_ALL}")
        coder_dir = self.dirs["5_coder"]
        executor_dir = self.dirs["6_executor"]
        # core_ai_dir = os.path.join(self.base_output_dir, "core-AI")
        core_ai_dir = "tests"
        
        coder_manifest_path = os.path.join(coder_dir, "coder_manifest.json")
        if not os.path.exists(coder_manifest_path):
            print(f"{Fore.YELLOW}Không tìm thấy code test nào. Bỏ qua Executor.{Style.RESET_ALL}")
            return None
            
        runner = Runner()
        report_file = os.path.join(executor_dir, "test_report.json")
        
        # Verify that there are generated spec files before running tests
        specs_path = Path(core_ai_dir)
        spec_files = list(specs_path.glob("*.spec.ts"))

        if not spec_files:
            print(f"{Fore.YELLOW}Không có file spec nào để chạy. Bỏ qua Executor.{Style.RESET_ALL}")
            return None
        
        report_file = runner.run_specs(
            specs_dir = spec_files,
            report_file=Path(report_file),
            working_dir=self.workspace_dir,
            base_url="http://localhost:3000"
        )
        
        print(f"{Fore.CYAN}  -> Đã chạy xong test. Lưu kết quả tại {report_file}{Style.RESET_ALL}")
        return report_file

    def run_reporter(self, executor_json_path: str):
        if not executor_json_path or not os.path.exists(executor_json_path):
            return
            
        print(f"\n{Fore.GREEN}[STAGE 6] Tổng hợp kết quả (Reporter)...{Style.RESET_ALL}")
        reporter = Reporter()
        report_output = reporter.generate_report(executor_json_path)
        
        try:
            report_data = report_output.model_dump()
        except AttributeError:
            report_data = report_output.dict()
            
        final_report_path = os.path.join(self.dirs["7_reporter"], "final_report.json")
        with open(final_report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=4)
            
        print(f"{Fore.CYAN}  -> Điểm số (Health Score): {report_output.health_score}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}  -> Đã lưu báo cáo chung tại: {final_report_path}{Style.RESET_ALL}")

    def execute_pipeline(self):
        print(f"\n{Fore.GREEN}=== BẮT ĐẦU CHẠY AI PIPELINE ==={Style.RESET_ALL}")
        # detector_out = self.run_detector()
        # self.run_analyzer(detector_out)
        # self.run_planner(test_type="UI Testing")
        # self.run_filter()
        # self.run_coder()
        executor_out = self.run_executor()
        # self.run_reporter(executor_out)
        print(f"\n{Fore.GREEN}=== HOÀN TẤT PIPELINE ==={Style.RESET_ALL}")

if __name__ == "__main__":
    src_code_path = "workspace/pc-store-ecommerce-website"
    pipeline = AIPipelineOrchestrator(workspace_dir=src_code_path)
    pipeline.execute_pipeline()
