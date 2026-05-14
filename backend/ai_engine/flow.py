from tqdm import tqdm
import os
import asyncio
from colorama import Fore, Back, Style
from agent.detector import Detector
from agent.analyzer import Analyzer

if __name__ == "__main__":
    detectorAgent = Detector()
    analyzerAgent = Analyzer()
    src_code_path = "workspace/pc-store-ecommerce-website"

    #-----------------STAGE 1-----------------
    #Scan file code is needed
    scan_projects = detectorAgent.scan_project(src_code_path)
    #Get info file code by name of file
    info_files = asyncio.run(detectorAgent.select_critical_files(scan_projects)).files
    #-----------------STAGE 2-----------------
    #Get content in each file code
    for info_file in tqdm(info_files, desc="Remaining file(s):"):
        with open(os.path.join(src_code_path, info_file.file_path), 'r') as f:
            content = f.read()
        #Analyze and give the result of test scenarios
        analyze_output = analyzerAgent.analyze(content, info_file.framework, info_file.language)
        print(analyze_output)