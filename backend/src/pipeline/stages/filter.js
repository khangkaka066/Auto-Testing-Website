const fs = require('fs');
const path = require('path');

function run(plannerDir, outputDir) {
  const files = fs.readdirSync(plannerDir).filter(f => f.endsWith('.json'));
  let validCount = 0;
  let skippedCount = 0;

  for (const filename of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(plannerDir, filename), 'utf-8'));
      const testCases = content.test_cases || [];
      const shouldGenerate = content.should_generate_plan;

      if (shouldGenerate && testCases.length > 0) {
        fs.writeFileSync(
          path.join(outputDir, filename),
          JSON.stringify(content, null, 2),
          'utf-8'
        );
        validCount++;
      } else {
        console.log(`[Filter] Skip ${filename}: ${content.skip_reason || 'no test cases'}`);
        skippedCount++;
      }
    } catch (err) {
      console.error(`[Filter] Error reading ${filename}: ${err.message}`);
    }
  }

  console.log(`[Filter] Kept ${validCount}, skipped ${skippedCount} files.`);
}

module.exports = { run };
