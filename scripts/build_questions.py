"""Compile curated questions and verify every evidence anchor against its source."""
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent
data = json.loads((root / 'data.json').read_text())
questions = []
counts = {}
for line in (root / 'scripts/questions.txt').read_text().splitlines():
    if not line or line.startswith('#'): continue
    fields = line.split('|')
    assert len(fields) == 8, line
    topic, prompt, answer, *tail = fields
    wrong, explanation, anchor = tail[:3], tail[3], tail[4]
    topic = int(topic)
    paragraphs = data['topics'][topic-1]['paragraphs']
    matches = [i for i,p in enumerate(paragraphs) if anchor in p]
    assert matches, (topic, anchor)
    counts[topic] = counts.get(topic, 0)+1
    questions.append({'id':f'{topic}-{counts[topic]}','topic':topic,'prompt':prompt,'options':[answer,*wrong],'answer':answer,'explanation':explanation,'sourceParagraph':matches[0],'anchor':anchor})
data['questions'] = questions
(root / 'data.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
print(f'{len(questions)} verified questions; focus: {sum(counts[t] for t in [4,5,6])}')
