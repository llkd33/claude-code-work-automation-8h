'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'templates/skills/grill-me');
const files = ['SKILL.md', 'LICENSE', 'SOURCE.md'];
try {
  if (fs.realpathSync(process.cwd()) !== fs.realpathSync(root)) {
    throw new Error('claude-work-lab 폴더에서 명령을 실행하세요.');
  }
  const parts = ['.claude', '.claude/skills', '.claude/skills/grill-me'];
  for (const part of parts) {
    const p = path.join(root, part);
    let stat;
    try { stat = fs.lstatSync(p); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat) {
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error(`${part} 경로가 일반 폴더가 아닙니다. 기존 경로를 보존했습니다.`);
      }
    }
  }
  const dest = path.join(root, '.claude/skills/grill-me');
  const data = files.map(name => [name, fs.readFileSync(path.join(source, name))]);
  const existed = fs.existsSync(dest);
  if (existed) {
    const names = fs.readdirSync(dest).sort();
    if (JSON.stringify(names) !== JSON.stringify([...files].sort()) || data.some(([name, bytes]) => {
      const p = path.join(dest, name);
      return fs.lstatSync(p).isSymbolicLink() || !fs.statSync(p).isFile() || !fs.readFileSync(p).equals(bytes);
    })) throw new Error('다른 grill-me가 이미 있습니다. 덮어쓰지 않았습니다. 강사에게 경로와 오류를 보여 주세요.');
  } else {
    fs.mkdirSync(dest, { recursive: true });
    for (const [name, bytes] of data) fs.writeFileSync(path.join(dest, name), bytes, { flag: 'wx' });
  }
  console.log(JSON.stringify({ status: existed ? 'ALREADY_INSTALLED' : 'INSTALLED', skill: 'grill-me', variant: '8h-course', scope: 'project', path: '.claude/skills/grill-me/SKILL.md' }));
  console.log('Claude Code에서 /grill-me를 확인하세요. 보이지 않으면 같은 폴더에서 Claude를 다시 시작하세요. 개인·조직에 동명 스킬이 있으면 /skills에서 실제 경로를 확인하세요.');
} catch (error) {
  console.error(`설치 실패: ${error.message}`);
  process.exitCode = 1;
}
