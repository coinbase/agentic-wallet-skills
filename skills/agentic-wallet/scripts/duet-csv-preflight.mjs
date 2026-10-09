#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ENDPOINT='https://duet-csv-preflight.timbeaux-sora.chatgpt.site/v1/preflight';
const MAX_CSV_BYTES=131072;
const MAX_USDC_ATOMIC='5000';
const AWAL_VERSION='2.12.1';

function parse(argv){const o={requiredFields:[],execute:false};for(let i=0;i<argv.length;i++){const a=argv[i];if(a==='--csv-file')o.csvFile=argv[++i];else if(a==='--required')o.requiredFields.push(argv[++i]);else if(a==='--key')o.keyField=argv[++i];else if(a==='--delimiter')o.delimiter=argv[++i];else if(a==='--execute')o.execute=true;else throw new Error('Unknown argument: '+a);}return o;}
function validate(o){if(!o.csvFile)throw new Error('Provide --csv-file');const csv=readFileSync(o.csvFile,'utf8');if(!csv)throw new Error('csv must not be empty');if(Buffer.byteLength(csv,'utf8')>MAX_CSV_BYTES)throw new Error('csv exceeds limit');const body={csv};if(o.requiredFields.length)body.requiredFields=o.requiredFields;if(o.keyField)body.keyField=o.keyField;if(o.delimiter)body.delimiter=o.delimiter;if(Buffer.byteLength(JSON.stringify(body),'utf8')>MAX_CSV_BYTES)throw new Error('JSON request exceeds limit');return body;}
const o=parse(process.argv.slice(2));const body=validate(o);const args=[`awal@${AWAL_VERSION}`,'x402','pay',ENDPOINT,'-X','POST','-d',JSON.stringify(body),'--max-amount',MAX_USDC_ATOMIC,'--json'];
if(!o.execute){console.log(JSON.stringify({mode:'dry-run',networkRequestMade:false,paymentMade:false,endpoint:ENDPOINT,method:'POST',maxUsdcAtomic:MAX_USDC_ATOMIC,request:body,command:'npx',argv:args},null,2));process.exit(0);}
const r=spawnSync('npx',args,{encoding:'utf8',shell:false,stdio:['ignore','pipe','pipe'],maxBuffer:1024*1024});
if(r.error)throw r.error;
if(r.status!==0){if(r.stderr)process.stderr.write(r.stderr);process.exit(r.status??1);}
let result;
try{result=JSON.parse(r.stdout);}catch{throw new Error('Wallet command did not return valid JSON; block the import');}
const summary=result?.summary;
const hasStructuralErrors=summary&&Object.hasOwn(summary,'structuralErrors');
if(!summary||!Number.isSafeInteger(summary.errorCount)||summary.errorCount<0||(hasStructuralErrors&&(!Number.isSafeInteger(summary.structuralErrors)||summary.structuralErrors<0))){throw new Error('Wallet command did not return a valid preflight summary; block the import');}
process.stdout.write(JSON.stringify(result)+'\n');

