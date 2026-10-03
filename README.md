# Image Bust

Run `node serve.mjs` from this folder, then open http://localhost:4173. Requires Node.js. Stop with Ctrl+C.

Verification: JavaScript syntax and verdict / invalid-output checks passed. A quantized-model inference smoke test produced both expected labels. Browser interaction and accuracy on real-world images have not yet been validated.

A static, browser-based AI image detector. Serve `dist` over HTTP (not file://). No API key required. Images remain in the browser; inference runs in a module Web Worker using Transformers.js 3.8.1 and a pinned ONNX model revision. Network access to jsDelivr and Hugging Face is required on initial load.

Accepts JPG, PNG, WebP up to 20 MB / 40 megapixels. Rejects unreadable images and unexpected model labels. Model failures display no score. Reports export as JSON. Directional labels use conservative interface thresholds of 20% and 80%; these are not validated operating points. No C2PA verification is implemented. Model outputs are not calibrated probabilities.

Model: https://huggingface.co/onnx-community/ai-image-detect-distilled-ONNX (MIT). Upstream model card: https://huggingface.co/jacoballessio/ai-image-detect-distilled. Evaluate on representative camera photos, current generators, edits, screenshots, and compression before production use. Author-reported model metrics have not been independently verified.
