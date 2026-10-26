import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { diagnose, supportedNode } from '../scripts/doctor.mjs';
describe('中文安装诊断',()=>{
  it('检查 Vite 所需 Node 最低版本',()=>{
    expect(supportedNode('22.11.0')).toBe(false);
    expect(supportedNode('20.19.0')).toBe(false);
    expect(supportedNode('22.12.0')).toBe(true);
    expect(supportedNode('24.0.0')).toBe(true);
  });
  it('缺少依赖时给出中文恢复命令而非模块异常',async()=>{
    await mkdir('artifacts',{recursive:true});
    const root=await mkdtemp(resolve('artifacts','doctor-test-'));
    try {
      await writeFile(resolve(root,'package.json'),JSON.stringify({dependencies:{react:'*'}}));
      await writeFile(resolve(root,'package-lock.json'),JSON.stringify({packages:{'node_modules/react':{version:'19.2.0'}}}));
      const checks=await diagnose(root,false);
      expect(checks.some(c=>!c.ok && c.message.includes('依赖缺失') && c.message.includes('npm run setup'))).toBe(true);
      expect(checks.some(c=>c.message.includes('无需配置模型 API Key'))).toBe(true);
    }finally {await rm(root,{recursive:true,force:true});}
  });
});
