import {MODEL,REVISION} from './detector.js';
let classifier;
self.onmessage=async({data})=>{
 try{
  if(!classifier){
   const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
   env.allowLocalModels=false;
   classifier=await pipeline('image-classification',MODEL,{revision:REVISION,device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'progress',text:'Downloading detector: '+Math.round(p.progress)+'%'});}});
  }
  self.postMessage({type:'progress',text:'Analyzing image on your device…'});
  const results=await classifier(data.url,{top_k:2});
  self.postMessage({type:'result',results});
 }catch(error){classifier=null;self.postMessage({type:'error',message:error.message});}
};
