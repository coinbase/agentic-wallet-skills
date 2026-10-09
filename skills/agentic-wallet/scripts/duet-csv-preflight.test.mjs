import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const adapter=join(dirname(fileURLToPath(import.meta.url)), 'duet-csv-preflight.mjs');
function run(output, execute=true, csvText='id,name\n1,Alice\n'){
 const dir=mkdtempSync(join(tmpdir(),'duet-adapter-'));
 const csv=join(dir,'input.csv'), marker=join(dir,'executed');
 writeFileSync(csv,csvText);
 writeFileSync(join(dir,'npx'), '#!/usr/bin/env node\nrequire("node:fs").writeFileSync(process.env.DUET_TEST_MARKER, "executed");process.stdout.write(process.env.DUET_TEST_OUTPUT);\n',{mode:0o755});
 try {
  const r=spawnSync(process.execPath,[adapter,'--csv-file',csv,...(execute?['--execute']:[])],{encoding:'utf8',env:{...process.env,PATH:dir+':'+process.env.PATH,DUET_TEST_MARKER:marker,DUET_TEST_OUTPUT:typeof output==='string'?output:JSON.stringify(output)}});
  return {...r,executed:existsSync(marker)};
 } finally {rmSync(dir,{recursive:true,force:true});}
}
const current={service:'duet-csv-preflight',version:'0.1.1',summary:{dataRecords:1,columns:2,issueCount:0,errorCount:0,warningCount:0},counts:{},issues:[]};
test('accepts current Worker summary without structuralErrors',()=>{
 const r=run(current);assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),current);
});
test('accepts summary with a valid optional structuralErrors count',()=>{
 const r=run({...current,summary:{...current.summary,structuralErrors:0}});assert.equal(r.status,0,r.stderr);
});
for(const summary of [null,{}, {errorCount:-1},{errorCount:'0'},{errorCount:0,structuralErrors:null},{errorCount:0,structuralErrors:-1},{errorCount:0,structuralErrors:'0'}]){
 test('rejects malformed summary '+JSON.stringify(summary),()=>{assert.notEqual(run({summary}).status,0);});
}
test('dry run never invokes wallet',()=>{
 const r=run('not-json',false);assert.equal(r.status,0,r.stderr);assert.equal(r.executed,false);assert.equal(JSON.parse(r.stdout).paymentMade,false);
});
test('invalid wallet JSON blocks import',()=>{assert.notEqual(run('not-json').status,0);});
test('returns reported errors for caller to block import',()=>{
 const result={...current,summary:{...current.summary,errorCount:1,issueCount:1}};
 const r=run(result);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).summary.errorCount,1);
});

test('oversized CSV blocks before invoking the wallet',()=>{
 const r=run(current,true,'id\\n'+'x'.repeat(131072));
 assert.notEqual(r.status,0);assert.equal(r.executed,false);
});
test('JSON expansion beyond the server request cap blocks before invoking the wallet',()=>{
 const r=run(current,true,'id\\n'+'\\n'.repeat(70000));
 assert.notEqual(r.status,0);assert.equal(r.executed,false);
});
