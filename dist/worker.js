import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.wasm.min.mjs';
let session;
ort.env.wasm.numThreads=1;
ort.env.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
async function loadModel(){
 const url=new URL('./models/effort-int8.onnx',import.meta.url).href;
 let cache;
 try{cache=await caches.open('image-bust-effort-v1');const stored=await cache.match(url);if(stored)return new Uint8Array(await stored.arrayBuffer());}catch{}
 const response=await fetch(url);
 if(!response.ok)throw Error('Model download failed: '+response.status);
 const total=Number(response.headers.get('content-length'));let received=0;
 const reader=response.body.getReader(),parts=[];
 while(true){const {done,value}=await reader.read();if(done)break;parts.push(value);received+=value.length;self.postMessage({type:'progress',text:'Downloading Effort: '+Math.round(received/1024/1024)+' MB'+(total?' / '+Math.round(total/1024/1024)+' MB':'')});}
 const bytes=new Uint8Array(received);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 try{await cache?.put(url,new Response(bytes));}catch{}
 return bytes;
}
self.onmessage=async({data})=>{
 try{
  if(!session){const bytes=await loadModel();self.postMessage({type:'progress',text:'Preparing Effort on your device…'});session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'});}
  const response=await fetch(data.url),bmp=await createImageBitmap(await response.blob());
  const canvas=new OffscreenCanvas(224,224),ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff';ctx.fillRect(0,0,224,224);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';ctx.drawImage(bmp,0,0,224,224);bmp.close();
  const pixels=ctx.getImageData(0,0,224,224).data,n=224*224,values=new Float32Array(n*3),mean=[.48145466,.4578275,.40821073],std=[.26862954,.26130258,.27577711];
  for(let i=0;i<n;i++)for(let c=0;c<3;c++)values[c*n+i]=(pixels[i*4+c]/255-mean[c])/std[c];
  self.postMessage({type:'progress',text:'Analyzing with Effort on your device…'});
  const result=await session.run({pixels:new ort.Tensor('float32',values,[1,3,224,224])});
  const logits=result.logits.data,score=1/(1+Math.exp(logits[0]-logits[1]));
  self.postMessage({type:'result',results:[{label:'fake',score},{label:'real',score:1-score}]});
 }catch(error){session=null;self.postMessage({type:'error',message:error.message});}
};
