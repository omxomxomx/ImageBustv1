# Image Bust — Effort experiment

Browser-based detection using Effort CLIP-L/14 (GenImage SD1.4), converted to int8 ONNX. Images stay on-device. No paid detection API is required. Effort is licensed CC BY-NC 4.0; this version is for noncommercial experimentation.

## GitHub Pages

Set Pages source to GitHub Actions. Pushes to main affecting dist, scripts, or the workflow deploy automatically. The first deployment downloads the official checkpoint, verifies its SHA-256, merges trained matrices, exports and quantizes ONNX, then validates inference and publishes the roughly 294 MB model with the app. The model is cached for subsequent deployments and is not committed to Git. First deployment may take several minutes; check Actions for success.

## Usage

Upload a JPG, PNG, or WebP under 20 MB / 40 megapixels. First analysis downloads about 294 MB and attempts browser caching. Desktop browsers are recommended. CPU WebAssembly inference can be slow and memory-intensive. Reports export as JSON. No C2PA verification is implemented.

## Validation and limitations

The tested Python model scored one known OpenAI PNG at 99.7%; int8 with OpenCV resizing scored 90.0%. A WebAssembly smoke test with a different resize implementation scored 99.7%, showing sensitivity to preprocessing. Canvas rendering may give another score. The original model scored a JPEG quality-75 variant at 57.3% and a cats photo control at 77.0%. These tests are not an accuracy benchmark; full photo provenance was not independently verified. Browser UI interaction testing is unverified.

Scores are not calibrated probabilities. The 20% / 80% interface thresholds are not validated operating points. Missing provenance does not establish authenticity.

## Local development

Run node serve.mjs and open http://localhost:4173. Generate dist/models/effort-int8.onnx using scripts/export_effort.py with the official checkpoint and the conversion dependencies pinned in the workflow, or download it from the deployed workflow artifact. Stop the server with Ctrl+C.

## Attribution

Official model, code, and CC BY-NC 4.0 license: https://github.com/YZY-stack/Effort-AIGI-Detection

Checkpoint: https://drive.google.com/file/d/1UXf1hC9FC1yV93uKwXSkdtepsgpIAU9d/view

Obtain appropriate permission before commercial use. Conversion preserves the trained attention-matrix algebra and all classifier weights; it does not change the license.
