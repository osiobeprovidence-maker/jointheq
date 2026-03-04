
import { execSync } from 'child_process';
try {
    const result = execSync('npx convex run migration:importUsers "{\\"users\\": []}"').toString();
    console.log("Result:", result);
} catch (e: any) {
    console.error("Error:", e.message);
    if (e.stdout) console.error("Stdout:", e.stdout.toString());
    if (e.stderr) console.error("Stderr:", e.stderr.toString());
}
