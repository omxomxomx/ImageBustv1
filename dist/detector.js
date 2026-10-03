export const MODEL='Effort CLIP-L/14 (GenImage SD1.4), int8';
export const REVISION='checkpoint-sha256:7c32ceb4e66d303050e8fc5dc7543fa347693fb4ee6b5df4d6eaf9f6a92fb813';
export function interpret(results){
 const fake=results.find(r=>r.label==='fake'), real=results.find(r=>r.label==='real');
 if(!fake||!real||!Number.isFinite(fake.score)||!Number.isFinite(real.score)||fake.score<0||fake.score>1)throw new Error('Unexpected detector output.');
 const score=fake.score;
 return {score,verdict:score>=.8?'Likely AI-generated':score<=.2?'Likely camera-captured':'Inconclusive',explanation:score>=.8?'The model found patterns associated with generated images. This is not proof of AI use.':score<=.2?'The model favors its real-image class. AI generation or editing is still possible.':'The model does not strongly favor either class. Additional evidence is needed.'};
}
