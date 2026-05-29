import os
import json
from pathlib import Path
import shutil
from colorama import Fore, Style
import time
from tqdm import tqdm
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
import re

from detector.detector import Detector
from analyzer.analyzer import Analyzer
from planner.planner import Planner
from coder.coder import Coder
from runner.runner import Runner
from reporter.reporter import Reporter

try:
    from utils.ai_runtime import get_max_workers, read_cache, stable_hash, write_cache
except ImportError:
    from backend.ai_engine.utils.ai_runtime import get_max_workers, read_cache, stable_hash, write_cache

class AIPipelineOrchestrator:
    def __init__(self, user_id: str, project_id: str, source_code_path: str):
        self.user_id = user_id
        self.project_id = project_id
        self.source_code_path = source_code_path
        
        # Tạo ID cho lần chạy này dựa trên Timestamp
        self.run_id = f"run_{int(time.time())}"
        # self.run_id = "run_1779946239"
        
        # Tạo đường dẫn Workspace Động (Dynamic Path)
        base_workspace = os.getenv("WORKSPACE_BASE_PATH", "workspaces")
        self.run_workspace_dir = os.path.join(base_workspace, user_id, project_id, "runs", self.run_id)
        self.cache_dir = os.path.join(base_workspace, user_id, project_id, ".ai_cache")
        
        # Đường dẫn gốc (mã nguồn của user)
        self.workspace_dir = source_code_path 
        
        # Thư mục lưu test script sinh ra
        self.core_ai_dir = os.path.join(self.run_workspace_dir, "tests")

        # [MỚI] Thư mục output NẰM BÊN TRONG Run Workspace (Cô lập hoàn toàn)
        self.dirs = {
            "1_detector": os.path.join(self.run_workspace_dir, "1_detector"),
            "2_analyzer": os.path.join(self.run_workspace_dir, "2_analyzer"),
            "3_planner": os.path.join(self.run_workspace_dir, "3_planner"),
            "4_filter": os.path.join(self.run_workspace_dir, "4_filter"),
            "5_coder": os.path.join(self.run_workspace_dir, "5_coder"),
            "5.5_validator": os.path.join(self.run_workspace_dir, "5.5_validator"),
            "6_executor": os.path.join(self.run_workspace_dir, "6_executor"),
            "7_reporter": os.path.join(self.run_workspace_dir, "7_reporter"),
        }
        
        self.setup_directories()

    def setup_directories(self):
        print(f"{Fore.CYAN}[SETUP] Đang khởi tạo các thư mục lưu trữ I/O...{Style.RESET_ALL}")
        os.makedirs(self.cache_dir, exist_ok=True)
        for key, dir_path in self.dirs.items():
            os.makedirs(dir_path, exist_ok=True)
            print(f"  -> {dir_path}")

    def run_detector(self):
        print(f"\n{Fore.GREEN}[STAGE 1] Quét dự án và phân loại file (Detector)...{Style.RESET_ALL}")
        detector = Detector()
        detector_results = detector.run(self.workspace_dir)
        
        output_file = os.path.join(self.dirs["1_detector"], "detector_results.json")
        
        # Lưu thẳng Dict vào file JSON, không cần for...in model_dump nữa
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(detector_results, f, ensure_ascii=False, indent=4)
            
        # Lấy thông tin để in log đẹp mắt hơn
        num_files = len(detector_results.get("source_files", []))
        num_projects = detector_results.get("infrastructure", {}).get("total_projects", 0)
            
        print(f"  -> Đã tìm thấy {num_files} file code hợp lệ và cấu hình của {num_projects} project.")
        print(f"  -> Đã lưu kết quả tại: {output_file}")
        
        return output_file

    def run_analyzer(self, detector_json_path: str):
        print(f"\n{Fore.GREEN}[STAGE 2] Phân tích cấu trúc kỹ thuật (Analyzer)...{Style.RESET_ALL}")
        if not os.path.exists(detector_json_path):
            print(f"{Fore.RED}Lỗi: Không tìm thấy file {detector_json_path}{Style.RESET_ALL}")
            return
            
        with open(detector_json_path, 'r', encoding='utf-8') as f:
            # Lấy list source_files từ trong dictionary tổng
            detector_data = json.load(f)
            files_to_analyze = detector_data.get("source_files", [])
            
        analyzer = Analyzer()
        cache_dir = os.path.join(self.cache_dir, "analyzer")

        def analyze_one(info_file):
            file_full_path = os.path.join(self.workspace_dir, info_file['file_path'])
            try:
                with open(file_full_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                cache_key = stable_hash({
                    "stage": "analyzer",
                    "model": analyzer.model,
                    "system_prompt": analyzer.system_prompt,
                    "file_path": info_file['file_path'],
                    "language": info_file['language'],
                    "content": content,
                })
                output_data = read_cache(cache_dir, cache_key)

                if output_data is None:
                    analyze_output = analyzer.analyze(
                        raw_code=content,
                        language=info_file['language']
                    )
                    if not analyze_output:
                        return None

                    try:
                        output_data = analyze_output.model_dump()
                    except AttributeError:
                        output_data = analyze_output.dict()
                    write_cache(cache_dir, cache_key, output_data)

                output_data['file_path'] = info_file['file_path']
                safe_file_name = info_file['file_path'].replace("/", "_").replace("\\", "_")
                json_file_name = f"{os.path.splitext(safe_file_name)[0]}_analysis.json"
                json_file_path = os.path.join(self.dirs["2_analyzer"], json_file_name)

                with open(json_file_path, 'w', encoding='utf-8') as json_file:
                    json.dump(output_data, json_file, ensure_ascii=False, indent=4)
                return json_file_path
            except Exception as e:
                print(f"{Fore.RED}Lỗi khi xử lý file {info_file['file_path']}: {e}{Style.RESET_ALL}")
                return None

        max_workers = min(get_max_workers(), len(files_to_analyze)) if files_to_analyze else 1
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(analyze_one, info_file) for info_file in files_to_analyze]
            for future in tqdm(as_completed(futures), total=len(futures), desc="Đang phân tích cấu trúc"):
                future.result()

    def run_planner(self, test_type: str = "UI Testing"):
        print(f"\n{Fore.GREEN}[STAGE 3] Lên kế hoạch test case (Planner)...{Style.RESET_ALL}")
        analyzer_dir = self.dirs["2_analyzer"]
        planner_dir = self.dirs["3_planner"]
        
        if not os.path.exists(analyzer_dir) or not os.listdir(analyzer_dir):
            print(f"{Fore.RED}Lỗi: Thư mục {analyzer_dir} trống hoặc không tồn tại.{Style.RESET_ALL}")
            return
            
        planner = Planner()
        cache_dir = os.path.join(self.cache_dir, "planner")
        analyzer_files = [filename for filename in os.listdir(analyzer_dir) if filename.endswith(".json")]

        def plan_one(filename):
            file_path = os.path.join(analyzer_dir, filename)

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = json.load(f)

                cache_key = stable_hash({
                    "stage": "planner",
                    "model": planner.model,
                    "system_prompt": planner.system_prompt,
                    "test_type": test_type,
                    "analysis": content,
                })
                planner_data = read_cache(cache_dir, cache_key)

                if planner_data is None:
                    plan_output = planner.build_plan(content, requested_test_types=[test_type])

                    try:
                        planner_data = plan_output.model_dump()
                    except AttributeError:
                        planner_data = plan_output.dict()
                    write_cache(cache_dir, cache_key, planner_data)

                planner_data['file_path'] = content.get('file_path', '')

                out_filename = filename.replace("_analysis.json", "_plan.json")
                out_path = os.path.join(planner_dir, out_filename)

                with open(out_path, 'w', encoding='utf-8') as f:
                    json.dump(planner_data, f, ensure_ascii=False, indent=4)
                return out_path
            except Exception as e:
                print(f"{Fore.RED}Lỗi khi xử lý file {filename}: {e}{Style.RESET_ALL}")
                return None

        max_workers = min(get_max_workers(), len(analyzer_files)) if analyzer_files else 1
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(plan_one, filename) for filename in analyzer_files]
            for future in tqdm(as_completed(futures), total=len(futures), desc=f"Đang lên kế hoạch cho {test_type}"):
                future.result()

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

    def run_coder(self, playwright_config_path="playwright.config.ts", base_url="http://localhost:5173"):
        print(f"\n{Fore.GREEN}[STAGE 4] Lập trình kịch bản Test (Coder)...{Style.RESET_ALL}")

        dynamic_pw_config = os.path.join(self.run_workspace_dir, "playwright.config.ts")
        template_path = Path(__file__).resolve().parent / "coder" / "playwright_template.config.ts"
        if os.path.exists(template_path):
            shutil.copy(template_path, dynamic_pw_config)
            
        coder = Coder()
        manifest = coder.generate_from_filtered(
            filtered_input=Path(self.dirs["4_filter"]),
            output_dir=Path(self.core_ai_dir), # [MỚI] Push test file vào Workspace động
            base_url=base_url,
            cache_dir=Path(self.cache_dir) / "coder",
        )
        
        with open(os.path.join(self.dirs["5_coder"], "coder_manifest.json"), 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=4)

    def run_validator(self):
        print(f"\n{Fore.GREEN}[STAGE 4.5] Kiểm tra mã nguồn (Validator)...{Style.RESET_ALL}")
        import glob
        # [MỚI] Lấy file spec từ thư mục Workspace động
        spec_files = glob.glob(os.path.join(self.core_ai_dir, "*.spec.ts"))
        if not spec_files: return False

        check_cmd = [
            "npx", "tsc",
            "--noEmit", "--target", "es2022", "--moduleResolution", "bundler",
            "--skipLibCheck", "--lib", "es2022,dom"
        ] + spec_files

        # [MỚI] Chạy tsc command TẠI THƯ MỤC LÀM VIỆC ĐỘNG để path không bị rối
        result = subprocess.run(check_cmd, capture_output=True, text=True, shell=(os.name == 'nt'), cwd='.')
        if result.returncode == 0:
            return True
        else:
            error_log_path = os.path.join(self.dirs["5.5_validator"], "validator_errors.log")
            with open(error_log_path, 'w', encoding='utf-8') as f:
                f.write(result.stdout)
                if result.stderr:
                    f.write("\n")
                    f.write(result.stderr)
            return False

    def _validator_error_log_path(self):
        return os.path.join(self.dirs["5.5_validator"], "validator_errors.log")

    def _resolve_generated_spec_path(self, raw_path: str):
        raw_path = raw_path.strip()
        if not raw_path:
            return None

        core_dir = Path(self.core_ai_dir).resolve()
        raw_candidate = Path(raw_path)
        candidates = []

        if raw_candidate.is_absolute():
            candidates.append(raw_candidate)
        else:
            candidates.extend([
                Path(raw_path),
                Path(self.run_workspace_dir) / raw_path,
                Path(self.core_ai_dir) / raw_candidate.name,
            ])

        for candidate in candidates:
            try:
                resolved = candidate.resolve()
                if (
                    resolved.exists()
                    and resolved.name.endswith(".spec.ts")
                    and resolved.is_relative_to(core_dir)
                ):
                    return str(resolved)
            except OSError:
                continue

        return None

    def get_failed_spec_files_from_validator_log(self):
        log_path = self._validator_error_log_path()
        if not os.path.exists(log_path):
            return []

        with open(log_path, 'r', encoding='utf-8') as f:
            error_logs = f.read()

        raw_matches = re.findall(r"((?:[A-Za-z]:)?[^\s:(]+\.spec\.ts)", error_logs)
        failed_files = set()
        for raw_path in raw_matches:
            resolved_path = self._resolve_generated_spec_path(raw_path)
            if resolved_path:
                failed_files.add(resolved_path)

        return sorted(failed_files)

    def remove_failed_spec_files_after_debugging(self):
        failed_files = self.get_failed_spec_files_from_validator_log()
        if not failed_files:
            print(f"{Fore.YELLOW}[Validator] Không xác định được file spec lỗi để xoá.{Style.RESET_ALL}")
            return []

        removed_files = []
        skipped_files = []

        for file_path in failed_files:
            try:
                os.remove(file_path)
                removed_files.append(file_path)
                print(f"{Fore.YELLOW}  -> Đã xoá spec lỗi: {file_path}{Style.RESET_ALL}")
            except OSError as exc:
                skipped_files.append({"file_path": file_path, "error": str(exc)})
                print(f"{Fore.RED}  -> Không thể xoá spec lỗi {file_path}: {exc}{Style.RESET_ALL}")

        cleanup_report_path = os.path.join(self.dirs["5.5_validator"], "removed_failed_specs.json")
        with open(cleanup_report_path, 'w', encoding='utf-8') as f:
            json.dump({
                "removed_count": len(removed_files),
                "removed_files": removed_files,
                "skipped_files": skipped_files,
            }, f, ensure_ascii=False, indent=4)

        print(f"{Fore.CYAN}  -> Đã lưu danh sách spec bị xoá tại: {cleanup_report_path}{Style.RESET_ALL}")
        return removed_files

    def run_debugger(self):
        print(f"\n{Fore.MAGENTA}[STAGE 4.7] Tự động sửa lỗi mã nguồn (Smart Bug Fixer)...{Style.RESET_ALL}")
        log_path = self._validator_error_log_path()
        if not os.path.exists(log_path): return
            
        with open(log_path, 'r', encoding='utf-8') as f: error_logs = f.read()

        failed_files = self.get_failed_spec_files_from_validator_log()

        coder_manifest_path = os.path.join(self.dirs["5_coder"], "coder_manifest.json")
        spec_to_plan_map = {}
        if os.path.exists(coder_manifest_path):
            with open(coder_manifest_path, 'r', encoding='utf-8') as mf:
                manifest_data = json.load(mf)

                # Map từ "tests/CheckoutPage.spec.ts" -> "client_src_pages_CheckoutPage_plan.json"
                for item in manifest_data.get("generated", []):
                    spec_path = Path(self.run_workspace_dir) / "tests" / item['spec_file']
                    spec_to_plan_map[str(spec_path.resolve())] = item['source_file']

        # print(spec_to_plan_map)
        
        if not failed_files:
            print(f"{Fore.YELLOW}  -> Không tìm thấy file spec lỗi cần sửa.{Style.RESET_ALL}")
            return

        error_lines = error_logs.splitlines()

        def load_test_plan_for_spec(file_path: str) -> str:
            test_plan_content = "Không tìm thấy Test Plan."
            plan_filename = spec_to_plan_map.get(file_path)
            if plan_filename:
                plan_file_path = os.path.join(self.dirs["4_filter"], plan_filename)
                if os.path.exists(plan_file_path):
                    with open(plan_file_path, 'r', encoding='utf-8') as pf:
                        plan_data = json.load(pf)
                        test_cases_array = plan_data.get("test_cases", [])
                        if test_cases_array:
                            test_plan_content = json.dumps(test_cases_array, ensure_ascii=False, indent=2)
                        else:
                            test_plan_content = "File Plan không chứa test_cases nào."
            return test_plan_content

        def extract_file_specific_log(file_path: str) -> str:
            file_name = Path(file_path).name
            matching_lines = [
                line for line in error_lines
                if file_path in line or file_name in line
            ]
            return "\n".join(matching_lines) or error_logs

        def fix_one_file(file_path: str):
            from debugger.debugger import Debugger

            full_target_path = file_path
            if not os.path.exists(full_target_path):
                return {
                    "file_path": file_path,
                    "status": "skipped",
                    "reason": "File không tồn tại.",
                }

            try:
                ai_debugger = Debugger()
                test_plan_content = load_test_plan_for_spec(file_path)
                file_specific_log = extract_file_specific_log(file_path)
                result = ai_debugger.fix_code(full_target_path, file_specific_log, test_plan_content)
                return {
                    "file_path": file_path,
                    "status": "fixed" if result else "failed",
                    "reason": "",
                }
            except Exception as exc:
                return {
                    "file_path": file_path,
                    "status": "failed",
                    "reason": str(exc),
                }

        max_workers = min(get_max_workers(), len(failed_files))
        results = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(fix_one_file, file_path) for file_path in failed_files]
            for future in tqdm(as_completed(futures), total=len(futures), desc="Fixing file"):
                result = future.result()
                results.append(result)
                if result["status"] == "failed":
                    print(f"{Fore.RED}  -> Fix thất bại {result['file_path']}: {result['reason']}{Style.RESET_ALL}")
                elif result["status"] == "skipped":
                    print(f"{Fore.YELLOW}  -> Bỏ qua {result['file_path']}: {result['reason']}{Style.RESET_ALL}")

        debugger_report_path = os.path.join(self.dirs["5.5_validator"], "debugger_results.json")
        with open(debugger_report_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=4)
        print(f"{Fore.CYAN}  -> Đã lưu kết quả debugger tại: {debugger_report_path}{Style.RESET_ALL}")
    
    def run_executor(self, base_url="http://localhost:5173"):
        print(f"\n{Fore.GREEN}[STAGE 5] Chạy test trong Sandbox (Executor)...{Style.RESET_ALL}")
        
        report_file = os.path.join(self.dirs["6_executor"], "test_report.json")
        spec_files = list(Path(self.core_ai_dir).glob("*.spec.ts"))
        if not spec_files: return None
        detector_file_path = os.path.join(self.dirs["1_detector"], "detector_results.json")
        with open(detector_file_path, 'r', encoding='utf-8') as detect_file:
            infrastructures = json.load(detect_file)['infrastructure']

        for project in infrastructures["projects"]:
            if project["project_name"].lower() == "frontend" or project["root_path"].split('/')[-1].lower() in ['client', 'frontend']:
                os.environ["FRONTEND_DIR"] = os.path.abspath(project.get("root_path"))
                break
        
        os.environ["TARGET_WORKSPACE_DIR"] = self.workspace_dir
        os.environ["BASE_URL"] = base_url

        runner = Runner()
        # [MỚI] Chạy Playwright với working_dir trỏ thẳng vào Workspace Động
        runner.run_specs(
            specs_dir=spec_files,
            report_file=Path(report_file),
            working_dir=self.run_workspace_dir, 
            base_url=base_url
        )

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

    def execute_pipeline(self, base_url="http://localhost:5173"):
        print(f"\n{Fore.GREEN}=== BẮT ĐẦU CHẠY AI PIPELINE ==={Style.RESET_ALL}")
        detector_out = self.run_detector()
        self.run_analyzer(detector_out)
        self.run_planner(test_type="UI Testing")
        self.run_filter()
        self.run_coder("playwright.config.ts", base_url)

        # --- CƠ CHẾ AUTO-HEALING (TỐI ĐA 3 LẦN) ---
        MAX_RETRIES = 3
        is_valid = self.run_validator()

        attempt = 0
        while attempt < MAX_RETRIES and not is_valid:
            attempt += 1
            print(f"\n{Fore.YELLOW}--- Tiến hành phẫu thuật mã nguồn (Lần {attempt}/{MAX_RETRIES}) ---{Style.RESET_ALL}")
            self.run_debugger() # Gọi bác sĩ AI để sửa code
            is_valid = self.run_validator()

        if not is_valid:
            print(f"\n{Fore.YELLOW}[FALLBACK] Vẫn còn spec lỗi sau {MAX_RETRIES} lần sửa. Đang xoá các spec lỗi và tiếp tục với phần còn lại...{Style.RESET_ALL}")
            removed_files = self.remove_failed_spec_files_after_debugging()
            if removed_files:
                is_valid = True

        if is_valid:
            remaining_specs = list(Path(self.core_ai_dir).glob("*.spec.ts"))
            if not remaining_specs:
                print(f"\n{Fore.RED}[FAILED] Không còn file spec hợp lệ nào để chạy sau bước cleanup.{Style.RESET_ALL}")
                print(f"\n{Fore.GREEN}=== HOÀN TẤT PIPELINE ==={Style.RESET_ALL}")
                return

            print(f"\n{Fore.GREEN}[SUCCESS] Các spec còn lại đã sạch. Đang đẩy vào Sandbox (Docker)...{Style.RESET_ALL}")
            executor_out = self.run_executor(base_url)
            self.run_reporter(executor_out)
        else:
            print(f"\n{Fore.RED}[FAILED] Pipeline thất bại. Không thể xác định/xoá hết các spec lỗi sau {MAX_RETRIES} lần sửa.{Style.RESET_ALL}")
            
        print(f"\n{Fore.GREEN}=== HOÀN TẤT PIPELINE ==={Style.RESET_ALL}")

if __name__ == "__main__":
    src_code_path = "workspace/pc-store-ecommerce-website"
    pipeline = AIPipelineOrchestrator(user_id="demo_user1", project_id="demo_proj", source_code_path=src_code_path)
    pipeline.execute_pipeline()
