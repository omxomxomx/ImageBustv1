import {interpret,MODEL,REVISION} from './detector.js';
const $=id=>document.getElementById(id);let selected,url,worker,report,busy=false;
function resetReport(){report=null;$('download').disabled=true;$('score-block').hidden=true;$('verdict').textContent='Ready to analyze';$('explanation').textContent='Run the detector to see an estimate.';$('detection').textContent='Not run';$('state').textContent='READY';}
async function select(file){
 if(busy||!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024){$('status').textContent='Choose a JPG, PNG, or WebP image smaller than 20 MB.';return;}
 const candidate=URL.createObjectURL(file);const img=new Image();
 try{img.src=candidate;await img.decode();if(img.naturalWidth*img.naturalHeight>40000000)throw Error('Choose an image under 40 megapixels.');}
 catch(e){URL.revokeObjectURL(candidate);$('status').textContent=e.message.startsWith('Choose')?e.message:'This image could not be opened. Try another file.';return;}
 if(url)URL.revokeObjectURL(url);url=candidate;selected={file,width:img.naturalWidth,height:img.naturalHeight};$('preview').src=url;$('preview').hidden=false;$('empty').hidden=true;
 $('file-info').textContent=file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB';$('dimensions').textContent=selected.width+' × '+selected.height;$('analyze').disabled=false;$('status').textContent='Image ready. First analysis downloads the detector.';resetReport();
}
$('file').addEventListener('change',e=>select(e.target.files[0]));
for(const name of ['dragenter','dragover'])$('drop').addEventListener(name,e=>{e.preventDefault();$('drop').classList.add('drag');});
for(const name of ['dragleave','drop'])$('drop').addEventListener(name,e=>{e.preventDefault();$('drop').classList.remove('drag');if(name==='drop')select(e.dataTransfer.files[0]);});
function finish(){busy=false;$('file').disabled=false;$('analyze').disabled=false;$('analyze').textContent='Analyze again';clearTimeout(timer);}
let timer;
$('analyze').onclick=()=>{
 if(!selected||busy)return;resetReport();busy=true;$('analyze').disabled=true;$('file').disabled=true;$('analyze').textContent='Analyzing…';$('state').textContent='RUNNING';$('status').textContent='Loading detector. The first run may take a few minutes.';
 try{
 if(!worker)worker=new Worker('./worker.js',{type:'module'});
 const fail=()=>{finish();worker?.terminate();worker=null;$('state').textContent='UNAVAILABLE';$('verdict').textContent='Analysis unavailable';$('explanation').textContent='No estimate was produced. Check your connection or try another browser.';$('status').textContent='Detector could not complete. You can retry.';};
 worker.onerror=fail;
 worker.onmessage=({data})=>{if(data.type==='progress'){$('status').textContent=data.text;return;}if(data.type==='error'){fail();return;}try{const result=interpret(data.results);report={filename:selected.file.name,dimensions:{width:selected.width,height:selected.height},analyzedAt:new Date().toISOString(),model:MODEL,revision:REVISION,...result,rawScores:data.results,provenance:'Not verified',limitations:'Model scores are not calibrated probabilities. Results can be wrong; no authenticity guarantee.'};$('verdict').textContent=result.verdict;$('explanation').textContent=result.explanation;$('score').textContent=(result.score*100).toFixed(1)+'%';$('bar').style.width=result.score*100+'%';$('score-block').hidden=false;$('detection').textContent='Complete';$('state').textContent='COMPLETE';$('download').disabled=false;$('status').textContent='Analysis complete. Your image stayed on this device.';finish();}catch{fail();}};
 timer=setTimeout(fail,900000);worker.postMessage({url});
 }catch{finish();$('state').textContent='UNAVAILABLE';$('status').textContent='This browser cannot start the detector. Try a current browser.';}
};
$('download').onclick=()=>{if(!report)return;const objectURL=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=objectURL;a.download='image-bust-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);};
