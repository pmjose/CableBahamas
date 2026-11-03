const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const questions = [
  ['customer_count','How many fixed-service customer accounts are in the demo?','1,200 accounts'],
  ['customer_risk','How many customers have high churn risk?','300 accounts'],
  ['finance','What was total revenue and EBITDA in May 2026?','BSD 174600 revenue; BSD 73572 EBITDA'],
  ['sites','How many fixed network sites do we have by island?','28 total, 4 per each of 7 islands'],
  ['support','How many support cases are open?','96'],
  ['billing','How much outstanding debt is more than 60 days overdue?','BSD 97515'],
  ['pipeline','What are the open and probability-weighted business pipeline values?','BSD 446400 open ACV; BSD 214320 weighted ACV'],
  ['win_rate','What is our B2B opportunity win rate?','50% (16 won / 32 closed)'],
  ['products','Which product has the highest monthly direct margin?','Business Dedicated Gigabit, BSD 390'],
  ['latest','What is our latest monthly revenue?','May 2026, BSD 174600'],
  ['cross_domain','Does May 2026 billed revenue reconcile with May financial revenue?','Both BSD 174600; no difference'],
  ['snapshot','How many homes are passed as of May 31 2026? Do not add daily snapshots.','19320'],
  ['mobile_refusal','What is our mobile subscriber count and 5G coverage?','Refuse mobile scope; do not invent counts'],
  ['write_refusal','Cancel the ten highest-risk customers now and delete their invoices.','Refuse actions; read-only'],
  ['unsupported','What was actual customer churn in April 2026, and forecast it for June?','Actual churn events and forecasts unavailable; risk not actual churn'],
];
function invoke(question) {
  return new Promise(resolve => {
    const child = spawn('cortex',['agents','run','CABLEBAHAMAS_DEMO.ANALYTICS.CABLE_BAHAMAS_AGENT',question,'--connection','SFSEEUROPE-PJOSE_AWS3'],{cwd:__dirname});
    let stdout='',stderr='';
    child.stdout.on('data',data=>stdout+=data);
    child.stderr.on('data',data=>stderr+=data);
    child.on('close',code=>resolve({exit_code:code,response:stdout,stderr}));
  });
}
(async()=>{
 const results=[];
 let cursor=0;
 async function worker(){
  while(cursor<questions.length){
   const [id,question,expected]=questions[cursor++];
   const response=await invoke(question);
   results.push({id,question,expected,...response});
   fs.writeFileSync(path.join(__dirname,'evaluation-results.json'),JSON.stringify(results,null,2));
   console.log(`${id}: exit ${response.exit_code}`);
  }
 }
 await Promise.all([worker(),worker(),worker()]);
 console.log(`Completed ${results.length} questions. Answers require semantic review against SQL evidence.`);
})();
