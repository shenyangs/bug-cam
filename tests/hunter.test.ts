import { describe, it, expect } from 'vitest';
import { validateTarget, TARGET } from '../server/hunter';
describe('fixture-only scope',()=>{
  it('allows only the exact bundled target or default',()=>{expect(validateTarget(undefined)).toBe(TARGET);expect(validateTarget(TARGET)).toBe(TARGET);});
  it.each(['https://example.org','http://localhost:5204/fixture/','http://127.0.0.1:5204/fixture/../secret','file:///etc/passwd','http://127.0.0.1:9999/',{},null])('rejects user supplied target %j',(target)=>{expect(()=>validateTarget(target)).toThrow('仅允许扫描内置的本地故障示例页面');});
});
