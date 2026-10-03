export const MODEL='onnx-community/ai-image-detect-distilled-ONNX';
export const REVISION='7f067e23521eeb6d6525221af82c613fb746aaff';
export function interpret(results){
 const fake=results.find(r=>r.label==='fake'), real=results.find(r=>r.label==='real');
 if(!fake||!real||!Number.isFinite(fake.score)||!Number.isFinite(real.score)||fake.score<0||fake.score>1)throw new Error('Unexpected detector output.');
 const score=fake.score;
 return {score,verdict:score>=.8?'Likely AI-generated':score<=.2?'Likely camera-captured':'Inconclusive',explanation:score>=.8?'The model found patterns associated with generated images. This is not proof of AI use.':score<=.2?'The model favors its real-image class. AI generation or editing is still possible.':'The model does not strongly favor either class. Additional evidence is needed.'};
}
