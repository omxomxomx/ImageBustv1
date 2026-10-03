"""Convert the official Effort GenImage checkpoint to a browser model (noncommercial)."""
import argparse, hashlib, json, os
from pathlib import Path
import torch
from transformers import CLIPVisionConfig, CLIPVisionModel
from onnxruntime.quantization import quantize_dynamic, QuantType

parser=argparse.ArgumentParser()
parser.add_argument('--checkpoint',required=True)
parser.add_argument('--output',required=True)
args=parser.parse_args()
torch.set_num_threads(4)
expected='7c32ceb4e66d303050e8fc5dc7543fa347693fb4ee6b5df4d6eaf9f6a92fb813'
if hashlib.file_digest(open(args.checkpoint,'rb'),'sha256').hexdigest()!=expected:
 raise RuntimeError('Unexpected Effort checkpoint hash')
state=torch.load(args.checkpoint,map_location='cpu',weights_only=True)
state=state.get('state_dict',state)
state={k.removeprefix('module.'):v for k,v in state.items()}
merged={}
for k,v in state.items():
 if not k.startswith('backbone.'):continue
 key=k[len('backbone.'):]
 if key.endswith('.weight_main'):
  prefix=k[:-len('weight_main')]
  if prefix+'S_residual' in state:v=v+state[prefix+'U_residual']@torch.diag(state[prefix+'S_residual'])@state[prefix+'V_residual']
  merged[key[:-len('weight_main')]+'weight']=v
 elif any(key.endswith('.'+x) for x in ['S_residual','U_residual','V_residual','S_r','U_r','V_r']):continue
 else:merged[key]=v
config=CLIPVisionConfig(hidden_size=1024,intermediate_size=4096,num_hidden_layers=24,num_attention_heads=16,image_size=224,patch_size=14,hidden_act='quick_gelu',layer_norm_eps=1e-5)
config._attn_implementation='eager'
vision=CLIPVisionModel(config)
# Transformers 4 wraps the vision tower; Transformers 5 exposes it directly.
getattr(vision,'vision_model',vision).load_state_dict(merged,strict=True)
head=torch.nn.Linear(1024,2)
head.load_state_dict({k[5:]:v for k,v in state.items() if k.startswith('head.')},strict=True)
class Detector(torch.nn.Module):
 def __init__(self):super().__init__();self.vision=vision;self.head=head
 def forward(self,pixels):return self.head(self.vision(pixel_values=pixels).pooler_output)
model=Detector().eval()
del state,merged
out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
full=out.with_name('effort-fp32.onnx')
torch.onnx.export(model,torch.zeros(1,3,224,224),str(full),input_names=['pixels'],output_names=['logits'],opset_version=17,dynamo=False,external_data=False)
quantize_dynamic(str(full),str(out),weight_type=QuantType.QInt8,op_types_to_quantize=['MatMul'],per_channel=True)
import onnxruntime as ort
session=ort.InferenceSession(str(out),providers=['CPUExecutionProvider'])
session.run(None,{'pixels':torch.zeros(1,3,224,224).numpy()})
full.unlink()
print(json.dumps({'bytes':out.stat().st_size,'sha256':hashlib.file_digest(open(out,'rb'),'sha256').hexdigest()}))
