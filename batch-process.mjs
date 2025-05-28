import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

process.env.CI = 'true';
const commits = (fs.readFileSync('commits.txt', 'utf-8')).split('\n');
// console.log(targets)

const targets = commits.map(c=>{
  return {
    "owner": "vuejs",
    "repo": "core",
    "commit": c
  }
})

const ROOT = process.cwd();

for (const { owner, repo, commit } of targets) {
    const tarballUrl = `https://github.com/${owner}/${repo}/tarball/${commit}`;
    const tarballName = `${repo}-${commit}.tar.gz`;
    const extractDir = path.join(ROOT, `${repo}-${commit}`);

    try {
        console.log(`\n⬇️ Downloading ${repo}@${commit}...`);
        execSync(`curl -L ${tarballUrl} -o ${tarballName}`, { stdio: 'inherit' });

        fs.mkdirSync(extractDir);
        execSync(`tar -xzf ${tarballName} --strip-components=1 -C ${extractDir}`, { stdio: 'inherit' });

        // 修改 package.json
        const pkgPath = path.join(extractDir, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        pkg.scripts.test = "vitest run";
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

        // 修改 vitest.config.ts
        const vitestConfigPath = path.join(extractDir, 'vitest.config.ts');
        if (fs.existsSync(vitestConfigPath)) {
            let content = fs.readFileSync(vitestConfigPath, 'utf-8');
            content = content.replace(/reporter:\s*\[[^\]]*\]/, "reporter: ['json']");
            fs.writeFileSync(vitestConfigPath, content);
        }

        // 执行测试
        process.chdir(extractDir);
        console.log('📦 Installing...');
        execSync('pnpm install', { stdio: 'inherit' });

        console.log('✅ Testing...');
        execSync('pnpm test-coverage', { stdio: 'inherit' });

        // 上报覆盖率
        console.log('📤 Reporting coverage...');

        execSync('node ../report-coverage.js', {
            stdio: 'inherit',
            env: {
                ...process.env,
                GITHUB_REPOSITORY: `${owner}/${repo}`,
                GITHUB_SHA: commit,
                GITHUB_RUN_ID: 'your-run-id',
                GITHUB_REF: 'refs/heads/main',
            }
        });



    } catch (err) {
        console.error(`❌ Error in ${repo}@${commit}`, err.message);
    } finally {
        process.chdir(ROOT);
        fs.rmSync(extractDir, { recursive: true, force: true });
        fs.rmSync(tarballName, { force: true });
        console.log(`🧹 Cleaned ${repo}@${commit}`);
    }
}
